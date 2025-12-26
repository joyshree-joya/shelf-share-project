import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { apiFetch } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthResponse = { token: string; user: User };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('shelfshare_token');

      if (!token) {
        // With real auth, a token is required to consider the session valid.
        localStorage.removeItem('shelfshare_user');
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const me = await apiFetch<User>('/users/me');
        setUser(me);
        localStorage.setItem('shelfshare_user', JSON.stringify(me));
      } catch (_err) {
        localStorage.removeItem('shelfshare_token');
        localStorage.removeItem('shelfshare_user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void boot();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { token, user } = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('shelfshare_token', token);
      localStorage.setItem('shelfshare_user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { token, user } = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      localStorage.setItem('shelfshare_token', token);
      localStorage.setItem('shelfshare_user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Register failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shelfshare_user');
    localStorage.removeItem('shelfshare_token');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const optimistic = { ...user, ...updates };
    setUser(optimistic);
    localStorage.setItem('shelfshare_user', JSON.stringify(optimistic));
    void apiFetch<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }).then((serverUser) => {
      setUser(serverUser);
      localStorage.setItem('shelfshare_user', JSON.stringify(serverUser));
    }).catch(() => {
      // Ignore failures for now; UI already updated.
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
