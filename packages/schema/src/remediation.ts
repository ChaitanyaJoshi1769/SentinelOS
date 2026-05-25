import { z } from 'zod';

/**
 * Remediation Schema Definitions
 * Defines types for remediation actions, approvals, and executions
 */

export const RemediationActionSchema = z.object({
  action_id: z.string(),
  action_type: z.enum(['isolate', 'terminate', 'reset', 'block', 'snapshot', 'alert']),
  target_type: z.enum(['endpoint', 'user', 'network', 'process', 'connection']),
  target_id: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string(),
  estimated_impact: z.string(),
  estimated_duration_seconds: z.number(),
  rollback_possible: z.boolean(),
  rollback_steps: z.array(z.string()).optional(),
  requires_approval: z.boolean(),
  approval_justification: z.string(),
  execution_order: z.number(),
  tags: z.array(z.string()).optional(),
  investigation_id: z.string().optional(),
});

export type RemediationAction = z.infer<typeof RemediationActionSchema>;

export const ApprovalRequestSchema = z.object({
  request_id: z.string(),
  action_id: z.string(),
  action_description: z.string(),
  investigation_id: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  requested_by: z.string(),
  requested_at: z.number(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  approver: z.string().optional(),
  approval_time: z.number().optional(),
  approval_notes: z.string().optional(),
  expires_at: z.number(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

export const ExecutionResultSchema = z.object({
  action_id: z.string(),
  status: z.enum(['pending', 'executing', 'completed', 'failed', 'rolled_back']),
  started_at: z.number().optional(),
  completed_at: z.number().optional(),
  result_data: z.record(z.any()).optional(),
  error: z.string().optional(),
  execution_log: z.array(z.string()),
  rollback_log: z.array(z.string()).optional(),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const RemediationWorkflowSchema = z.object({
  workflow_id: z.string(),
  investigation_id: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
  status: z.enum(['created', 'approved', 'executing', 'completed', 'failed', 'rolled_back']),
  actions: z.array(RemediationActionSchema),
  approvals: z.array(ApprovalRequestSchema),
  executions: z.array(ExecutionResultSchema),
  created_by: z.string(),
});

export type RemediationWorkflow = z.infer<typeof RemediationWorkflowSchema>;
