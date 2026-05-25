import { NextRequest } from 'next/server';
import { ThreatNodeSchema, ThreatEdgeSchema, AttackPathSchema } from '@sentinelos/schema';
import { getDatabase } from '@sentinelos/database';
import {
  successResponse,
  validationError,
  errorResponse,
} from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import { getQueryParam, parseBody } from '@/lib/request';

const logger = createLogger('threat-graph-api');

/**
 * GET /api/threat-graph
 * Fetch threat graph nodes and edges
 */
export async function GET(request: NextRequest) {
  try {
    const nodeType = getQueryParam(request, 'nodeType') || undefined;

    logger.debug('Fetching threat graph', { nodeType });

    const db = getDatabase();
    const threatGraphRepository = db.getThreatGraphRepository();

    // Fetch nodes and edges from database
    const nodes = await threatGraphRepository.findAllNodes(nodeType);
    const edges = await threatGraphRepository.findAllEdges();

    // Find all attack paths
    const paths: any[] = [];
    for (const source of nodes) {
      for (const target of nodes) {
        if (source.node_id !== target.node_id) {
          const targetPaths = await threatGraphRepository.findAttackPaths(
            source.node_id,
            target.node_id
          );
          paths.push(...targetPaths);
        }
      }
    }

    // Validate all data against schemas
    const validatedNodes = nodes.map((n) => ThreatNodeSchema.parse(n));
    const validatedEdges = edges.map((e) => ThreatEdgeSchema.parse(e));
    const validatedPaths = paths.map((p) => AttackPathSchema.parse(p));

    logger.info(`Fetched ${validatedNodes.length} nodes and ${validatedEdges.length} edges`);

    return successResponse({
      nodes: validatedNodes,
      edges: validatedEdges,
      paths: validatedPaths,
    });
  } catch (error) {
    logger.error('Error fetching threat graph', error as Error);
    return errorResponse('Failed to fetch threat graph', 500);
  }
}

/**
 * POST /api/threat-graph/analyze
 * Analyze attack path
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request);

    if (!body.source_node || !body.target_node) {
      return validationError('source_node and target_node are required');
    }

    logger.debug('Analyzing attack path', {
      source: body.source_node,
      target: body.target_node,
    });

    const db = getDatabase();
    const threatGraphRepository = db.getThreatGraphRepository();

    // Find attack paths between nodes
    const paths = await threatGraphRepository.findAttackPaths(
      body.source_node,
      body.target_node
    );

    const analysis = {
      source: body.source_node,
      target: body.target_node,
      paths: paths.map((p) => ({
        hops: p.hops,
        risk_score: p.risk_score,
        techniques: body.techniques || [],
      })),
      critical_nodes: [body.source_node, body.target_node],
      recommendations: [
        'Isolate compromised endpoint',
        'Monitor lateral movement attempts',
        'Implement network segmentation',
      ],
    };

    logger.info(`Attack path analysis completed: ${paths.length} paths found`);

    return successResponse(analysis);
  } catch (error) {
    logger.error('Error analyzing threat graph', error as Error);
    return errorResponse('Failed to analyze threat graph', 500);
  }
}
