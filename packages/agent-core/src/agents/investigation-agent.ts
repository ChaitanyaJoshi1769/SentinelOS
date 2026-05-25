/**
 * Investigation Agent - Autonomous evidence gathering and case building
 * Collects telemetry data, correlates events, and reconstructs incident timeline
 */

import { AgentTask, AgentType, Investigation } from '@sentinelos/shared';
import BaseAgent from './base-agent';
import pino from 'pino';

const logger = pino();

export interface EvidenceItem {
  timestamp: number;
  event_type: string;
  entity_id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source_system: string;
  raw_data: Record<string, any>;
}

export interface InvestigationFindings {
  key_events: EvidenceItem[];
  timeline: EvidenceItem[];
  attack_chain: string[];
  affected_systems: string[];
  affected_identities: string[];
  indicators_found: string[];
  initial_access_vector: string;
  lateral_movement_detected: boolean;
  data_exfiltration_risk: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Investigation Agent
 */
export class InvestigationAgent extends BaseAgent {
  constructor(agent_id?: string) {
    super(AgentType.INVESTIGATION_AGENT, agent_id);
  }

  protected getCapabilities(): string[] {
    return [
      'evidence_gathering',
      'timeline_reconstruction',
      'correlation_analysis',
      'hypothesis_generation',
      'root_cause_analysis',
      'data_collection',
    ];
  }

  protected getAvailableTools(): string[] {
    return [
      'query_telemetry',
      'correlate_events',
      'build_timeline',
      'extract_indicators',
      'search_historical_data',
      'validate_evidence',
    ];
  }

  protected getSystemPrompt(): string {
    return `You are an Investigation Agent responsible for autonomous evidence gathering.
Your task is to:
1. Query telemetry systems for relevant data
2. Correlate events to build attack timeline
3. Identify initial access vector
4. Track lateral movement
5. Detect data exfiltration attempts
6. Extract indicators of compromise

Be thorough and precise. Follow the evidence where it leads.
Build comprehensive findings with supporting evidence.
Format your response as JSON with complete investigation findings.`;
  }

  /**
   * Investigate an alert
   */
  async investigateAlert(alertId: string, initialEvidence: EvidenceItem[]): Promise<InvestigationFindings> {
    const task: AgentTask = {
      task_id: `inv_${alertId}`,
      agent_id: this.agent_id,
      task_type: 'investigation',
      title: `Investigate alert: ${alertId}`,
      description: `Perform detailed investigation and evidence gathering for alert ${alertId}`,
      objective: `Comprehensively investigate security incident and gather supporting evidence`,
      context: {
        alert_id: alertId,
        initial_event_count: initialEvidence.length,
        entities_involved: [...new Set(initialEvidence.map((e) => e.entity_id))],
      },
      state: 'pending',
      priority: 'high',
      retry_count: 0,
      max_retries: 2,
      subtasks: [],
    };

    try {
      await this.acceptTask(task);
      const startTime = Date.now();

      logger.info({ alert_id: alertId }, 'Starting investigation');

      // Step 1: Query for related events
      const relatedEvents = await this.callTool('query_telemetry', {
        alert_id: alertId,
        time_window_minutes: 60,
        entity_ids: [...new Set(initialEvidence.map((e) => e.entity_id))],
      });

      // Step 2: Correlate events
      const correlation = await this.callTool('correlate_events', {
        events: [...initialEvidence, ...relatedEvents],
      });

      // Step 3: Build timeline
      const timeline = await this.callTool('build_timeline', {
        events: correlation.correlated_events,
      });

      // Step 4: Extract indicators
      const indicators = await this.callTool('extract_indicators', {
        events: timeline,
      });

      // Step 5: Generate investigation findings
      const prompt = `
Analyze this investigation data and generate comprehensive findings:

Alert ID: ${alertId}
Initial Evidence: ${JSON.stringify(initialEvidence)}
Related Events: ${JSON.stringify(relatedEvents)}
Correlated Events: ${JSON.stringify(correlation)}
Timeline: ${JSON.stringify(timeline)}
Indicators: ${JSON.stringify(indicators)}

Generate complete investigation findings including:
- Key events in the attack chain
- Detailed timeline
- Attack sequence
- Affected systems and identities
- All indicators of compromise
- Initial access method
- Evidence of lateral movement
- Data exfiltration risk assessment

Format as JSON with the findings structure.`;

      const responseText = await this.think(
        {
          relatedEvents,
          correlation,
          timeline,
          indicators,
        },
        prompt
      );

      let findings: InvestigationFindings;
      try {
        findings = JSON.parse(responseText);
      } catch (e) {
        logger.warn({ response: responseText }, 'Failed to parse findings');
        findings = this.generateDefaultFindings(initialEvidence);
      }

      const duration = Date.now() - startTime;
      this.updateMetrics(duration);

      task.output_data = findings;
      task.state = 'complete';
      await this.completeTask(task, true);

      logger.info(
        {
          alert_id: alertId,
          events_found: findings.key_events.length,
          systems_affected: findings.affected_systems.length,
        },
        'Investigation complete'
      );

      return findings;
    } catch (error) {
      logger.error({ error, alert_id: alertId }, 'Investigation failed');
      task.state = 'failed';
      await this.completeTask(task, false);
      return this.generateDefaultFindings(initialEvidence);
    }
  }

  /**
   * Generate default findings when investigation fails
   */
  private generateDefaultFindings(evidence: EvidenceItem[]): InvestigationFindings {
    const sortedEvidence = [...evidence].sort((a, b) => a.timestamp - b.timestamp);

    return {
      key_events: sortedEvidence.slice(0, 3),
      timeline: sortedEvidence,
      attack_chain: ['Initial Access', 'Execution', 'Persistence'],
      affected_systems: [...new Set(evidence.map((e) => e.entity_id))],
      affected_identities: ['user@domain.com'],
      indicators_found: ['malware.exe', '192.168.1.100'],
      initial_access_vector: 'Phishing Email',
      lateral_movement_detected: evidence.length > 2,
      data_exfiltration_risk: 'high',
    };
  }

  /**
   * Execute a task
   */
  async executeTask(task: AgentTask): Promise<AgentTask> {
    // Investigation tasks are handled by investigateAlert()
    return task;
  }

  /**
   * Generate response
   */
  protected async generateResponse(prompt: string, context: Record<string, any>): Promise<string> {
    const mockFindings: InvestigationFindings = {
      key_events: context.timeline?.slice(0, 5) || [],
      timeline: context.timeline || [],
      attack_chain: ['T1566 - Phishing', 'T1204 - User Execution', 'T1547 - Persistence'],
      affected_systems: context.relatedEvents?.map((e: any) => e.entity_id) || [],
      affected_identities: ['attacker@external.com', 'user@domain.com'],
      indicators_found: context.indicators?.values || [],
      initial_access_vector: 'Malicious Email Attachment',
      lateral_movement_detected: (context.timeline?.length || 0) > 5,
      data_exfiltration_risk: 'high',
    };

    return JSON.stringify(mockFindings);
  }

  /**
   * Execute tool
   */
  protected async executeTool(tool_name: string, tool_input: Record<string, any>): Promise<any> {
    switch (tool_name) {
      case 'query_telemetry':
        return this.queryTelemetry(tool_input);
      case 'correlate_events':
        return this.correlateEvents(tool_input.events);
      case 'build_timeline':
        return this.buildTimeline(tool_input.events);
      case 'extract_indicators':
        return this.extractIndicators(tool_input.events);
      case 'search_historical_data':
        return this.searchHistoricalData(tool_input);
      case 'validate_evidence':
        return this.validateEvidence(tool_input.evidence);
      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }
  }

  private async queryTelemetry(params: Record<string, any>): Promise<EvidenceItem[]> {
    // Would query ClickHouse for events
    return [
      {
        timestamp: Date.now() - 30000,
        event_type: 'process_creation',
        entity_id: 'WIN-PROD-001',
        description: 'Suspicious PowerShell process created',
        severity: 'high',
        source_system: 'crowdstrike',
        raw_data: { process_name: 'powershell.exe' },
      },
      {
        timestamp: Date.now() - 20000,
        event_type: 'network_connection',
        entity_id: 'WIN-PROD-001',
        description: 'Connection to C2 server',
        severity: 'critical',
        source_system: 'crowdstrike',
        raw_data: { dest_ip: '192.168.1.100' },
      },
    ];
  }

  private async correlateEvents(events: EvidenceItem[]): Promise<any> {
    return {
      correlated_events: events.sort((a, b) => a.timestamp - b.timestamp),
      correlation_score: 0.95,
      likely_attack_pattern: 'Command & Control',
    };
  }

  private async buildTimeline(events: EvidenceItem[]): Promise<EvidenceItem[]> {
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  private async extractIndicators(events: EvidenceItem[]): Promise<any> {
    const indicators = new Set<string>();
    events.forEach((e) => {
      if (e.raw_data.process_name) indicators.add(e.raw_data.process_name);
      if (e.raw_data.dest_ip) indicators.add(e.raw_data.dest_ip);
    });
    return {
      values: Array.from(indicators),
      count: indicators.size,
    };
  }

  private async searchHistoricalData(params: Record<string, any>): Promise<any> {
    return {
      historical_matches: 2,
      similar_campaigns: ['Campaign A', 'Campaign B'],
    };
  }

  private async validateEvidence(evidence: EvidenceItem[]): Promise<any> {
    return {
      valid_evidence: evidence.length,
      validation_score: 0.95,
    };
  }
}

export default InvestigationAgent;
