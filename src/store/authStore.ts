import { create } from 'zustand';
import type { UserResponse } from '@types';

interface AuthState {
  accessToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserResponse | null) => void;
  login: (accessToken: string, user: UserResponse, remember?: boolean) => void;
  logout: () => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setAccessToken: (accessToken) => {
    set({ accessToken, isAuthenticated: !!accessToken });
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      const storage = localStorage.getItem('accessToken') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  },

  login: (accessToken, user, remember = false) => {
    set({ accessToken, user, isAuthenticated: true });
    if (remember) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  },

  logout: () => {
    set({ accessToken: null, user: null, isAuthenticated: false });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
  },

  clearAuth: () => {
    set({ accessToken: null, user: null, isAuthenticated: false });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
  },

  hydrate: () => {
    const token =
      localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const userRaw =
      localStorage.getItem('user') || sessionStorage.getItem('user');
    const user = userRaw ? (JSON.parse(userRaw) as UserResponse) : null;
    set({ accessToken: token, user, isAuthenticated: !!token });
  },
}));

