'use client';

import React, { useState, useEffect } from 'react';

export interface ThreatNode {
  node_id: string;
  entity_type: string;
  name: string;
  risk_score: number;
  compromised: boolean;
  connections: number;
}

export interface ThreatEdge {
  edge_id: string;
  source_id: string;
  target_id: string;
  relation_type: string;
  confidence: number;
}

export interface PathInfo {
  source: string;
  target: string;
  hops: number;
  risk_score: number;
}

/**
 * Threat Graph Explorer
 * Visualizes attack paths and threat relationships
 */
export default function ThreatGraphPage() {
  const [selectedNode, setSelectedNode] = useState<ThreatNode | null>(null);
  const [nodes, setNodes] = useState<ThreatNode[]>([]);
  const [edges, setEdges] = useState<ThreatEdge[]>([]);
  const [paths, setPaths] = useState<PathInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      // Mock data
      const mockNodes: ThreatNode[] = [
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

      const mockEdges: ThreatEdge[] = [
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

      const mockPaths: PathInfo[] = [
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

      setNodes(mockNodes);
      setEdges(mockEdges);
      setPaths(mockPaths);
      setSelectedNode(mockNodes[0]);
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    return 'info';
  };

  if (loading) {
    return <div className="p-6">Loading threat graph...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Threat Intelligence Graph</h1>

      <div className="grid grid-cols-4 gap-6">
        {/* Graph Visualization */}
        <div className="col-span-3">
          <div className="card bg-base-200 shadow-lg h-[600px]">
            <div className="card-body p-4">
              <h2 className="card-title text-lg">Attack Graph</h2>

              {/* Simple ASCII-style graph representation */}
              <div className="bg-base-100 rounded p-4 flex-1 overflow-auto font-mono text-xs leading-tight">
                <pre>{`
┌─────────────────────────────────────────────────────┐
│                                                     │
│         ┌──────────────────────┐                   │
│         │  Compromised         │                   │
│         │  Workstation (E1)    │  Risk: 95%        │
│         │  [CRITICAL]          │                   │
│         └──────────┬───────────┘                   │
│                    │                                │
│     ┌──────────────┼──────────────┐                │
│     │              │              │                │
│  [95%] [90%]   [85%]  [80%]                        │
│     │              │              │                │
│   ┌─┴──┐        ┌──┴──┐        ┌──┴──┐             │
│   │File│        │ DB  │        │Back │             │
│   │Srv │        │ Srv │        │ up  │             │
│   └────┘        └─────┘        └─────┘             │
│                                                     │
│  Lateral Movement Paths: 3                          │
│  Critical Assets at Risk: 2                         │
│                                                     │
└─────────────────────────────────────────────────────┘
                `}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Statistics & Details */}
        <div className="col-span-1 space-y-4">
          {/* Overview */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body p-4">
              <h3 className="font-semibold text-sm">Graph Overview</h3>

              <div className="space-y-2 text-sm mt-3">
                <div className="flex justify-between">
                  <span className="opacity-75">Total Nodes</span>
                  <span className="font-semibold">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Relationships</span>
                  <span className="font-semibold">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Attack Paths</span>
                  <span className="font-semibold">{paths.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Compromised</span>
                  <span className="font-semibold text-error">
                    {nodes.filter((n) => n.compromised).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nodes List */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body p-4">
              <h3 className="font-semibold text-sm mb-2">Entities</h3>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {nodes.map((node) => (
                  <button
                    key={node.node_id}
                    onClick={() => setSelectedNode(node)}
                    className={`w-full text-left p-2 rounded text-xs transition ${
                      selectedNode?.node_id === node.node_id
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-100 hover:bg-base-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold truncate">
                        {node.name}
                      </span>
                      {node.compromised && (
                        <span className="badge badge-error badge-xs">
                          C
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-75">
                      Risk: {node.risk_score}%
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNode && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body p-4">
                <h3 className="font-semibold text-sm">Node Details</h3>

                <div className="space-y-2 text-xs mt-3">
                  <div>
                    <span className="opacity-75">ID</span>
                    <div className="font-mono text-xs truncate">
                      {selectedNode.node_id}
                    </div>
                  </div>
                  <div>
                    <span className="opacity-75">Type</span>
                    <div className="capitalize">
                      {selectedNode.entity_type}
                    </div>
                  </div>
                  <div>
                    <span className="opacity-75">Risk Score</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-base-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-${getRiskColor(selectedNode.risk_score)}`}
                          style={{
                            width: `${selectedNode.risk_score}%`,
                          }}
                        ></div>
                      </div>
                      <span>{selectedNode.risk_score}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="opacity-75">Connections</span>
                    <div>{selectedNode.connections}</div>
                  </div>
                </div>

                <div className="divider my-2"></div>

                <button className="btn btn-primary btn-xs w-full">
                  View Attack Paths
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attack Paths */}
      <div className="card bg-base-200 shadow-lg mt-6">
        <div className="card-body">
          <h2 className="card-title">Attack Paths</h2>

          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Target</th>
                  <th>Hops</th>
                  <th>Risk Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paths.map((path, idx) => (
                  <tr key={idx}>
                    <td className="font-mono text-xs">{path.source}</td>
                    <td className="font-mono text-xs">{path.target}</td>
                    <td>
                      <span className="badge">{path.hops}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-base-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-${getRiskColor(path.risk_score * 100)}`}
                            style={{
                              width: `${path.risk_score * 100}%`,
                            }}
                          ></div>
                        </div>
                        {(path.risk_score * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-xs btn-ghost">
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
