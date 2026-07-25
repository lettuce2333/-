'use client';
import { useEffect, useState } from 'react';
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
let addToast: (t: Omit<Toast, 'id'>) => void = () => {};
export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') { addToast({ message, type }); }
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => { addToast = (t) => { const id = Date.now(); setToasts((p) => [...p, { ...t, id }]); setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3000); }; }, []);
  return <div className="fixed bottom-4 right-4 z-50 space-y-2">{toasts.map((t) => (<div key={t.id} className={`rounded-lg px-4 py-3 text-sm text-white shadow-lg ${t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>{t.message}</div>))}</div>;
}
