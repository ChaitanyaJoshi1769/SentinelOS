/**
 * Custom API Error Classes
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter: number = 60) {
    super(429, 'RATE_LIMIT_EXCEEDED', `Too many requests. Retry after ${retryAfter} seconds.`);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database error') {
    super(500, 'DATABASE_ERROR', message);
    this.name = 'DatabaseError';
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(service: string = 'Service') {
    super(503, 'SERVICE_UNAVAILABLE', `${service} is temporarily unavailable`);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Error handler utility
 */
export function handleError(error: unknown): {
  statusCode: number;
  code: string;
  message: string;
} {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: error.message,
    };
  }

  return {
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  };
}
