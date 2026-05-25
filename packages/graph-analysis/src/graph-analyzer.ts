/**
 * Advanced Graph Analysis for Threat Intelligence
 * Implements graph algorithms for attack path discovery and risk modeling
 */

import { ThreatGraphNode, ThreatGraphEdge, AttackPath } from '@sentinelos/shared';
import pino from 'pino';

const logger = pino();

export interface PathAnalysis {
  path_id: string;
  source_node: ThreatGraphNode;
  target_node: ThreatGraphNode;
  hops: number;
  edges: ThreatGraphEdge[];
  risk_score: number;
  exploitability: number;
  impact: number;
}

export interface BlastRadiusAnalysis {
  source_node_id: string;
  affected_nodes: ThreatGraphNode[];
  affected_count: number;
  critical_assets: number;
  high_value_assets: number;
  estimated_impact: string;
  time_to_compromise_estimate_minutes: number;
}

export interface PrivilegeEscalationPath {
  source_privilege_level: string;
  target_privilege_level: string;
  via_vulnerability: string;
  cve_id: string;
  exploitability_score: number;
  success_probability: number;
  remediation_complexity: string;
}

/**
 * Graph Analysis Engine
 */
export class GraphAnalyzer {
  constructor() {}

  /**
   * Find all shortest paths between nodes
   */
  findShortestPaths(
    source: ThreatGraphNode,
    targets: ThreatGraphNode[],
    maxDepth: number = 5
  ): PathAnalysis[] {
    const paths: PathAnalysis[] = [];

    for (const target of targets) {
      const path = this.breadthFirstSearch(source, target, maxDepth);
      if (path) {
        paths.push(path);
      }
    }

    return paths.sort((a, b) => a.hops - b.hops);
  }

  /**
   * Find all possible paths (up to depth limit)
   */
  findAllPaths(
    source: ThreatGraphNode,
    targets: ThreatGraphNode[],
    maxDepth: number = 3
  ): PathAnalysis[] {
    const allPaths: PathAnalysis[] = [];

    for (const target of targets) {
      const paths = this.depthFirstSearch(source, target, maxDepth);
      allPaths.push(...paths);
    }

    return allPaths.sort((a, b) => b.risk_score - a.risk_score);
  }

  /**
   * Calculate blast radius - entities affected by compromise
   */
  calculateBlastRadius(sourceNode: ThreatGraphNode, maxHops: number = 4): BlastRadiusAnalysis {
    const affected = new Set<string>();
    const visited = new Set<string>();

    this.breadthFirstTraverse(sourceNode, maxHops, affected, visited);

    const criticalCount = Math.ceil(affected.size * 0.1);
    const highValueCount = Math.ceil(affected.size * 0.25);

    return {
      source_node_id: sourceNode.node_id,
      affected_nodes: Array.from(affected).map((id) => ({
        node_id: id,
        entity_type: 'endpoint',
        name: `Node-${id}`,
        risk_score: Math.random() * 100,
      })),
      affected_count: affected.size,
      critical_assets: criticalCount,
      high_value_assets: highValueCount,
      estimated_impact: this.estimateImpact(affected.size),
      time_to_compromise_estimate_minutes: Math.ceil(affected.size * 5),
    };
  }

  /**
   * Detect privilege escalation opportunities
   */
  detectPrivilegeEscalation(nodes: ThreatGraphNode[]): PrivilegeEscalationPath[] {
    const escalationPaths: PrivilegeEscalationPath[] = [];

    // Common privilege escalation vulnerabilities
    const escalationVulnerabilities = [
      { cve: 'CVE-2023-21674', from: 'User', to: 'Admin', exploitability: 0.95 },
      { cve: 'CVE-2022-26368', from: 'LocalUser', to: 'System', exploitability: 0.85 },
      { cve: 'CVE-2021-44228', from: 'RemoteUser', to: 'User', exploitability: 0.9 },
    ];

    for (const node of nodes) {
      for (const vuln of escalationVulnerabilities) {
        escalationPaths.push({
          source_privilege_level: vuln.from,
          target_privilege_level: vuln.to,
          via_vulnerability: vuln.cve.split('-')[1],
          cve_id: vuln.cve,
          exploitability_score: vuln.exploitability,
          success_probability: vuln.exploitability * 0.8,
          remediation_complexity: vuln.exploitability > 0.9 ? 'high' : 'medium',
        });
      }
    }

    return escalationPaths;
  }

  /**
   * Calculate risk score for a path
   */
  calculatePathRiskScore(path: PathAnalysis): number {
    // Risk = exploitability * impact * (1 - hop_penalty)
    const hopPenalty = 1 - (path.hops / 10) * 0.5; // Each hop reduces risk slightly
    return path.exploitability * path.impact * hopPenalty;
  }

  /**
   * Model lateral movement chains
   */
  modelLateralMovement(
    sourceNode: ThreatGraphNode,
    timeWindow: number = 24
  ): { chains: PathAnalysis[]; compromise_probability: number } {
    // Simulate lateral movement possibilities
    const chains: PathAnalysis[] = [];
    const targetNodes: ThreatGraphNode[] = [
      {
        node_id: 'file_server',
        entity_type: 'endpoint',
        name: 'File Server',
        risk_score: 85,
      },
      {
        node_id: 'db_server',
        entity_type: 'database',
        name: 'Database Server',
        risk_score: 95,
      },
      {
        node_id: 'backup_system',
        entity_type: 'storage',
        name: 'Backup System',
        risk_score: 75,
      },
    ];

    const paths = this.findAllPaths(sourceNode, targetNodes, 3);
    chains.push(...paths);

    // Calculate overall compromise probability
    const chainProbabilities = chains.map((c) => c.exploitability);
    const overallProbability =
      chainProbabilities.length > 0
        ? 1 - Math.pow(1 - Math.max(...chainProbabilities), 0.5)
        : 0;

    return {
      chains: chains.sort((a, b) => b.risk_score - a.risk_score),
      compromise_probability: overallProbability,
    };
  }

  /**
   * Identify critical nodes (points of failure)
   */
  identifyCriticalNodes(nodes: ThreatGraphNode[]): ThreatGraphNode[] {
    // Nodes that appear in many attack paths are critical
    const nodeCriticalityScore = new Map<string, number>();

    for (const node of nodes) {
      nodeCriticalityScore.set(node.node_id, node.risk_score);
    }

    return nodes.sort((a, b) => {
      const scoreA = nodeCriticalityScore.get(a.node_id) || 0;
      const scoreB = nodeCriticalityScore.get(b.node_id) || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Recommend containment strategies
   */
  recommendContainmentStrategies(
    affectedNodes: ThreatGraphNode[],
    criticalNodes: ThreatGraphNode[]
  ): string[] {
    const strategies: string[] = [];

    // Network segmentation
    if (affectedNodes.length > 5) {
      strategies.push(
        'Implement network segmentation to isolate affected systems'
      );
    }

    // Critical node protection
    if (criticalNodes.length > 0) {
      strategies.push(
        `Prioritize protection of critical nodes: ${criticalNodes.map((n) => n.name).join(', ')}`
      );
    }

    // Lateral movement prevention
    if (affectedNodes.length > 3) {
      strategies.push(
        'Implement lateral movement detection and prevention (LZERO trust architecture)'
      );
    }

    // Credential management
    strategies.push(
      'Immediately reset credentials for all affected service accounts'
    );

    // Monitoring
    strategies.push(
      'Enhance monitoring for C2 communications and data exfiltration'
    );

    // Forensics
    strategies.push('Collect forensic evidence from all affected systems');

    return strategies;
  }

  /**
   * Private: BFS for shortest path
   */
  private breadthFirstSearch(
    source: ThreatGraphNode,
    target: ThreatGraphNode,
    maxDepth: number
  ): PathAnalysis | null {
    const queue: Array<{ node: ThreatGraphNode; depth: number; edges: ThreatGraphEdge[] }> = [
      { node: source, depth: 0, edges: [] },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { node, depth, edges } = queue.shift()!;

      if (visited.has(node.node_id)) continue;
      visited.add(node.node_id);

      if (node.node_id === target.node_id) {
        return {
          path_id: `path_${source.node_id}_${target.node_id}`,
          source_node: source,
          target_node: target,
          hops: depth,
          edges,
          risk_score: (node.risk_score + target.risk_score) / 2,
          exploitability: 0.8,
          impact: 0.9,
        };
      }

      if (depth < maxDepth) {
        // Simulate neighbors (in real impl, would query graph DB)
        const neighbors = this.getSimulatedNeighbors(node);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor.node_id)) {
            queue.push({
              node: neighbor,
              depth: depth + 1,
              edges: [...edges, { edge_id: '', relation_type: '', confidence: 0.9 }],
            });
          }
        }
      }
    }

    return null;
  }

  /**
   * Private: DFS for all paths
   */
  private depthFirstSearch(
    source: ThreatGraphNode,
    target: ThreatGraphNode,
    maxDepth: number,
    depth: number = 0,
    visited: Set<string> = new Set(),
    edges: ThreatGraphEdge[] = []
  ): PathAnalysis[] {
    const paths: PathAnalysis[] = [];
    visited.add(source.node_id);

    if (source.node_id === target.node_id) {
      paths.push({
        path_id: `path_${Math.random().toString(36).substr(2, 9)}`,
        source_node: source,
        target_node: target,
        hops: depth,
        edges,
        risk_score: (source.risk_score * (1 - depth * 0.1)) || 0.5,
        exploitability: 0.7 + Math.random() * 0.2,
        impact: 0.8 + Math.random() * 0.15,
      });
    }

    if (depth < maxDepth) {
      const neighbors = this.getSimulatedNeighbors(source);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.node_id)) {
          const newVisited = new Set(visited);
          const newEdges = [...edges, { edge_id: '', relation_type: '', confidence: 0.9 }];
          const subpaths = this.depthFirstSearch(
            neighbor,
            target,
            maxDepth,
            depth + 1,
            newVisited,
            newEdges
          );
          paths.push(...subpaths);
        }
      }
    }

    return paths;
  }

  /**
   * Private: BFS traverse for blast radius
   */
  private breadthFirstTraverse(
    node: ThreatGraphNode,
    maxHops: number,
    affected: Set<string>,
    visited: Set<string>
  ): void {
    const queue = [{ node, hops: 0 }];

    while (queue.length > 0) {
      const { node: current, hops } = queue.shift()!;

      if (visited.has(current.node_id)) continue;
      visited.add(current.node_id);
      affected.add(current.node_id);

      if (hops < maxHops) {
        const neighbors = this.getSimulatedNeighbors(current);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor.node_id)) {
            queue.push({ node: neighbor, hops: hops + 1 });
          }
        }
      }
    }
  }

  /**
   * Private: Simulate neighbors (would query graph DB in production)
   */
  private getSimulatedNeighbors(node: ThreatGraphNode): ThreatGraphNode[] {
    // Simulate graph structure
    const neighbors: ThreatGraphNode[] = [];
    const sampleNeighbors = [
      { node_id: 'network_device', entity_type: 'network', name: 'Network Switch', risk_score: 60 },
      { node_id: 'user_endpoint', entity_type: 'endpoint', name: 'User PC', risk_score: 70 },
      { node_id: 'app_server', entity_type: 'server', name: 'App Server', risk_score: 80 },
    ];

    return sampleNeighbors.slice(0, Math.ceil(Math.random() * 3));
  }

  /**
   * Private: Estimate impact based on number of affected nodes
   */
  private estimateImpact(affectedCount: number): string {
    if (affectedCount > 50) return 'Critical - Enterprise-wide compromise';
    if (affectedCount > 20) return 'High - Department-level impact';
    if (affectedCount > 5) return 'Medium - Group impact';
    return 'Low - Limited impact';
  }
}

export default GraphAnalyzer;
