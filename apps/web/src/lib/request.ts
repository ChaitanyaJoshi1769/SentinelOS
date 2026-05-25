import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';
import { ValidationError } from './errors';

/**
 * Parse and validate URL search parameters
 */
export function parseQueryParams(
  request: NextRequest,
  schema?: ZodSchema
): Record<string, string | string[]> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });

  if (schema) {
    const result = schema.safeParse(params);
    if (!result.success) {
      throw new ValidationError(`Invalid query parameters: ${result.error.message}`);
    }
    return result.data;
  }

  return params;
}

/**
 * Get a single query parameter with optional validation
 */
export function getQueryParam(
  request: NextRequest,
  name: string,
  defaultValue?: string
): string | undefined {
  const { searchParams } = new URL(request.url);
  return searchParams.get(name) || defaultValue;
}

/**
 * Parse JSON body with optional validation
 */
export async function parseBody<T>(
  request: NextRequest,
  schema?: ZodSchema
): Promise<T> {
  try {
    const body = await request.json();

    if (schema) {
      const result = schema.safeParse(body);
      if (!result.success) {
        throw new ValidationError(
          `Invalid request body: ${result.error.message}`
        );
      }
      return result.data as T;
    }

    return body as T;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Get authentication token from headers
 */
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token || null;
}

/**
 * Get request IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  return '127.0.0.1';
}

/**
 * Check if request content type matches expected type
 */
export function isContentType(
  request: NextRequest,
  expected: string
): boolean {
  const contentType = request.headers.get('content-type');
  if (!contentType) {
    return false;
  }

  return contentType.includes(expected);
}

/**
 * Get request metadata
 */
export function getRequestMetadata(request: NextRequest): {
  method: string;
  url: string;
  ip: string;
  userAgent: string | null;
  referer: string | null;
} {
  return {
    method: request.method,
    url: request.url,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  };
}
