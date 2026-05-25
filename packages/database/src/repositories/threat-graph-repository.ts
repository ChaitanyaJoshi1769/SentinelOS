import { ThreatNode, ThreatEdge, AttackPath } from '@sentinelos/schema';
import { DatabaseClient } from '../client';

/**
 * Threat Graph Repository
 * Handles database operations for threat graph nodes, edges, and paths
 */
export class ThreatGraphRepository {
  constructor(private db: DatabaseClient) {}

  /**
   * Find threat node by ID
   */
  async findNodeById(nodeId: string): Promise<ThreatNode | null> {
    const query = `
      SELECT * FROM threat_nodes
      WHERE node_id = $1
    `;

    const result = await this.db.getOne<ThreatNode>(query, [nodeId]);
    return result || null;
  }

  /**
   * Find all threat nodes with optional filtering
   */
  async findAllNodes(
    entityType?: string
  ): Promise<ThreatNode[]> {
    let query = 'SELECT * FROM threat_nodes';
    const params: any[] = [];

    if (entityType) {
      query += ' WHERE entity_type = $1';
      params.push(entityType);
    }

    query += ' ORDER BY risk_score DESC';

    const data = await this.db.getMany<ThreatNode>(query, params);
    return data;
  }

  /**
   * Create threat node
   */
  async createNode(node: Omit<ThreatNode, 'node_id' | 'created_at'>): Promise<ThreatNode> {
    const nodeId = `node_${Date.now()}`;
    const now = Date.now();

    const query = `
      INSERT INTO threat_nodes (
        node_id, entity_type, name, risk_score, compromised,
        connections, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      nodeId,
      node.entity_type,
      node.name,
      node.risk_score,
      node.compromised,
      node.connections || 0,
      now,
    ];

    const result = await this.db.getOne<ThreatNode>(query, values);
    if (!result) {
      throw new Error('Failed to create threat node');
    }

    return result;
  }

  /**
   * Find threat edge by ID
   */
  async findEdgeById(edgeId: string): Promise<ThreatEdge | null> {
    const query = `
      SELECT * FROM threat_edges
      WHERE edge_id = $1
    `;

    const result = await this.db.getOne<ThreatEdge>(query, [edgeId]);
    return result || null;
  }

  /**
   * Find all threat edges
   */
  async findAllEdges(): Promise<ThreatEdge[]> {
    const query = 'SELECT * FROM threat_edges ORDER BY confidence DESC';
    const data = await this.db.getMany<ThreatEdge>(query);
    return data;
  }

  /**
   * Find edges for a specific node
   */
  async findEdgesForNode(nodeId: string): Promise<ThreatEdge[]> {
    const query = `
      SELECT * FROM threat_edges
      WHERE source_id = $1 OR target_id = $1
      ORDER BY confidence DESC
    `;

    const data = await this.db.getMany<ThreatEdge>(query, [nodeId]);
    return data;
  }

  /**
   * Create threat edge
   */
  async createEdge(edge: Omit<ThreatEdge, 'edge_id' | 'created_at'>): Promise<ThreatEdge> {
    const edgeId = `edge_${Date.now()}`;
    const now = Date.now();

    const query = `
      INSERT INTO threat_edges (
        edge_id, source_id, target_id, relation_type, confidence, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      edgeId,
      edge.source_id,
      edge.target_id,
      edge.relation_type,
      edge.confidence,
      now,
    ];

    const result = await this.db.getOne<ThreatEdge>(query, values);
    if (!result) {
      throw new Error('Failed to create threat edge');
    }

    return result;
  }

  /**
   * Find attack paths between two nodes
   */
  async findAttackPaths(
    sourceId: string,
    targetId: string
  ): Promise<AttackPath[]> {
    // This is a simplified implementation - a real version would use graph algorithms
    const query = `
      SELECT source, target, hops, risk_score FROM threat_paths
      WHERE source = $1 AND target = $2
      ORDER BY hops ASC, risk_score DESC
    `;

    const data = await this.db.getMany<AttackPath>(query, [sourceId, targetId]);
    return data;
  }

  /**
   * Create attack path
   */
  async createPath(path: AttackPath): Promise<AttackPath> {
    const query = `
      INSERT INTO threat_paths (
        source, target, hops, risk_score, created_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING source, target, hops, risk_score
    `;

    const values = [
      path.source,
      path.target,
      path.hops,
      path.risk_score,
      Date.now(),
    ];

    const result = await this.db.getOne<AttackPath>(query, values);
    if (!result) {
      throw new Error('Failed to create attack path');
    }

    return result;
  }

  /**
   * Update threat node risk score
   */
  async updateNodeRiskScore(nodeId: string, riskScore: number): Promise<ThreatNode> {
    const query = `
      UPDATE threat_nodes
      SET risk_score = $1
      WHERE node_id = $2
      RETURNING *
    `;

    const result = await this.db.getOne<ThreatNode>(query, [riskScore, nodeId]);
    if (!result) {
      throw new Error('Threat node not found');
    }

    return result;
  }
}
