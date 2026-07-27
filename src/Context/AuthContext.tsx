import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { UserResponse } from '@types';

interface AuthContextProps {
  accessToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: UserResponse, remember?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accessToken, user, isAuthenticated, login, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <AuthContext.Provider value={{ accessToken, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
