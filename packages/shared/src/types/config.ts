/**
 * Configuration types for SentinelOS
 */

/**
 * Database configuration
 */
export interface DatabaseConfig {
  type: 'postgresql' | 'clickhouse' | 'neo4j';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool_size?: number;
  connection_timeout_ms?: number;
}

/**
 * Redis configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  ttl_seconds: number;
  cluster?: {
    nodes: Array<{ host: string; port: number }>;
    options?: Record<string, any>;
  };
}

/**
 * Kafka configuration
 */
export interface KafkaConfig {
  brokers: string[];
  security_protocol?: 'plaintext' | 'ssl' | 'sasl_plaintext' | 'sasl_ssl';
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  consumer_group: string;
  auto_offset_reset: 'earliest' | 'latest';
}

/**
 * Telemetry integration configuration
 */
export interface TelemetryIntegrationConfig {
  integration_id: string;
  integration_type:
    | 'crowdstrike'
    | 'microsoft_defender'
    | 'splunk'
    | 'elastic'
    | 'wiz'
    | 'okta'
    | 'aws_cloudtrail'
    | 'gcp_logging'
    | 'azure_sentinel'
    | 'paloalto';

  // Authentication
  api_key?: string;
  api_secret?: string;
  oauth_config?: {
    client_id: string;
    client_secret: string;
    token_url: string;
  };

  // Endpoint configuration
  endpoint?: string;
  region?: string;

  // Data ingestion
  enabled: boolean;
  batch_size: number;
  polling_interval_seconds: number;

  // Field mapping
  field_mappings: Record<string, string>;

  // Filters
  filters?: {
    event_types?: string[];
    severity_min?: string;
    exclude_paths?: string[];
  };

  // Metadata
  created_at: number;
  last_tested_at?: number;
  test_status?: 'success' | 'failed' | 'untested';
}

/**
 * AI model configuration
 */
export interface AIModelConfig {
  model_id: string;
  model_name: string;
  provider: 'anthropic' | 'openai' | 'local';

  // Model parameters
  model_type: string;
  temperature: number; // 0-2
  max_tokens: number;
  top_p?: number;

  // API configuration
  api_key: string;
  api_endpoint?: string;

  // Rate limiting
  rate_limit: {
    requests_per_minute: number;
    tokens_per_minute: number;
  };

  // Fallback
  fallback_model?: string;

  // Cache configuration
  use_cache: boolean;
  cache_ttl_seconds?: number;

  // Cost optimization
  use_batch_api?: boolean;
}

/**
 * Detection engine configuration
 */
export interface DetectionEngineConfig {
  engine_id: string;
  engine_type: 'sigma' | 'yara' | 'threshold' | 'ai_model' | 'behavioral' | 'hybrid';

  // Detection rules
  rule_sets: Array<{
    rule_set_id: string;
    name: string;
    enabled: boolean;
    update_interval_hours: number;
    source: {
      type: 'builtin' | 'custom' | 'external';
      url?: string;
      refresh_interval_hours?: number;
    };
  }>;

  // Detection parameters
  minimum_confidence: number; // 0-1
  minimum_severity: string;

  // Alert generation
  alert_config: {
    enabled: boolean;
    correlation_window_seconds: number;
    deduplication_enabled: boolean;
    deduplication_window_seconds: number;
  };

  // Tuning
  false_positive_threshold: number;
  learning_mode: boolean;

  // Resource limits
  max_concurrent_checks: number;
  timeout_ms: number;
}

/**
 * Graph database configuration
 */
export interface GraphDatabaseConfig {
  database: DatabaseConfig;

  // Query optimization
  cache_enabled: boolean;
  cache_size_mb: number;

  // Indexing
  indexes: Array<{
    label: string;
    properties: string[];
    unique: boolean;
  }>;

  // Constraints
  constraints: Array<{
    label: string;
    properties: string[];
  }>;

  // Maintenance
  maintenance_enabled: boolean;
  maintenance_window: {
    day_of_week: number;
    hour: number;
  };
}

/**
 * Investigation engine configuration
 */
export interface InvestigationEngineConfig {
  engine_id: string;

  // Investigation parameters
  max_investigation_depth: number;
  investigation_timeout_ms: number;

  // Agent configuration
  agents_enabled: string[];
  agent_config: Record<string, AIModelConfig>;

  // Graph traversal
  max_graph_traversal_hops: number;
  traversal_sampling?: number; // Percentage of paths to explore

  // Evidence collection
  evidence_retention_days: number;
  evidence_compression_enabled: boolean;

  // Notification
  notifications_enabled: boolean;
  notification_channels: Array<{
    channel_type: 'email' | 'slack' | 'webhook';
    config: Record<string, any>;
  }>;
}

/**
 * Remediation configuration
 */
export interface RemediationConfig {
  engine_id: string;

  // Approval workflow
  approval_required: boolean;
  approval_roles: string[];
  approval_timeout_minutes: number;

  // Automation levels
  automation_levels: {
    automatic_actions: string[]; // Actions that run without approval
    low_risk_threshold: number;
    medium_risk_threshold: number;
    high_risk_threshold: number;
  };

  // Execution
  execution_timeout_ms: number;
  max_concurrent_executions: number;
  rollback_enabled: boolean;

  // Integration configuration
  tool_configs: Record<
    string,
    {
      enabled: boolean;
      api_endpoint: string;
      authentication: Record<string, string>;
      rate_limit_per_minute: number;
    }
  >;

  // Safety
  dry_run_mode: boolean;
  safety_checks_enabled: boolean;
}

/**
 * Overall system configuration
 */
export interface SentinelOSConfig {
  // Environment
  environment: 'development' | 'staging' | 'production';
  debug: boolean;

  // Server
  server: {
    host: string;
    port: number;
    tls_enabled: boolean;
    tls_cert_path?: string;
    tls_key_path?: string;
  };

  // Databases
  databases: {
    postgres: DatabaseConfig;
    clickhouse: DatabaseConfig;
    neo4j: DatabaseConfig;
  };

  // Caching
  redis: RedisConfig;

  // Message queue
  kafka: KafkaConfig;

  // Telemetry integrations
  integrations: TelemetryIntegrationConfig[];

  // AI/ML
  ai_models: AIModelConfig[];

  // Engines
  detection_engine: DetectionEngineConfig;
  investigation_engine: InvestigationEngineConfig;
  remediation_engine: RemediationConfig;
  graph_database: GraphDatabaseConfig;

  // Security
  security: {
    enable_tls: boolean;
    enable_mtls: boolean;
    jwt_secret: string;
    jwt_expiry_seconds: number;
    password_min_length: number;
    password_require_special_chars: boolean;
    session_timeout_minutes: number;
  };

  // Observability
  observability: {
    logs_enabled: boolean;
    metrics_enabled: boolean;
    traces_enabled: boolean;
    log_level: 'debug' | 'info' | 'warn' | 'error';
  };

  // Rate limiting
  rate_limiting: {
    enabled: boolean;
    requests_per_minute: number;
    burst_size: number;
  };

  // Feature flags
  features: {
    autonomous_remediation: boolean;
    ai_powered_triage: boolean;
    graph_correlation: boolean;
    threat_actor_detection: boolean;
  };
}

/**
 * Configuration loader utilities
 */
export interface ConfigLoader {
  load(): Promise<SentinelOSConfig>;
  validate(config: SentinelOSConfig): Promise<void>;
  watch(callback: (config: SentinelOSConfig) => void): void;
}
