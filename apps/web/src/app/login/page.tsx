'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Login Page
 * Handles user authentication
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/investigations');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    if (!username || !password) {
      setFormError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    const success = await login(username, password);

    if (success) {
      router.push('/investigations');
    } else {
      setFormError(error || 'Login failed');
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300">
      <div className="card w-full max-w-md shadow-2xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">SentinelOS</h1>
            <p className="text-sm opacity-75 mt-1">Security Operations Platform</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {formError && (
              <div className="alert alert-error mb-4">
                <span>{formError}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                className="input input-bordered"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="divider my-4">OR TRY DEMO</div>
          <div className="space-y-2 text-sm opacity-75">
            <p>
              <strong>Admin:</strong> admin / admin123
            </p>
            <p>
              <strong>Analyst:</strong> analyst / analyst123
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-xs opacity-50 mt-6">
            <p>For demonstration purposes only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
