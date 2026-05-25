'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ProtectedRoute');

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 * Redirects to unauthorized if missing required role
 */
export default function ProtectedRoute({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      logger.warn('Unauthorized access attempt');
      router.push('/login');
      return;
    }

    if (!loading && requiredRoles.length > 0 && user) {
      const hasRequiredRole = requiredRoles.includes(user.role);
      if (!hasRequiredRole) {
        logger.warn('Insufficient permissions', {
          userId: user.userId,
          userRole: user.role,
          requiredRoles,
        });
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, user, loading, requiredRoles, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Show unauthorized if user doesn't have required roles
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
          <p className="text-lg opacity-75 mb-6">
            You do not have permission to access this page.
          </p>
          <a href="/investigations" className="btn btn-primary">
            Go Back
          </a>
        </div>
      </div>
    );
  }

  // Show content if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  return null;
}
