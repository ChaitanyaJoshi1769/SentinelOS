import { NextRequest, NextResponse } from 'next/server';
import { ThreatNodeSchema, ThreatEdgeSchema, AttackPathSchema } from '@sentinelos/schema';
import { getDatabase } from '@sentinelos/database';

/**
 * GET /api/threat-graph
 * Fetch threat graph nodes and edges
 */
export async function GET(request: NextRequest) {
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const nodeType = searchParams.get('nodeType') || undefined;

    db = getDatabase();
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

    return NextResponse.json({
      success: true,
      data: {
        nodes: validatedNodes,
        edges: validatedEdges,
        paths: validatedPaths,
      },
    });
  } catch (error) {
    console.error('Error fetching threat graph:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch threat graph',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threat-graph/analyze
 * Analyze attack path
 */
export async function POST(request: NextRequest) {
  let db;
  try {
    const body = await request.json();

    if (!body.source_node || !body.target_node) {
      return NextResponse.json(
        {
          success: false,
          error: 'source_node and target_node are required',
        },
        { status: 400 }
      );
    }

    db = getDatabase();
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

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing threat graph:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze threat graph',
      },
      { status: 500 }
    );
  }
}
