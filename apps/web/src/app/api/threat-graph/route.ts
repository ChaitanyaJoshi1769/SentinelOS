import { NextRequest, NextResponse } from 'next/server';
import { ThreatNodeSchema, ThreatEdgeSchema, AttackPathSchema } from '@sentinelos/schema';

/**
 * GET /api/threat-graph
 * Fetch threat graph nodes and edges
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeType = searchParams.get('nodeType');

    // Mock threat graph data
    const mockNodes = [
      {
        node_id: 'endpoint_1',
        entity_type: 'endpoint',
        name: 'Compromised Workstation',
        risk_score: 95,
        compromised: true,
        connections: 5,
      },
      {
        node_id: 'file_server',
        entity_type: 'server',
        name: 'File Server',
        risk_score: 85,
        compromised: false,
        connections: 3,
      },
      {
        node_id: 'db_server',
        entity_type: 'database',
        name: 'Database Server',
        risk_score: 90,
        compromised: false,
        connections: 4,
      },
      {
        node_id: 'backup_system',
        entity_type: 'storage',
        name: 'Backup System',
        risk_score: 75,
        compromised: false,
        connections: 2,
      },
      {
        node_id: 'router_1',
        entity_type: 'network',
        name: 'Network Router',
        risk_score: 60,
        compromised: false,
        connections: 4,
      },
    ];

    const mockEdges = [
      {
        edge_id: 'edge_1',
        source_id: 'endpoint_1',
        target_id: 'file_server',
        relation_type: 'connected_to',
        confidence: 0.95,
      },
      {
        edge_id: 'edge_2',
        source_id: 'endpoint_1',
        target_id: 'db_server',
        relation_type: 'can_access',
        confidence: 0.85,
      },
      {
        edge_id: 'edge_3',
        source_id: 'file_server',
        target_id: 'backup_system',
        relation_type: 'replicates_to',
        confidence: 0.9,
      },
      {
        edge_id: 'edge_4',
        source_id: 'endpoint_1',
        target_id: 'router_1',
        relation_type: 'communicates_via',
        confidence: 0.88,
      },
    ];

    const mockPaths = [
      {
        source: 'endpoint_1',
        target: 'file_server',
        hops: 1,
        risk_score: 0.92,
      },
      {
        source: 'endpoint_1',
        target: 'db_server',
        hops: 2,
        risk_score: 0.88,
      },
      {
        source: 'endpoint_1',
        target: 'backup_system',
        hops: 3,
        risk_score: 0.85,
      },
    ];

    // Validate data against schemas
    const validatedNodes = mockNodes.map((n) => ThreatNodeSchema.parse(n));
    const validatedEdges = mockEdges.map((e) => ThreatEdgeSchema.parse(e));
    const validatedPaths = mockPaths.map((p) => AttackPathSchema.parse(p));

    // Filter by node type if provided
    let nodes = validatedNodes;
    if (nodeType) {
      nodes = nodes.filter((n) => n.entity_type === nodeType);
    }

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        edges: validatedEdges,
        paths: validatedPaths,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
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

    // Mock path analysis
    const analysis = {
      source: body.source_node,
      target: body.target_node,
      paths: [
        {
          hops: 2,
          path: [body.source_node, 'intermediate_node', body.target_node],
          risk_score: 0.87,
          techniques: ['T1566.002', 'T1087.004', 'T1021.001'],
        },
      ],
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
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
