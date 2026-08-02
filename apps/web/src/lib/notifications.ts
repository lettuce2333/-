import { create } from 'zustand';
import { api } from './api';

interface UnreadState {
  count: number;
  refresh: () => Promise<void>;
  setCount: (count: number) => void;
  decrement: () => void;
}

export const useUnread = create<UnreadState>((set, get) => ({
  count: 0,
  refresh: async () => {
    try {
      const res: any = await api.get('/notifications/unread-count');
      set({ count: res?.count || 0 });
    } catch {
      set({ count: 0 });
    }
  },
  setCount: (count) => set({ count }),
  decrement: () => set({ count: Math.max(0, get().count - 1) }),
}));
