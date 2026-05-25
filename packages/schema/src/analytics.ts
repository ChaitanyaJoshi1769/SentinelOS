import { z } from 'zod';

/**
 * Analytics Schema Definitions
 * Defines types for security metrics, KPIs, and reporting
 */

export const SecurityMetricSchema = z.object({
  date: z.string(),
  alerts_total: z.number(),
  alerts_critical: z.number(),
  alerts_high: z.number(),
  alerts_medium: z.number(),
  alerts_low: z.number(),
  investigations_created: z.number(),
  investigations_completed: z.number(),
  avg_investigation_time: z.number(),
  remediation_success_rate: z.number().min(0).max(1),
  detection_accuracy: z.number().min(0).max(1).optional(),
  false_positive_rate: z.number().min(0).max(1).optional(),
});

export type SecurityMetric = z.infer<typeof SecurityMetricSchema>;

export const ThreatActorSchema = z.object({
  threat_actor: z.string(),
  threat_actor_id: z.string().optional(),
  incidents: z.number(),
  last_seen: z.number(),
  tactics: z.array(z.string()),
  techniques: z.array(z.string()).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
});

export type ThreatActor = z.infer<typeof ThreatActorSchema>;

export const AlertTypeSchema = z.object({
  alert_id: z.string(),
  title: z.string(),
  count: z.number(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  trend: z.number(),
  detection_source: z.string().optional(),
  false_positive_rate: z.number().optional(),
});

export type AlertType = z.infer<typeof AlertTypeSchema>;

export const KPISchema = z.object({
  date: z.string(),
  total_alerts: z.number(),
  critical_alerts: z.number(),
  avg_investigation_time: z.number(),
  remediation_success_rate: z.number(),
  detection_accuracy: z.number().optional(),
  soc_efficiency: z.number().optional(),
  analyst_productivity: z.number().optional(),
});

export type KPI = z.infer<typeof KPISchema>;

export const AnalyticsReportSchema = z.object({
  report_id: z.string(),
  report_title: z.string(),
  date_range_start: z.number(),
  date_range_end: z.number(),
  generated_at: z.number(),
  metrics: z.array(SecurityMetricSchema),
  kpis: KPISchema,
  threats: z.array(ThreatActorSchema),
  top_alerts: z.array(AlertTypeSchema),
  recommendations: z.array(z.string()),
  summary: z.string().optional(),
});

export type AnalyticsReport = z.infer<typeof AnalyticsReportSchema>;
