export class ApiError extends Error {
  status: number;
  bodyText?: string;

  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.bodyText = bodyText;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || res.statusText, res.status, text);
  }

  // Some endpoints can return empty responses.
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return (undefined as unknown) as T;
  }
  return (await res.json()) as T;
}
