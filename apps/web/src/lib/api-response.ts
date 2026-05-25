import { NextResponse } from 'next/server';

/**
 * Standard API Response Type
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: number;
}

/**
 * Standard Paginated Response Type
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  count: number;
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * Create a successful response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: Date.now(),
    },
    { status: statusCode }
  );
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  count: number = data.length,
  page: number = 1,
  pageSize: number = 50,
  statusCode: number = 200
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      count,
      total,
      page,
      pageSize,
      timestamp: Date.now(),
    },
    { status: statusCode }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      timestamp: Date.now(),
    },
    { status: statusCode }
  );
}

/**
 * Create a validation error response
 */
export function validationError(
  message: string,
  code: string = 'VALIDATION_ERROR'
): NextResponse<ApiResponse> {
  return errorResponse(message, 400, code);
}

/**
 * Create a not found error response
 */
export function notFoundError(
  resource: string
): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedError(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Create a forbidden error response
 */
export function forbiddenError(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Wrapper for try-catch with automatic error handling
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    console.error(message, error);
    return { success: false, error: message };
  }
}
