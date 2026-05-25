/**
 * AI Agent types for autonomous investigation and orchestration
 */

/**
 * Agent types in SentinelOS
 */
export enum AgentType {
  TRIAGE_AGENT = 'triage_agent',
  INVESTIGATION_AGENT = 'investigation_agent',
  THREAT_ANALYST_AGENT = 'threat_analyst_agent',
  GRAPH_ANALYZER_AGENT = 'graph_analyzer_agent',
  REMEDIATION_PLANNER_AGENT = 'remediation_planner_agent',
  EVIDENCE_COLLECTOR_AGENT = 'evidence_collector_agent',
  THREAT_INTELLIGENCE_AGENT = 'threat_intelligence_agent',
  BEHAVIORAL_ANALYZER_AGENT = 'behavioral_analyzer_agent',
  INCIDENT_COMMANDER_AGENT = 'incident_commander_agent',
}

/**
 * Agent task state
 */
export enum AgentTaskState {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  DELEGATED = 'delegated',
  WAITING = 'waiting',
  COMPLETE = 'complete',
  FAILED = 'failed',
  ABANDONED = 'abandoned',
}

/**
 * Agent task
 */
export interface AgentTask {
  task_id: string;
  agent_id: string;
  parent_task_id?: string;
  task_type: string;

  // Task details
  title: string;
  description: string;
  objective: string;

  // Context
  context: Record<string, any>;
  input_data?: Record<string, any>;

  // Execution
  state: AgentTaskState;
  started_at?: number;
  completed_at?: number;
  duration_ms?: number;

  // Results
  output_data?: Record<string, any>;
  findings?: string[];
  confidence?: number;

  // Error handling
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };

  // Metadata
  priority: 'critical' | 'high' | 'medium' | 'low';
  retry_count: number;
  max_retries: number;

  // Sub-tasks
  subtasks: AgentTask[];

  // Reasoning trace
  reasoning_trace?: Array<{
    step: number;
    action: string;
    reasoning: string;
    result?: any;
  }>;
}

/**
 * Agent action
 */
export interface AgentAction {
  action_id: string;
  agent_id: string;
  task_id: string;

  // Action definition
  action_type: 'query' | 'analyze' | 'correlate' | 'execute' | 'delegate' | 'escalate' | 'recommend';
  description: string;

  // Parameters
  parameters: Record<string, any>;

  // Execution
  status: 'pending' | 'executing' | 'completed' | 'failed';
  started_at?: number;
  completed_at?: number;

  // Results
  result?: {
    success: boolean;
    data: any;
    message?: string;
  };

  // Context
  context?: Record<string, any>;
}

/**
 * Agent decision
 */
export interface AgentDecision {
  decision_id: string;
  agent_id: string;
  task_id: string;

  // Decision context
  decision_type: string;
  options: Array<{
    option_id: string;
    description: string;
    pros: string[];
    cons: string[];
    estimated_impact: string;
  }>;

  // Decision details
  chosen_option_id: string;
  reasoning: string;
  confidence: number;

  // Risk assessment
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  risk_factors: string[];

  // Metadata
  timestamp: number;
  reviewed_by?: string;
  approved: boolean;
}

/**
 * Agent message
 */
export interface AgentMessage {
  message_id: string;
  agent_id: string;
  timestamp: number;

  // Message content
  role: 'user' | 'assistant' | 'system';
  content: string;

  // Structured data
  tool_calls?: Array<{
    tool_name: string;
    tool_input: Record<string, any>;
  }>;

  tool_results?: Array<{
    tool_name: string;
    result: any;
    error?: string;
  }>;

  // Metadata
  conversation_id: string;
  parent_message_id?: string;
}

/**
 * Agent conversation for multi-turn interaction
 */
export interface AgentConversation {
  conversation_id: string;
  investigation_id: string;

  // Participants
  agents: Array<{
    agent_id: string;
    agent_type: AgentType;
    role: 'coordinator' | 'analyst' | 'specialist';
  }>;

  // Messages
  messages: AgentMessage[];
  message_count: number;

  // State
  status: 'active' | 'paused' | 'complete' | 'failed';
  created_at: number;
  updated_at: number;
  closed_at?: number;

  // Summary
  summary?: {
    key_findings: string[];
    decisions_made: string[];
    recommendations: string[];
    confidence: number;
  };

  // Context
  context: {
    investigation_id: string;
    alert_ids: string[];
    entity_ids: string[];
    threat_level: 'critical' | 'high' | 'medium' | 'low';
  };
}

/**
 * Agent state
 */
export interface AgentState {
  agent_id: string;
  agent_type: AgentType;

  // Current state
  state: 'idle' | 'active' | 'waiting' | 'delegating' | 'error';
  current_task_id?: string;

  // Performance
  tasks_completed: number;
  tasks_in_progress: number;
  success_rate: number;
  average_time_ms: number;

  // Capabilities
  capabilities: string[];
  tools_available: string[];

  // Configuration
  config: {
    temperature?: number;
    max_tokens?: number;
    timeout_ms?: number;
    retry_policy?: {
      max_retries: number;
      backoff_ms: number;
    };
  };

  // Metrics
  metrics: {
    total_tasks: number;
    successful_tasks: number;
    failed_tasks: number;
    average_confidence: number;
  };

  // Last activity
  last_activity_at?: number;
  last_error?: {
    timestamp: number;
    code: string;
    message: string;
  };
}

/**
 * Multi-agent collaboration
 */
export interface AgentCollaboration {
  collaboration_id: string;
  investigation_id: string;

  // Participants
  coordinator_agent_id: string;
  specialist_agents: Array<{
    agent_id: string;
    agent_type: AgentType;
    responsibility: string;
  }>;

  // Coordination
  status: 'initiated' | 'planning' | 'executing' | 'analyzing' | 'complete';
  created_at: number;
  completed_at?: number;

  // Plan
  plan?: {
    phases: Array<{
      phase_id: string;
      description: string;
      agents: string[];
      tasks: string[];
      dependencies: string[];
    }>;
  };

  // Results
  results: {
    key_findings: string[];
    evidence_collected: Array<{
      source: string;
      data: any;
      confidence: number;
    }>;
    attack_assessment: string;
    recommended_actions: string[];
  };

  // Performance
  metrics: {
    total_time_ms: number;
    phases_completed: number;
    coordination_efficiency: number;
  };
}

/**
 * Agent tool definition
 */
export interface AgentTool {
  tool_id: string;
  tool_name: string;
  description: string;

  // Input schema
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };

  // Output schema
  output_schema?: {
    type: string;
    properties: Record<string, any>;
  };

  // Execution
  handler: (params: Record<string, any>) => Promise<any>;

  // Metadata
  category: string;
  is_safe: boolean;
  requires_approval: boolean;
  rate_limit?: {
    requests_per_minute: number;
  };
}

/**
 * Agent prompt
 */
export interface AgentPrompt {
  prompt_id: string;
  agent_type: AgentType;

  // System prompt
  system_prompt: string;

  // Few-shot examples
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;

  // Instructions
  instructions: string[];

  // Constraints
  constraints: {
    max_investigation_depth?: number;
    max_api_calls?: number;
    max_reasoning_steps?: number;
    forbidden_actions?: string[];
  };

  // Version control
  version: string;
  created_at: number;
  updated_at: number;
  active: boolean;
}
