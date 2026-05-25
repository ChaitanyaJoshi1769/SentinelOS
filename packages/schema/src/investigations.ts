import { z } from 'zod';

/**
 * Investigation Schema Definitions
 * Defines types for security investigations, findings, and timeline events
 */

export const FindingSchema = z.object({
  finding_id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  evidence: z.array(z.string()),
  mitre_techniques: z.array(z.string()).optional(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const TimelineEventSchema = z.object({
  event_id: z.string().optional(),
  timestamp: z.number(),
  event_type: z.string(),
  entity_id: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  source_system: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const InvestigationSchema = z.object({
  investigation_id: z.string(),
  alert_id: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
  status: z.enum(['open', 'investigating', 'complete', 'false_positive']),
  confidence: z.number().min(0).max(1),
  findings: z.array(FindingSchema),
  timeline: z.array(TimelineEventSchema),
  recommendations: z.array(z.string()),
  ai_narrative: z.string(),
  assigned_analyst: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type Investigation = z.infer<typeof InvestigationSchema>;

export const InvestigationListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(InvestigationSchema),
  count: z.number(),
  total: z.number(),
});

export type InvestigationListResponse = z.infer<
  typeof InvestigationListResponseSchema
>;
