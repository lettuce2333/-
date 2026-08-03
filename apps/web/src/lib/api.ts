const API_BASE = '/api';

async function request(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (options.body && typeof options.body === 'string') {
    try {
      JSON.parse(options.body);
      headers['Content-Type'] = 'application/json';
    } catch { /* not json */ }
  }

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '请求失败' }));
    const e: any = new Error(err.message || `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }

  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: (url: string) => request(url),
  post: (url: string, data?: unknown) => request(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: (url: string, data?: unknown) => request(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: (url: string) => request(url, { method: 'DELETE' }),
  upload: async (file: File) => {
    const token = localStorage.getItem('token');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error('上传失败');
    return res.json();
  },
};
