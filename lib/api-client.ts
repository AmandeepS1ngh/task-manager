/**
 * Client-side API helper.
 * Sends Bearer token from localStorage with every request.
 */

const BASE = '';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('sb_token') ?? '';
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(BASE + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...options?.headers,
      },
    });

    const json = await res.json();
    return json;
  } catch {
    return { data: null, error: 'Network error — please try again' };
  }
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};
