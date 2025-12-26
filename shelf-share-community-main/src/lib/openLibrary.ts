// Lightweight Open Library cover resolver.
// We fetch a book cover at runtime (instead of bundling cover images into the repo).
// Docs: https://openlibrary.org/developers/api

const coverCache = new Map<string, string | null>();

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function parseTitleAndAuthor(rawTitle: string): { title: string; author?: string } {
  const trimmed = rawTitle.trim();

  // Common separators used in this project
  const separators = [' — ', ' – ', ' - '];
  for (const sep of separators) {
    const idx = trimmed.indexOf(sep);
    if (idx > 0) {
      const title = trimmed.slice(0, idx).trim();
      const author = trimmed.slice(idx + sep.length).trim();
      if (title && author) {
        return { title, author };
      }
    }
  }

  // "Title by Author"
  const byMatch = trimmed.match(/^(.*)\s+by\s+(.+)$/i);
  if (byMatch) {
    return { title: byMatch[1].trim(), author: byMatch[2].trim() };
  }

  return { title: trimmed };
}

function preloadImage(url: string, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    // Guard for non-browser environments
    if (typeof Image === 'undefined') {
      resolve(true);
      return;
    }

    const img = new Image();

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    if (signal) {
      if (signal.aborted) {
        cleanup();
        resolve(false);
        return;
      }
      signal.addEventListener(
        'abort',
        () => {
          cleanup();
          resolve(false);
        },
        { once: true }
      );
    }

    img.onload = () => {
      cleanup();
      resolve(true);
    };
    img.onerror = () => {
      cleanup();
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Resolves a book cover URL from Open Library using the item title.
 * Returns null if no cover was found.
 */
export async function resolveBookCoverUrl(
  rawTitle: string,
  signal?: AbortSignal
): Promise<string | null> {
  const key = normalizeKey(rawTitle);
  if (coverCache.has(key)) return coverCache.get(key) ?? null;

  const { title, author } = parseTitleAndAuthor(rawTitle);

  const params = new URLSearchParams();
  params.set('title', title);
  params.set('limit', '1');
  params.set('fields', 'cover_i');
  if (author) params.set('author', author);

  const searchUrl = `https://openlibrary.org/search.json?${params.toString()}`;

  try {
    const res = await fetch(searchUrl, { signal });
    if (!res.ok) {
      coverCache.set(key, null);
      return null;
    }

    const data = await res.json();
    const coverId: number | undefined = data?.docs?.[0]?.cover_i;

    if (!coverId) {
      coverCache.set(key, null);
      return null;
    }

    // Large cover. If it's missing/broken, we won't use it.
    const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    const ok = await preloadImage(coverUrl, signal);

    coverCache.set(key, ok ? coverUrl : null);
    return coverCache.get(key) ?? null;
  } catch {
    coverCache.set(key, null);
    return null;
  }
}
