import { useEffect, useMemo, useState } from 'react';
import { Item } from '@/types';
import { resolveBookCoverUrl } from '@/lib/openLibrary';

/**
 * Returns an image URL for an item.
 * - For books: tries Open Library covers first and falls back to item.images[0].
 * - For other categories: uses item.images[0].
 */
export function useResolvedItemImage(item: Item) {
  const fallback = useMemo(() => item.images[0], [item.images]);
  const [src, setSrc] = useState(fallback);

  // Keep in sync if item changes
  useEffect(() => {
    setSrc(fallback);
  }, [fallback]);

  useEffect(() => {
    if (item.category !== 'books') return;

    const controller = new AbortController();

    resolveBookCoverUrl(item.title, controller.signal)
      .then((coverUrl) => {
        if (coverUrl) setSrc(coverUrl);
      })
      .catch(() => {
        // ignore
      });

    return () => controller.abort();
  }, [item.category, item.title]);

  return src;
}
