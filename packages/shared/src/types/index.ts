/**
 * Central export of all shared types
 */

export * from './telemetry';
export * from './errors';
export * from './graph';
export * from './agent';
export * from './config';

/**
 * Pagination
 */
export interface PaginationParams {
  limit: number;
  offset: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  next_cursor?: string;
}

/**
 * Request/Response
 */
export interface ApiRequest<T> {
  id: string;
  timestamp: number;
  user_id?: string;
  tenant_id: string;
  body: T;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    request_id: string;
    timestamp: number;
    duration_ms: number;
  };
}

/**
 * Tenant context
 */
export interface TenantContext {
  tenant_id: string;
  tenant_name: string;
  organization_id: string;
  region: string;
  tier: 'starter' | 'professional' | 'enterprise';
}

/**
 * User context
 */
export interface UserContext {
  user_id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  tenant_id: string;
}

/**
 * Request context combining tenant and user
 */
export interface RequestContext {
  tenant: TenantContext;
  user: UserContext;
  request_id: string;
  timestamp: number;
  source_ip?: string;
  user_agent?: string;
}

/**
 * Event streaming messages
 */
export interface StreamMessage<T> {
  type: 'data' | 'status' | 'error' | 'complete';
  data?: T;
  status?: {
    progress: number;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

/**
 * Batch operations
 */
export interface BatchOperation<T> {
  operation_id: string;
  items: T[];
  created_at: number;
  completed_at?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    processed: number;
    total: number;
    failed: number;
  };
  results?: {
    successful: Array<{ item_index: number; result: any }>;
    failed: Array<{ item_index: number; error: string }>;
  };
}
