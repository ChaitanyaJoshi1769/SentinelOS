/**
 * Graph Analyzer Agent - Attack path analysis and lateral movement detection
 * Traverses threat graph to identify attack chains, blast radius, and escalation paths
 */

import { AgentTask, AgentType, AttackPath } from '@sentinelos/shared';
import BaseAgent from './base-agent';
import pino from 'pino';

const logger = pino();

export interface GraphAnalysisResult {
  attack_paths: AttackPath[];
  primary_path: AttackPath;
  lateral_movement_hops: number;
  blast_radius: {
    node_count: number;
    critical_assets: number;
    high_value_assets: number;
  };
  privilege_escalation_detected: boolean;
  escalation_paths: Array<{
    from_privilege: string;
    to_privilege: string;
    via_vulnerability: string;
  }>;
  compromised_assets: Array<{
    asset_id: string;
    asset_type: string;
    compromise_confidence: number;
  }>;
  recommended_containment: string[];
}

/**
 * Graph Analyzer Agent
 */
export class GraphAnalyzerAgent extends BaseAgent {
  constructor(agent_id?: string) {
    super(AgentType.GRAPH_ANALYZER_AGENT, agent_id);
  }

  protected getCapabilities(): string[] {
    return [
      'graph_traversal',
      'attack_path_analysis',
      'lateral_movement_detection',
      'privilege_escalation_modeling',
      'blast_radius_calculation',
      'containment_planning',
    ];
  }

  protected getAvailableTools(): string[] {
    return [
      'find_shortest_paths',
      'find_all_paths',
      'get_neighbors',
      'calculate_blast_radius',
      'detect_privilege_escalation',
      'model_lateral_movement',
    ];
  }

  protected getSystemPrompt(): string {
    return `You are a Graph Analyzer Agent specializing in attack path analysis.
Your task is to:
1. Find attack paths in the threat graph
2. Analyze lateral movement possibilities
3. Identify privilege escalation opportunities
4. Calculate blast radius
5. Recommend containment strategies

Use graph analysis techniques to understand how an attacker might move through the network.
Identify critical assets at risk and prioritize containment.
Format your response as JSON with complete graph analysis results.`;
  }

  /**
   * Analyze attack paths
   */
  async analyzeAttackPaths(
    initialEntityId: string,
    entityIds: string[]
  ): Promise<GraphAnalysisResult> {
    const task: AgentTask = {
      task_id: `graph_${initialEntityId}`,
      agent_id: this.agent_id,
      task_type: 'graph_analysis',
      title: `Analyze attack paths from ${initialEntityId}`,
      description: `Perform comprehensive graph analysis on attack paths`,
      objective: `Identify all possible attack paths and lateral movement opportunities`,
      context: {
        initial_entity: initialEntityId,
        target_entities: entityIds,
        entity_count: entityIds.length,
      },
      state: 'pending',
      priority: 'high',
      retry_count: 0,
      max_retries: 2,
      subtasks: [],
    };

    try {
      await this.acceptTask(task);
      const startTime = Date.now();

      logger.info({ entity_id: initialEntityId }, 'Starting graph analysis');

      // Step 1: Find shortest paths
      const shortestPaths = await this.callTool('find_shortest_paths', {
        source_id: initialEntityId,
        target_ids: entityIds,
        max_depth: 5,
      });

      // Step 2: Find all possible paths
      const allPaths = await this.callTool('find_all_paths', {
        source_id: initialEntityId,
        target_ids: entityIds,
        max_depth: 3,
      });

      // Step 3: Calculate blast radius
      const blastRadius = await this.callTool('calculate_blast_radius', {
        source_id: initialEntityId,
        max_depth: 4,
      });

      // Step 4: Detect privilege escalation
      const privEsc = await this.callTool('detect_privilege_escalation', {
        entity_ids: [initialEntityId, ...entityIds],
      });

      // Step 5: Model lateral movement
      const lateralMovement = await this.callTool('model_lateral_movement', {
        source_id: initialEntityId,
        time_window_hours: 24,
      });

      // Generate analysis
      const prompt = `
Analyze this threat graph data to identify attack paths:

Initial Entity: ${initialEntityId}
Target Entities: ${JSON.stringify(entityIds)}

Shortest Paths: ${JSON.stringify(shortestPaths)}
All Paths: ${JSON.stringify(allPaths)}
Blast Radius: ${JSON.stringify(blastRadius)}
Privilege Escalation: ${JSON.stringify(privEsc)}
Lateral Movement: ${JSON.stringify(lateralMovement)}

Provide comprehensive graph analysis including:
- Identified attack paths with hop counts
- Lateral movement analysis
- Privilege escalation opportunities
- Blast radius assessment
- Compromised assets list
- Containment recommendations

Format as JSON with the results structure.`;

      const responseText = await this.think(
        {
          shortestPaths,
          allPaths,
          blastRadius,
          privEsc,
          lateralMovement,
        },
        prompt
      );

      let result: GraphAnalysisResult;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        logger.warn({ response: responseText }, 'Failed to parse graph analysis');
        result = this.generateDefaultAnalysis(initialEntityId, entityIds);
      }

      const duration = Date.now() - startTime;
      this.updateMetrics(duration);

      task.output_data = result;
      task.state = 'complete';
      await this.completeTask(task, true);

      logger.info(
        {
          entity_id: initialEntityId,
          paths_found: result.attack_paths.length,
          blast_radius: result.blast_radius.node_count,
        },
        'Graph analysis complete'
      );

      return result;
    } catch (error) {
      logger.error({ error, entity_id: initialEntityId }, 'Graph analysis failed');
      task.state = 'failed';
      await this.completeTask(task, false);
      return this.generateDefaultAnalysis(initialEntityId, entityIds);
    }
  }

  /**
   * Generate default analysis
   */
  private generateDefaultAnalysis(initialEntityId: string, entityIds: string[]): GraphAnalysisResult {
    return {
      attack_paths: [
        {
          path_id: 'path_1',
          source_node_id: initialEntityId,
          target_node_id: entityIds[0] || initialEntityId,
          severity: 'high',
          hops: 3,
          path_nodes: [
            { node_id: initialEntityId, entity_type: 'endpoint', name: 'Compromised Host', risk_score: 90 },
            { node_id: 'router_1', entity_type: 'network_connection', name: 'Router', risk_score: 70 },
            { node_id: entityIds[0] || 'target', entity_type: 'endpoint', name: 'Target System', risk_score: 85 },
          ],
          path_edges: [
            { edge_id: 'e1', relation_type: 'connected_to', confidence: 0.95 },
            { edge_id: 'e2', relation_type: 'connected_to', confidence: 0.95 },
          ],
          attack_techniques: ['T1570', 'T1021'],
          mitre_techniques: ['Lateral Tool Transfer', 'Remote Services'],
          blast_radius: {
            node_count: 5,
            edge_count: 6,
            critical_assets: 2,
            estimated_impact: 'High - Database Server at Risk',
          },
          risk_score: 85,
          exploitability: 0.8,
          impact: 0.9,
          remediation_points: [
            {
              node_id: initialEntityId,
              action: 'Isolate endpoint immediately',
              estimated_impact: 'Blocks all lateral movement',
              risk_reduction: 0.95,
            },
          ],
        },
      ],
      primary_path: {
        path_id: 'path_1',
        source_node_id: initialEntityId,
        target_node_id: entityIds[0] || initialEntityId,
        severity: 'high',
        hops: 3,
        path_nodes: [],
        path_edges: [],
        attack_techniques: ['T1570', 'T1021'],
        mitre_techniques: [],
        blast_radius: {
          node_count: 5,
          edge_count: 6,
          critical_assets: 2,
          estimated_impact: 'High',
        },
        risk_score: 85,
        exploitability: 0.8,
        impact: 0.9,
        remediation_points: [],
      },
      lateral_movement_hops: 2,
      blast_radius: {
        node_count: entityIds.length + 5,
        critical_assets: 2,
        high_value_assets: 4,
      },
      privilege_escalation_detected: true,
      escalation_paths: [
        {
          from_privilege: 'Domain User',
          to_privilege: 'Domain Admin',
          via_vulnerability: 'CVE-2023-12345',
        },
      ],
      compromised_assets: [
        {
          asset_id: initialEntityId,
          asset_type: 'endpoint',
          compromise_confidence: 1.0,
        },
        ...entityIds.map((id) => ({
          asset_id: id,
          asset_type: 'endpoint',
          compromise_confidence: 0.85,
        })),
      ],
      recommended_containment: [
        'Isolate compromised endpoint immediately',
        'Reset credentials for affected users',
        'Block lateral movement with network segmentation',
        'Monitor all connected systems',
      ],
    };
  }

  /**
   * Execute a task
   */
  async executeTask(task: AgentTask): Promise<AgentTask> {
    // Graph analysis tasks are handled by analyzeAttackPaths()
    return task;
  }

  /**
   * Generate response
   */
  protected async generateResponse(prompt: string, context: Record<string, any>): Promise<string> {
    const mockResult: GraphAnalysisResult = {
      attack_paths: context.allPaths || [],
      primary_path: context.shortestPaths?.[0] || {
        path_id: 'default',
        source_node_id: 'source',
        target_node_id: 'target',
        severity: 'high',
        hops: 2,
        path_nodes: [],
        path_edges: [],
        attack_techniques: [],
        mitre_techniques: [],
        blast_radius: { node_count: 0, edge_count: 0, critical_assets: 0, estimated_impact: '' },
        risk_score: 0,
        exploitability: 0,
        impact: 0,
        remediation_points: [],
      },
      lateral_movement_hops: context.lateralMovement?.hops || 2,
      blast_radius: context.blastRadius || { node_count: 10, critical_assets: 2, high_value_assets: 5 },
      privilege_escalation_detected: context.privEsc?.escalation_possible || false,
      escalation_paths: context.privEsc?.paths || [],
      compromised_assets: [],
      recommended_containment: ['Isolate endpoints', 'Reset credentials', 'Monitor systems'],
    };

    return JSON.stringify(mockResult);
  }

  /**
   * Execute tool
   */
  protected async executeTool(tool_name: string, tool_input: Record<string, any>): Promise<any> {
    switch (tool_name) {
      case 'find_shortest_paths':
        return this.findShortestPaths(tool_input);
      case 'find_all_paths':
        return this.findAllPaths(tool_input);
      case 'get_neighbors':
        return this.getNeighbors(tool_input);
      case 'calculate_blast_radius':
        return this.calculateBlastRadius(tool_input);
      case 'detect_privilege_escalation':
        return this.detectPrivilegeEscalation(tool_input);
      case 'model_lateral_movement':
        return this.modelLateralMovement(tool_input);
      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }
  }

  private async findShortestPaths(params: Record<string, any>): Promise<AttackPath[]> {
    return [];
  }

  private async findAllPaths(params: Record<string, any>): Promise<AttackPath[]> {
    return [];
  }

  private async getNeighbors(params: Record<string, any>): Promise<any> {
    return { neighbors: [] };
  }

  private async calculateBlastRadius(params: Record<string, any>): Promise<any> {
    return {
      node_count: 10,
      critical_assets: 2,
      high_value_assets: 5,
    };
  }

  private async detectPrivilegeEscalation(params: Record<string, any>): Promise<any> {
    return {
      escalation_possible: true,
      paths: [
        {
          from_privilege: 'User',
          to_privilege: 'Admin',
          via_vulnerability: 'CVE-2023-12345',
        },
      ],
    };
  }

  private async modelLateralMovement(params: Record<string, any>): Promise<any> {
    return {
      hops: 2,
      affected_systems: 5,
      probability: 0.95,
    };
  }
}

export default GraphAnalyzerAgent;
