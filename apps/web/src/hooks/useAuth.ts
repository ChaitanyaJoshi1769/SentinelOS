'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import axios from 'axios';

export interface AuthUser {
  userId: string;
  userName: string;
  email: string;
  role: 'analyst' | 'admin' | 'viewer';
}

interface UseAuthReturn {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: string[]) => boolean;
}

/**
 * Authentication hook for managing user login/logout
 */
export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user from store
  const storeUser = useAppStore((state) => ({
    userId: state.userId,
    userName: state.userName,
    userRole: state.userRole,
  }));

  const setUser = useAppStore((state) => state.setUser);
  const clearUser = useAppStore((state) => state.clearUser);

  // Reconstruct user object from store
  const user: AuthUser | null =
    storeUser.userId && storeUser.userName && storeUser.userRole
      ? {
          userId: storeUser.userId,
          userName: storeUser.userName,
          email: `${storeUser.userName}@sentinelos.local`,
          role: storeUser.userRole,
        }
      : null;

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser.userId, parsedUser.userName, parsedUser.role);
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setLoading(false);
  }, [setUser]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.post('/api/auth/login', {
          username,
          password,
        });

        if (response.data.success) {
          const { token: newToken, user: newUser } = response.data.data;

          // Store token and user
          localStorage.setItem('auth_token', newToken);
          localStorage.setItem('auth_user', JSON.stringify(newUser));

          // Update state
          setToken(newToken);
          setUser(newUser.userId, newUser.userName, newUser.role);

          // Set default auth header for axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          return true;
        } else {
          setError(response.data.error || 'Login failed');
          return false;
        }
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : 'Login failed';
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    clearUser();
    delete axios.defaults.headers.common['Authorization'];
  }, [clearUser]);

  const hasRole = useCallback(
    (...roles: string[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    hasRole,
  };
}
