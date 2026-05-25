-- Initialize SentinelOS Database Schema

-- Investigations table
CREATE TABLE IF NOT EXISTS investigations (
  investigation_id VARCHAR(255) PRIMARY KEY,
  alert_id VARCHAR(255) NOT NULL UNIQUE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  confidence DECIMAL(3, 2) NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]',
  timeline JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  ai_narrative TEXT,
  assigned_analyst VARCHAR(255),
  tags JSONB DEFAULT '[]',
  INDEX_created_at BIGINT GENERATED ALWAYS AS (created_at) STORED
);

CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_created_at ON investigations(created_at DESC);

-- Threat nodes table
CREATE TABLE IF NOT EXISTS threat_nodes (
  node_id VARCHAR(255) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  risk_score DECIMAL(5, 2) NOT NULL,
  compromised BOOLEAN NOT NULL DEFAULT FALSE,
  connections INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  last_seen BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_threat_nodes_entity_type ON threat_nodes(entity_type);
CREATE INDEX IF NOT EXISTS idx_threat_nodes_risk_score ON threat_nodes(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_threat_nodes_compromised ON threat_nodes(compromised);

-- Threat edges table
CREATE TABLE IF NOT EXISTS threat_edges (
  edge_id VARCHAR(255) PRIMARY KEY,
  source_id VARCHAR(255) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  relation_type VARCHAR(50) NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL,
  first_seen BIGINT,
  last_seen BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES threat_nodes(node_id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES threat_nodes(node_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_threat_edges_source ON threat_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_threat_edges_target ON threat_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_threat_edges_relation ON threat_edges(relation_type);

-- Remediation actions table
CREATE TABLE IF NOT EXISTS remediation_actions (
  action_id VARCHAR(255) PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  estimated_impact TEXT,
  estimated_duration_seconds INTEGER,
  rollback_possible BOOLEAN DEFAULT FALSE,
  rollback_steps JSONB,
  requires_approval BOOLEAN DEFAULT TRUE,
  approval_justification TEXT,
  execution_order INTEGER,
  investigation_id VARCHAR(255),
  tags JSONB,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY (investigation_id) REFERENCES investigations(investigation_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_remediation_actions_status ON remediation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_investigation ON remediation_actions(investigation_id);

-- Approval requests table
CREATE TABLE IF NOT EXISTS approval_requests (
  request_id VARCHAR(255) PRIMARY KEY,
  action_id VARCHAR(255) NOT NULL,
  action_description TEXT NOT NULL,
  investigation_id VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  requested_by VARCHAR(255) NOT NULL,
  requested_at BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approver VARCHAR(255),
  approval_time BIGINT,
  approval_notes TEXT,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (action_id) REFERENCES remediation_actions(action_id) ON DELETE CASCADE,
  FOREIGN KEY (investigation_id) REFERENCES investigations(investigation_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_action ON approval_requests(action_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_expires ON approval_requests(expires_at);

-- Security metrics table
CREATE TABLE IF NOT EXISTS security_metrics (
  metric_id VARCHAR(255) PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  alerts_total INTEGER NOT NULL DEFAULT 0,
  alerts_critical INTEGER NOT NULL DEFAULT 0,
  alerts_high INTEGER NOT NULL DEFAULT 0,
  alerts_medium INTEGER NOT NULL DEFAULT 0,
  alerts_low INTEGER NOT NULL DEFAULT 0,
  investigations_created INTEGER NOT NULL DEFAULT 0,
  investigations_completed INTEGER NOT NULL DEFAULT 0,
  avg_investigation_time DECIMAL(10, 2) NOT NULL DEFAULT 0,
  remediation_success_rate DECIMAL(3, 2) NOT NULL DEFAULT 0,
  detection_accuracy DECIMAL(3, 2),
  false_positive_rate DECIMAL(3, 2),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_metrics_date ON security_metrics(date DESC);
