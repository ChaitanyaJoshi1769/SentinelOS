/**
 * Schema Package - Central Type Definitions
 * Exports Zod schemas and TypeScript types for all SentinelOS data models
 */

// Investigation schemas
export {
  FindingSchema,
  TimelineEventSchema,
  InvestigationSchema,
  InvestigationListResponseSchema,
} from './investigations';
export type { Finding, TimelineEvent, Investigation, InvestigationListResponse } from './investigations';

// Threat Graph schemas
export {
  ThreatNodeSchema,
  ThreatEdgeSchema,
  AttackPathSchema,
  ThreatGraphSchema,
  PathAnalysisSchema,
} from './threat-graph';
export type { ThreatNode, ThreatEdge, AttackPath, ThreatGraph, PathAnalysis } from './threat-graph';

// Remediation schemas
export {
  RemediationActionSchema,
  ApprovalRequestSchema,
  ExecutionResultSchema,
  RemediationWorkflowSchema,
} from './remediation';
export type {
  RemediationAction,
  ApprovalRequest,
  ExecutionResult,
  RemediationWorkflow,
} from './remediation';

// Analytics schemas
export {
  SecurityMetricSchema,
  ThreatActorSchema,
  AlertTypeSchema,
  KPISchema,
  AnalyticsReportSchema,
} from './analytics';
export type { SecurityMetric, ThreatActor, AlertType, KPI, AnalyticsReport } from './analytics';
