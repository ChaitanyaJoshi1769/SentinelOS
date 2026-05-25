import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, UserPayload } from './auth';
import { unauthorizedError } from './api-response';
import { createLogger } from './logger';

const logger = createLogger('auth-middleware');

/**
 * Extract and verify JWT token from request
 */
export async function getAuthUser(request: NextRequest): Promise<UserPayload | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  const user = await verifyToken(token);

  if (!user) {
    return null;
  }

  return user;
}

/**
 * Require authentication middleware
 * Returns the user if authenticated, or an error response if not
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: UserPayload; response: null } | { user: null; response: NextResponse }> {
  const user = await getAuthUser(request);

  if (!user) {
    logger.warn('Unauthorized request', { url: request.url });
    return {
      user: null,
      response: unauthorizedError('Invalid or missing authentication token'),
    };
  }

  return { user, response: null };
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]) {
  return (user: UserPayload): boolean => {
    return roles.includes(user.role);
  };
}

/**
 * Check if user has required role
 */
export function checkRole(user: UserPayload, ...roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Middleware wrapper for route handlers that require authentication
 */
export function withAuth<T extends (...args: any[]) => Promise<any>>(
  handler: (req: NextRequest, user: UserPayload) => Promise<any>
) {
  return async (req: NextRequest) => {
    const { user, response } = await requireAuth(req);

    if (!user) {
      return response;
    }

    return handler(req, user);
  };
}

/**
 * Middleware wrapper for role-based route handlers
 */
export function withRoleAuth<T extends (...args: any[]) => Promise<any>>(
  handler: (req: NextRequest, user: UserPayload) => Promise<any>,
  ...allowedRoles: string[]
) {
  return async (req: NextRequest) => {
    const { user, response } = await requireAuth(req);

    if (!user) {
      return response;
    }

    if (!checkRole(user, ...allowedRoles)) {
      logger.warn('Forbidden: insufficient permissions', {
        userId: user.userId,
        userRole: user.role,
        allowedRoles,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    return handler(req, user);
  };
}
