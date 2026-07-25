const API_BASE = '/api';
async function request(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({ message: '请求失败' })); throw new Error(err.message || `HTTP ${res.status}`); }
  return res.json();
}
export const api = {
  get: (url: string) => request(url),
  post: (url: string, data?: unknown) => request(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: (url: string, data?: unknown) => request(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: (url: string) => request(url, { method: 'DELETE' }),
};
