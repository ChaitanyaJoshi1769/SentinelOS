/**
 * Threat graph types for attack path analysis and entity relationships
 */

/**
 * Entity types in threat graph
 */
export enum ThreatEntityType {
  ENDPOINT = 'endpoint',
  PROCESS = 'process',
  FILE = 'file',
  REGISTRY_KEY = 'registry_key',
  NETWORK_CONNECTION = 'network_connection',
  IDENTITY = 'identity',
  GROUP = 'group',
  SERVICE_ACCOUNT = 'service_account',
  CLOUD_RESOURCE = 'cloud_resource',
  CLOUD_BUCKET = 'cloud_bucket',
  CLOUD_VM = 'cloud_vm',
  PRIVILEGE = 'privilege',
  VULNERABILITY = 'vulnerability',
  INDICATOR = 'indicator',
  IP_ADDRESS = 'ip_address',
  DOMAIN = 'domain',
  FILE_HASH = 'file_hash',
  THREAT_ACTOR = 'threat_actor',
  MALWARE_FAMILY = 'malware_family',
  ATTACK_TECHNIQUE = 'attack_technique',
}

/**
 * Relationship types in threat graph
 */
export enum ThreatRelationType {
  // Execution relationships
  EXECUTED_BY = 'executed_by',
  EXECUTED = 'executed',
  LAUNCHED = 'launched',
  LAUNCHED_FROM = 'launched_from',

  // File relationships
  CREATED = 'created',
  CREATED_BY = 'created_by',
  MODIFIED = 'modified',
  MODIFIED_BY = 'modified_by',
  DELETED = 'deleted',
  DELETED_BY = 'deleted_by',
  CONTAINS = 'contains',
  CONTAINED_IN = 'contained_in',

  // Network relationships
  CONNECTED_TO = 'connected_to',
  CONNECTED_FROM = 'connected_from',
  RESOLVED_TO = 'resolved_to',
  RESOLVED_FROM = 'resolved_from',
  COMMUNICATED_WITH = 'communicated_with',

  // Privilege relationships
  GRANTED_TO = 'granted_to',
  GRANTED_BY = 'granted_by',
  MEMBER_OF = 'member_of',
  HAS_MEMBER = 'has_member',
  ADMIN_OF = 'admin_of',

  // Resource relationships
  OWNS = 'owns',
  OWNED_BY = 'owned_by',
  ACCESSED = 'accessed',
  ACCESSED_BY = 'accessed_by',

  // Vulnerability relationships
  EXPLOITS = 'exploits',
  EXPLOITED_BY = 'exploited_by',
  AFFECTED_BY = 'affected_by',

  // Intelligence relationships
  ATTRIBUTED_TO = 'attributed_to',
  ATTRIBUTED = 'attributed',
  RELATED_TO = 'related_to',
  USES = 'uses',
  USED_BY = 'used_by',

  // Behavior relationships
  INDICATIVE_OF = 'indicative_of',
  EXHIBITS = 'exhibits',
}

/**
 * Threat graph node
 */
export interface ThreatGraphNode {
  node_id: string;
  entity_type: ThreatEntityType;
  entity_id: string;
  name: string;
  display_name?: string;

  // Properties specific to entity type
  properties: {
    // Common
    created_at?: number;
    updated_at?: number;
    last_seen?: number;

    // Endpoint
    hostname?: string;
    os?: string;
    os_version?: string;
    ip_address?: string;

    // Identity
    user_principal_name?: string;
    email?: string;
    department?: string;

    // Process
    process_name?: string;
    process_id?: number;
    command_line?: string;
    parent_process_id?: number;

    // File
    file_path?: string;
    file_hash?: string;
    file_size?: number;

    // Resource
    resource_type?: string;
    resource_arn?: string;

    // Indicator
    indicator_type?: string;
    indicator_value?: string;
    threat_level?: 'critical' | 'high' | 'medium' | 'low';

    // Network
    port?: number;
    protocol?: string;

    // Vulnerability
    cve_id?: string;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    cvss_score?: number;

    [key: string]: any;
  };

  // Risk scoring
  risk_score: number; // 0-100
  criticality: 'critical' | 'high' | 'medium' | 'low';

  // Node metadata
  data_sources: string[]; // Where this entity came from
  confidence: number; // 0-1
}

/**
 * Threat graph edge/relationship
 */
export interface ThreatGraphEdge {
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: ThreatRelationType;

  // Edge properties
  properties?: Record<string, any>;
  properties_details?: {
    timestamp?: number;
    frequency?: number;
    confidence?: number;
    ttl?: number;
    [key: string]: any;
  };

  // Temporal information
  first_observed: number;
  last_observed: number;
  observation_count: number;

  // Evidence
  evidence: string[];
  data_sources: string[];
}

/**
 * Attack path in graph
 */
export interface AttackPath {
  path_id: string;
  source_node_id: string;
  target_node_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';

  // Path traversal
  hops: number;
  path_nodes: Array<{
    node_id: string;
    entity_type: ThreatEntityType;
    name: string;
    risk_score: number;
  }>;

  // Edges traversed
  path_edges: Array<{
    edge_id: string;
    relation_type: ThreatRelationType;
    confidence: number;
  }>;

  // Attack information
  attack_techniques: string[];
  mitre_techniques: string[];

  // Blast radius
  blast_radius: {
    node_count: number;
    edge_count: number;
    critical_assets: number;
    estimated_impact: string;
  };

  // Risk assessment
  risk_score: number;
  exploitability: number; // 0-1
  impact: number; // 0-1

  // Remediation steps
  remediation_points: Array<{
    node_id: string;
    action: string;
    estimated_impact: string;
    risk_reduction: number;
  }>;
}

/**
 * Graph query for analysis
 */
export interface GraphQuery {
  query_id: string;
  query_type: 'shortest_path' | 'all_paths' | 'neighborhood' | 'subgraph' | 'traversal' | 'pattern_match';

  // Query parameters
  start_node_id?: string;
  end_node_id?: string;
  node_type?: ThreatEntityType;
  relation_type?: ThreatRelationType;
  max_depth?: number;
  max_results?: number;

  // Filters
  filters?: {
    risk_score_min?: number;
    risk_score_max?: number;
    criticality?: ('critical' | 'high' | 'medium' | 'low')[];
    time_range?: {
      start: number;
      end: number;
    };
    data_sources?: string[];
    confidence_min?: number;
  };

  // Output format
  include_paths?: boolean;
  include_properties?: boolean;
  include_evidence?: boolean;

  // Async execution
  created_at: number;
  completed_at?: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

/**
 * Graph traversal for investigation
 */
export interface GraphTraversal {
  traversal_id: string;
  start_node: ThreatGraphNode;
  current_nodes: ThreatGraphNode[];
  visited_nodes: Set<string>;
  visited_edges: Set<string>;

  // Traversal history
  history: Array<{
    timestamp: number;
    action: string;
    node_id: string;
    neighbors_found: number;
  }>;

  // Current context
  findings: Array<{
    node_id: string;
    finding_type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
  }>;

  // Recommendations
  recommendations: Array<{
    type: string;
    target_node_id: string;
    action: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

/**
 * Graph correlation result
 */
export interface GraphCorrelation {
  correlation_id: string;
  timestamp: number;

  // Correlation details
  alerts_involved: string[];
  entities_involved: string[];
  common_indicators: string[];

  // Attack context
  likely_attack_chain: AttackPath[];
  threat_actors: Array<{
    actor_id: string;
    name: string;
    confidence: number;
  }>;

  // Risk assessment
  overall_risk: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;

  // Recommendations
  recommended_actions: string[];
  estimated_impact: string;
}
