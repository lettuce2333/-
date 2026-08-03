'use client';
import { create } from 'zustand';
import { api } from './api';

interface User {
  id: number;
  email: string;
  nickname: string | null;
  roles: { id: number; userId: number; role: string }[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  loading: true,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.accessToken);
    set({ token: res.accessToken, user: res.user });
  },

  register: async (email, password, nickname) => {
    const res = await api.post('/auth/register', { email, password, nickname });
    localStorage.setItem('token', res.accessToken);
    set({ token: res.accessToken, user: res.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchProfile: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { set({ loading: false }); return; }
      const user = await api.get('/auth/me');
      set({ user, loading: false });
    } catch (e: any) {
      if (e?.status === 401) {
        localStorage.removeItem('token');
        set({ user: null, token: null, loading: false });
      } else {
        set({ loading: false });
      }
    }
  },
}));
