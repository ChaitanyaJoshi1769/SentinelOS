/**
 * Error handling for SentinelOS
 */

export class SentinelOSError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SentinelOSError';
  }
}

export class ValidationError extends SentinelOSError {
  constructor(message: string, context?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends SentinelOSError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found: ${id}`, 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

export class AuthorizationError extends SentinelOSError {
  constructor(message: string = 'Unauthorized') {
    super('AUTHORIZATION_ERROR', message, 401);
    this.name = 'AuthorizationError';
  }
}

export class InvestigationError extends SentinelOSError {
  constructor(message: string, context?: Record<string, any>) {
    super('INVESTIGATION_ERROR', message, 500, context);
    this.name = 'InvestigationError';
  }
}

export class GraphError extends SentinelOSError {
  constructor(message: string, context?: Record<string, any>) {
    super('GRAPH_ERROR', message, 500, context);
    this.name = 'GraphError';
  }
}

export class RemediationError extends SentinelOSError {
  constructor(message: string, context?: Record<string, any>) {
    super('REMEDIATION_ERROR', message, 500, context);
    this.name = 'RemediationError';
  }
}

export class TelemetryError extends SentinelOSError {
  constructor(message: string, context?: Record<string, any>) {
    super('TELEMETRY_ERROR', message, 500, context);
    this.name = 'TelemetryError';
  }
}

export class DetectionEngineError extends SentinelOSError {
  constructor(message: string, context?: Record<string, any>) {
    super('DETECTION_ENGINE_ERROR', message, 500, context);
    this.name = 'DetectionEngineError';
  }
}

/**
 * Result type for operations that might fail
 */
export type Result<T, E = SentinelOSError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T> => ({
  ok: true,
  value,
});

export const Err = <E>(error: E): Result<any, E> => ({
  ok: false,
  error,
});

export const isOk = <T>(result: Result<T>): result is { ok: true; value: T } => result.ok;

export const isErr = <T>(result: Result<T>): result is { ok: false; error: any } => !result.ok;
