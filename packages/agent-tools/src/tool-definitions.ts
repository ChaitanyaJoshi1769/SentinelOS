/**
 * Tool definitions for agent framework
 * Defines tools available to agents with input/output schemas
 */

import { z } from 'zod';

/**
 * Tool definition with schema
 */
export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  input_schema: z.ZodType<any>;
  output_schema: z.ZodType<any>;
  required_for_agents: string[];
}

/**
 * Telemetry query tool
 */
export const QueryTelemetryTool: ToolDefinition = {
  name: 'query_telemetry',
  description: 'Query telemetry system for events matching criteria',
  category: 'telemetry',
  input_schema: z.object({
    alert_id: z.string().optional(),
    time_window_minutes: z.number().default(60),
    entity_ids: z.array(z.string()),
    event_types: z.array(z.string()).optional(),
    severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  }),
  output_schema: z.array(
    z.object({
      timestamp: z.number(),
      event_type: z.string(),
      entity_id: z.string(),
      description: z.string(),
      severity: z.string(),
      raw_data: z.record(z.any()),
    })
  ),
  required_for_agents: ['investigation_agent'],
};

/**
 * Graph query tool
 */
export const GraphQueryTool: ToolDefinition = {
  name: 'query_graph',
  description: 'Query threat intelligence graph for entities and relationships',
  category: 'graph',
  input_schema: z.object({
    entity_id: z.string(),
    max_depth: z.number().default(5),
    relationship_types: z.array(z.string()).optional(),
  }),
  output_schema: z.object({
    entity_id: z.string(),
    neighbors: z.array(
      z.object({
        node_id: z.string(),
        entity_type: z.string(),
        relation_type: z.string(),
        risk_score: z.number(),
      })
    ),
  }),
  required_for_agents: ['graph_analyzer_agent'],
};

/**
 * Find shortest paths tool
 */
export const FindShortestPathsTool: ToolDefinition = {
  name: 'find_shortest_paths',
  description: 'Find shortest paths between entities in threat graph',
  category: 'graph',
  input_schema: z.object({
    source_id: z.string(),
    target_ids: z.array(z.string()),
    max_depth: z.number().default(5),
  }),
  output_schema: z.array(
    z.object({
      path_id: z.string(),
      source_node_id: z.string(),
      target_node_id: z.string(),
      hops: z.number(),
      path_nodes: z.array(z.object({ node_id: z.string(), entity_type: z.string() })),
    })
  ),
  required_for_agents: ['graph_analyzer_agent'],
};

/**
 * Threat intelligence lookup tool
 */
export const LookupThreatActorTool: ToolDefinition = {
  name: 'lookup_threat_actor',
  description: 'Lookup threat actor profile from intelligence database',
  category: 'intelligence',
  input_schema: z.object({
    indicators: z.array(z.string()),
    attack_techniques: z.array(z.string()).optional(),
  }),
  output_schema: z.array(
    z.object({
      actor_id: z.string(),
      actor_name: z.string(),
      aliases: z.array(z.string()),
      attribution_confidence: z.number(),
      known_campaigns: z.array(z.string()),
    })
  ),
  required_for_agents: ['threat_intelligence_agent'],
};

/**
 * Enrich indicator tool
 */
export const EnrichIndicatorTool: ToolDefinition = {
  name: 'enrich_indicator',
  description: 'Enrich indicator with threat intelligence context',
  category: 'intelligence',
  input_schema: z.object({
    indicator: z.string(),
    indicator_type: z.enum(['IP_ADDRESS', 'DOMAIN', 'FILE_HASH', 'EMAIL', 'URL']),
  }),
  output_schema: z.object({
    indicator: z.string(),
    threat_level: z.enum(['critical', 'high', 'medium', 'low']),
    reputation_score: z.number().min(0).max(1),
    associated_actors: z.array(z.string()),
    associated_campaigns: z.array(z.string()),
    first_seen: z.number().optional(),
    last_seen: z.number().optional(),
  }),
  required_for_agents: ['threat_intelligence_agent'],
};

/**
 * Generate remediation action tool
 */
export const GenerateRemediationActionTool: ToolDefinition = {
  name: 'generate_remediation_action',
  description: 'Generate a remediation action for a compromise',
  category: 'remediation',
  input_schema: z.object({
    action_type: z.enum(['isolate', 'terminate', 'reset', 'block', 'snapshot', 'alert']),
    target_type: z.enum(['endpoint', 'user', 'network', 'process', 'connection']),
    target_id: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    justification: z.string(),
  }),
  output_schema: z.object({
    action_id: z.string(),
    action_type: z.string(),
    target_id: z.string(),
    estimated_duration_seconds: z.number(),
    rollback_possible: z.boolean(),
    requires_approval: z.boolean(),
    estimated_impact: z.string(),
  }),
  required_for_agents: ['remediation_agent'],
};

/**
 * Execute remediation action tool
 */
export const ExecuteRemediationActionTool: ToolDefinition = {
  name: 'execute_remediation_action',
  description: 'Execute a remediation action (requires approval)',
  category: 'remediation',
  input_schema: z.object({
    action_id: z.string(),
    approval_token: z.string().optional(),
  }),
  output_schema: z.object({
    action_id: z.string(),
    status: z.enum(['pending', 'executing', 'completed', 'failed']),
    result: z.record(z.any()).optional(),
    error: z.string().optional(),
  }),
  required_for_agents: ['remediation_agent'],
};

/**
 * Analyze indicator of compromise tool
 */
export const AnalyzeIOCTool: ToolDefinition = {
  name: 'analyze_ioc',
  description: 'Analyze indicator of compromise in context',
  category: 'analysis',
  input_schema: z.object({
    ioc: z.string(),
    ioc_type: z.enum(['IP_ADDRESS', 'DOMAIN', 'FILE_HASH', 'EMAIL', 'URL']),
    context: z.record(z.any()).optional(),
  }),
  output_schema: z.object({
    ioc: z.string(),
    threat_level: z.enum(['critical', 'high', 'medium', 'low']),
    confidence: z.number(),
    analysis_summary: z.string(),
    related_indicators: z.array(z.string()),
  }),
  required_for_agents: ['investigation_agent', 'threat_intelligence_agent'],
};

/**
 * Tool registry
 */
export const ALL_TOOLS: ToolDefinition[] = [
  QueryTelemetryTool,
  GraphQueryTool,
  FindShortestPathsTool,
  LookupThreatActorTool,
  EnrichIndicatorTool,
  GenerateRemediationActionTool,
  ExecuteRemediationActionTool,
  AnalyzeIOCTool,
];

/**
 * Get tools for a specific agent
 */
export function getToolsForAgent(agentType: string): ToolDefinition[] {
  return ALL_TOOLS.filter((tool) => tool.required_for_agents.includes(agentType));
}

/**
 * Get tool by name
 */
export function getTool(name: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((tool) => tool.name === name);
}
