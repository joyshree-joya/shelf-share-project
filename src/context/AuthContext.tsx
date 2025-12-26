import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

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

const MOCK_USERS: { email: string; password: string; user: User }[] = [
  {
    email: 'demo@shelfshare.com',
    password: 'demo123',
    user: {
      id: '1',
      name: 'Sudipto Shawon',
      email: 'demo@shelfshare.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      donorPoints: 35,
      badge: 'silver',
      createdAt: '2024-01-15T10:00:00Z',
    },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('shelfshare_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (found) {
      setUser(found.user);
      localStorage.setItem('shelfshare_user', JSON.stringify(found.user));
      return { success: true };
    }

    // Allow any email/password for demo purposes
    const newUser: User = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      email,
      donorPoints: 0,
      badge: 'none',
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem('shelfshare_user', JSON.stringify(newUser));
    return { success: true };
  };

  const register = async (name: string, email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check if email exists
    if (MOCK_USERS.some((u) => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      donorPoints: 0,
      badge: 'none',
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem('shelfshare_user', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shelfshare_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('shelfshare_user', JSON.stringify(updatedUser));
    }
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
