import { z } from 'zod';

/**
 * Threat Graph Schema Definitions
 * Defines types for threat intelligence graph nodes, edges, and paths
 */

export const ThreatNodeSchema = z.object({
  node_id: z.string(),
  entity_type: z.enum(['endpoint', 'server', 'database', 'storage', 'network', 'user', 'account']),
  name: z.string(),
  risk_score: z.number().min(0).max(100),
  compromised: z.boolean(),
  connections: z.number(),
  metadata: z.record(z.any()).optional(),
  last_seen: z.number().optional(),
});

export type ThreatNode = z.infer<typeof ThreatNodeSchema>;

export const ThreatEdgeSchema = z.object({
  edge_id: z.string(),
  source_id: z.string(),
  target_id: z.string(),
  relation_type: z.enum([
    'connected_to',
    'can_access',
    'replicates_to',
    'communicates_via',
    'accesses',
    'is_member_of',
    'contains',
  ]),
  confidence: z.number().min(0).max(1),
  first_seen: z.number().optional(),
  last_seen: z.number().optional(),
});

export type ThreatEdge = z.infer<typeof ThreatEdgeSchema>;

export const AttackPathSchema = z.object({
  path_id: z.string().optional(),
  source: z.string(),
  target: z.string(),
  hops: z.number(),
  path_nodes: z.array(z.string()),
  risk_score: z.number().min(0).max(1),
  techniques: z.array(z.string()),
  critical: z.boolean().optional(),
});

export type AttackPath = z.infer<typeof AttackPathSchema>;

export const ThreatGraphSchema = z.object({
  nodes: z.array(ThreatNodeSchema),
  edges: z.array(ThreatEdgeSchema),
  paths: z.array(AttackPathSchema),
});

export type ThreatGraph = z.infer<typeof ThreatGraphSchema>;

export const PathAnalysisSchema = z.object({
  source: z.string(),
  target: z.string(),
  paths: z.array(AttackPathSchema),
  critical_nodes: z.array(z.string()),
  recommendations: z.array(z.string()),
  mitigations: z.array(z.string()).optional(),
});

export type PathAnalysis = z.infer<typeof PathAnalysisSchema>;
