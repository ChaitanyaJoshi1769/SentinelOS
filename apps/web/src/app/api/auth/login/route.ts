import { NextRequest } from 'next/server';
import { createToken, hashPassword, comparePassword } from '@/lib/auth';
import { successResponse, validationError, unauthorizedError } from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import { parseBody } from '@/lib/request';

const logger = createLogger('auth-login');

/**
 * Mock user database - in production, use real database
 */
const MOCK_USERS = [
  {
    userId: 'user_001',
    userName: 'admin',
    email: 'admin@sentinelos.local',
    role: 'admin' as const,
    passwordHash: 'admin123', // In production, use hashed password
  },
  {
    userId: 'user_002',
    userName: 'analyst',
    email: 'analyst@sentinelos.local',
    role: 'analyst' as const,
    passwordHash: 'analyst123',
  },
];

/**
 * POST /api/auth/login
 * Login with username and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request);

    const { username, password } = body;

    if (!username || !password) {
      return validationError('username and password are required');
    }

    logger.debug('Login attempt', { username });

    // Find user by username
    const user = MOCK_USERS.find((u) => u.userName === username);

    if (!user) {
      logger.warn('Login failed: user not found', { username });
      return unauthorizedError('Invalid username or password');
    }

    // In production, use proper password comparison
    // const passwordMatch = await comparePassword(password, user.passwordHash);
    const passwordMatch = password === user.passwordHash;

    if (!passwordMatch) {
      logger.warn('Login failed: invalid password', { username });
      return unauthorizedError('Invalid username or password');
    }

    // Create JWT token
    const token = await createToken(
      {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      '24h'
    );

    logger.info('Login successful', { userId: user.userId, userName: user.userName });

    return successResponse({
      token,
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error', error as Error);
    return unauthorizedError('Login failed');
  }
}
