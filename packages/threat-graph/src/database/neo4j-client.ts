/**
 * Neo4j threat graph database client
 * Handles all graph operations for attack path analysis
 */

import { Driver, Session, Transaction } from 'neo4j-driver';
import driver from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import {
  ThreatGraphNode,
  ThreatGraphEdge,
  ThreatEntityType,
  ThreatRelationType,
  AttackPath,
  GraphQuery,
} from '@sentinelos/shared';
import { GraphError } from '@sentinelos/shared';

/**
 * Neo4j threat graph database client
 */
export class ThreatGraphClient {
  private neo4jDriver: Driver;
  private initialized: boolean = false;

  constructor(
    private host: string,
    private port: number,
    private username: string,
    private password: string,
    private database: string = 'neo4j'
  ) {
    const uri = `bolt://${host}:${port}`;
    this.neo4jDriver = driver.default.driver(uri, driver.default.auth.basic(username, password));
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const session = this.neo4jDriver.session();
      await session.run('RETURN 1');
      await session.close();

      // Create indexes for performance
      await this.createIndexes();

      this.initialized = true;
    } catch (error) {
      throw new GraphError('Failed to initialize Neo4j client', { error: String(error) });
    }
  }

  async close(): Promise<void> {
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
    }
  }

  /**
   * Create indexes for optimal query performance
   */
  private async createIndexes(): Promise<void> {
    const session = this.neo4jDriver.session();
    try {
      // Entity indexes
      await session.run('CREATE INDEX IF NOT EXISTS FOR (n:ThreatEntity) ON (n.entity_id)');
      await session.run('CREATE INDEX IF NOT EXISTS FOR (n:ThreatEntity) ON (n.entity_type)');
      await session.run('CREATE INDEX IF NOT EXISTS FOR (n:ThreatEntity) ON (n.risk_score)');

      // Relationship indexes
      await session.run('CREATE INDEX IF NOT EXISTS FOR ()-[r:THREAT_REL]-() ON (r.relation_type)');
      await session.run('CREATE INDEX IF NOT EXISTS FOR ()-[r:THREAT_REL]-() ON (r.timestamp)');

      // Composite indexes for common queries
      await session.run('CREATE INDEX IF NOT EXISTS FOR (n:ThreatEntity) ON (n.entity_type, n.criticality)');
    } finally {
      await session.close();
    }
  }

  /**
   * Create a threat entity node
   */
  async createEntity(entity: ThreatGraphNode): Promise<ThreatGraphNode> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        CREATE (n:ThreatEntity {
          node_id: $node_id,
          entity_type: $entity_type,
          entity_id: $entity_id,
          name: $name,
          display_name: $display_name,
          properties: $properties,
          risk_score: $risk_score,
          criticality: $criticality,
          first_seen: $first_seen,
          last_seen: $last_seen,
          data_sources: $data_sources,
          confidence: $confidence,
          created_at: timestamp()
        })
        RETURN n
        `,
        {
          node_id: entity.node_id || uuidv4(),
          entity_type: entity.entity_type,
          entity_id: entity.entity_id,
          name: entity.name,
          display_name: entity.display_name || entity.name,
          properties: entity.properties,
          risk_score: entity.risk_score,
          criticality: entity.criticality,
          first_seen: entity.properties.created_at || Date.now(),
          last_seen: entity.properties.updated_at || Date.now(),
          data_sources: entity.data_sources,
          confidence: entity.confidence,
        }
      );

      return entity;
    } catch (error) {
      throw new GraphError('Failed to create entity', { error: String(error) });
    } finally {
      await session.close();
    }
  }

  /**
   * Create a threat relationship
   */
  async createRelationship(
    sourceNodeId: string,
    targetNodeId: string,
    relationType: ThreatRelationType,
    properties?: Record<string, any>
  ): Promise<ThreatGraphEdge> {
    const session = this.neo4jDriver.session();
    try {
      const edgeId = uuidv4();
      const now = Date.now();

      await session.run(
        `
        MATCH (source:ThreatEntity {node_id: $source_node_id})
        MATCH (target:ThreatEntity {node_id: $target_node_id})
        CREATE (source)-[r:THREAT_REL {
          edge_id: $edge_id,
          relation_type: $relation_type,
          properties: $properties,
          first_observed: $timestamp,
          last_observed: $timestamp,
          observation_count: 1,
          evidence: [],
          data_sources: [],
          created_at: timestamp()
        }]->(target)
        RETURN r
        `,
        {
          source_node_id: sourceNodeId,
          target_node_id: targetNodeId,
          edge_id: edgeId,
          relation_type: relationType,
          properties: properties || {},
          timestamp: now,
        }
      );

      return {
        edge_id: edgeId,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        relation_type: relationType,
        properties: properties,
        properties_details: {},
        first_observed: now,
        last_observed: now,
        observation_count: 1,
        evidence: [],
        data_sources: [],
      };
    } catch (error) {
      throw new GraphError('Failed to create relationship', { error: String(error) });
    } finally {
      await session.close();
    }
  }

  /**
   * Find shortest path between two entities
   */
  async findShortestPath(sourceNodeId: string, targetNodeId: string, maxDepth: number = 5): Promise<AttackPath | null> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (source:ThreatEntity {node_id: $source_node_id})
        MATCH (target:ThreatEntity {node_id: $target_node_id})
        MATCH path = shortestPath((source)-[*1..${maxDepth}]->(target))
        RETURN path, nodes(path) as nodes, relationships(path) as relationships
        `,
        {
          source_node_id: sourceNodeId,
          target_node_id: targetNodeId,
        }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const nodes = record.get('nodes');
      const relationships = record.get('relationships');

      return this.buildAttackPathFromQueryResult(sourceNodeId, targetNodeId, nodes, relationships);
    } catch (error) {
      throw new GraphError('Failed to find shortest path', { error: String(error) });
    } finally {
      await session.close();
    }
  }

  /**
   * Find all paths between two entities
   */
  async findAllPaths(
    sourceNodeId: string,
    targetNodeId: string,
    maxDepth: number = 3,
    maxPaths: number = 10
  ): Promise<AttackPath[]> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (source:ThreatEntity {node_id: $source_node_id})
        MATCH (target:ThreatEntity {node_id: $target_node_id})
        MATCH path = (source)-[*1..${maxDepth}]->(target)
        RETURN path, nodes(path) as nodes, relationships(path) as relationships
        LIMIT ${maxPaths}
        `,
        {
          source_node_id: sourceNodeId,
          target_node_id: targetNodeId,
        }
      );

      return result.records.map((record) => {
        const nodes = record.get('nodes');
        const relationships = record.get('relationships');
        return this.buildAttackPathFromQueryResult(sourceNodeId, targetNodeId, nodes, relationships);
      });
    } catch (error) {
      throw new GraphError('Failed to find all paths', { error: String(error) });
    } finally {
      await session.close();
    }
  }

  /**
   * Get entity neighbors
   */
  async getEntityNeighbors(nodeId: string, depth: number = 1): Promise<ThreatGraphNode[]> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (source:ThreatEntity {node_id: $node_id})-[*1..${depth}]-(neighbor:ThreatEntity)
        RETURN DISTINCT neighbor
        `,
        { node_id: nodeId }
      );

      return result.records.map((record) => this.mapNodeFromQuery(record.get('neighbor')));
    } catch (error) {
      throw new GraphError('Failed to get entity neighbors', { error: String(error) });
    } finally {
      await session.close();
    }
  }

  /**
   * Get entity by ID
   */
  async getEntity(nodeId: string): Promise<ThreatGraphNode | null> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (n:ThreatEntity {node_id: $node_id})
        RETURN n
        `,
        { node_id: nodeId }
      );

      if (result.records.length === 0) {
        return null;
      }

      return this.mapNodeFromQuery(result.records[0].get('n'));
    } catch (error) {
      throw new GraphError('Failed to get entity', { error: String(error) });
    } finally {
      await session.close();
    }
  }

  /**
   * Query entities by type and filter
   */
  async queryEntities(
    entityType?: ThreatEntityType,
    filters?: {
      risk_score_min?: number;
      risk_score_max?: number;
      criticality?: string[];
    },
    limit: number = 100
  ): Promise<ThreatGraphNode[]> {
    const session = this.neo4jDriver.session();
    try {
      let cypher = 'MATCH (n:ThreatEntity)';
      const params: Record<string, any> = {};

      const whereClausesConditions: string[] = [];

      if (entityType) {
        whereClausesConditions.push('n.entity_type = $entity_type');
        params.entity_type = entityType;
      }

      if (filters?.risk_score_min !== undefined) {
        whereClausesConditions.push('n.risk_score >= $risk_score_min');
        params.risk_score_min = filters.risk_score_min;
      }

      if (filters?.risk_score_max !== undefined) {
        whereClausesConditions.push('n.risk_score <= $risk_score_max');
        params.risk_score_max = filters.risk_score_max;
      }

      if (filters?.criticality) {
        whereClausesConditions.push('n.criticality IN $criticality');
        params.criticality = filters.criticality;
      }

      if (whereClausesConditions.length > 0) {
        cypher += ' WHERE ' + whereClausesConditions.join(' AND ');
      }

      cypher += ` RETURN n LIMIT ${limit}`;

      const result = await session.run(cypher, params);
      return result.records.map((record) => this.mapNodeFromQuery(record.get('n')));
    } catch (error) {
      throw new GraphError('Failed to query entities', { error: String(error) });
    } finally {
      await session.close();
    }
  }

  /**
   * Calculate blast radius for an entity
   */
  async calculateBlastRadius(nodeId: string, maxDepth: number = 3): Promise<{ node_count: number; edge_count: number }> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (source:ThreatEntity {node_id: $node_id})-[*1..${maxDepth}]-(connected)
        RETURN COUNT(DISTINCT connected) as node_count
        `,
        { node_id: nodeId }
      );

      const nodeCount = result.records[0].get('node_count').toNumber();

      const edgeResult = await session.run(
        `
        MATCH (source:ThreatEntity {node_id: $node_id})-[rel*1..${maxDepth}]-(connected)
        RETURN COUNT(DISTINCT rel) as edge_count
        `,
        { node_id: nodeId }
      );

      const edgeCount = edgeResult.records[0].get('edge_count').toNumber();

      return { node_count: nodeCount, edge_count: edgeCount };
    } catch (error) {
      throw new GraphError('Failed to calculate blast radius', { error: String(error) });
    } finally {
      await session.close();
    }
  }

  /**
   * Helper: Map Neo4j node to ThreatGraphNode
   */
  private mapNodeFromQuery(node: any): ThreatGraphNode {
    const props = node.properties;
    return {
      node_id: props.node_id,
      entity_type: props.entity_type as ThreatEntityType,
      entity_id: props.entity_id,
      name: props.name,
      display_name: props.display_name,
      properties: props.properties || {},
      risk_score: props.risk_score,
      criticality: props.criticality,
      data_sources: props.data_sources || [],
      confidence: props.confidence,
    };
  }

  /**
   * Helper: Build attack path from query results
   */
  private buildAttackPathFromQueryResult(
    sourceId: string,
    targetId: string,
    nodes: any[],
    relationships: any[]
  ): AttackPath {
    return {
      path_id: uuidv4(),
      source_node_id: sourceId,
      target_node_id: targetId,
      severity: 'high',
      hops: nodes.length - 1,
      path_nodes: nodes.map((node) => ({
        node_id: node.properties.node_id,
        entity_type: node.properties.entity_type,
        name: node.properties.name,
        risk_score: node.properties.risk_score,
      })),
      path_edges: relationships.map((rel) => ({
        edge_id: rel.properties.edge_id,
        relation_type: rel.properties.relation_type,
        confidence: rel.properties.confidence || 0.8,
      })),
      attack_techniques: [],
      mitre_techniques: [],
      blast_radius: {
        node_count: nodes.length,
        edge_count: relationships.length,
        critical_assets: 0,
        estimated_impact: 'High',
      },
      risk_score: 75,
      exploitability: 0.75,
      impact: 0.85,
      remediation_points: [],
    };
  }
}

export default ThreatGraphClient;
