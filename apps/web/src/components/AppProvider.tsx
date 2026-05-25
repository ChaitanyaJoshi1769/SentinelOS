'use client';

import React, { useEffect, ReactNode } from 'react';
import { initializeAxios } from '@/lib/axios-config';
import { useAuth } from '@/hooks/useAuth';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * App Provider Component
 * Initializes global app setup like axios, authentication, etc.
 */
export default function AppProvider({ children }: AppProviderProps) {
  const { isAuthenticated } = useAuth();

  // Initialize axios on mount
  useEffect(() => {
    initializeAxios();
  }, []);

  return <>{children}</>;
}
