import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

/**
 * User session/token payload
 */
export interface UserPayload {
  userId: string;
  userName: string;
  email: string;
  role: 'analyst' | 'admin' | 'viewer';
  iat?: number;
  exp?: number;
}

/**
 * Create a JWT token
 */
export async function createToken(user: UserPayload, expiresIn: string = '24h'): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = calculateExpirationTime(expiresIn);

  return new SignJWT({ ...user, iat: now })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as UserPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate expiration time based on duration string
 */
function calculateExpirationTime(duration: string): number {
  const now = Math.floor(Date.now() / 1000);
  const match = duration.match(/^(\d+)([hmd])$/);

  if (!match) {
    throw new Error('Invalid duration format. Use: 1h, 7d, 30m');
  }

  const [, amount, unit] = match;
  const num = parseInt(amount, 10);

  switch (unit) {
    case 'h':
      return now + num * 3600;
    case 'd':
      return now + num * 86400;
    case 'm':
      return now + num * 60;
    default:
      throw new Error('Invalid duration unit');
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: UserPayload): boolean {
  if (!token.exp) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return token.exp < now;
}

/**
 * Hash password (placeholder - use bcrypt in production)
 */
export async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or argon2
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const hashPassword = await hashPassword(password);
  return hashPassword === hash;
}
