/**
 * Triage Agent - Initial alert assessment and risk scoring
 * Quickly evaluates incoming security alerts for severity and characteristics
 */

import { AgentTask, AgentType, SecurityAlert, SeverityLevel } from '@sentinelos/shared';
import BaseAgent from './base-agent';
import pino from 'pino';

const logger = pino();

export interface TriageResult {
  is_real_threat: boolean;
  confidence: number;
  attack_techniques: string[];
  at_risk_entities: string[];
  priority: SeverityLevel;
  estimated_impact: string;
  rationale: string;
  requires_immediate_action: boolean;
  estimated_investigation_time_minutes: number;
}

/**
 * Triage Agent
 */
export class TriageAgent extends BaseAgent {
  constructor(agent_id?: string) {
    super(AgentType.TRIAGE_AGENT, agent_id);
  }

  protected getCapabilities(): string[] {
    return [
      'alert_assessment',
      'risk_scoring',
      'threat_classification',
      'urgency_assessment',
      'false_positive_detection',
      'priority_ranking',
    ];
  }

  protected getAvailableTools(): string[] {
    return [
      'lookup_ioc',
      'check_threat_intelligence',
      'assess_asset_criticality',
      'analyze_attack_technique',
      'score_risk',
      'check_historical_patterns',
    ];
  }

  protected getSystemPrompt(): string {
    return `You are a Triage Agent responsible for initial alert assessment.
Your task is to:
1. Evaluate the severity and legitimacy of security alerts
2. Score threat confidence (0-1)
3. Identify relevant attack techniques (MITRE ATT&CK)
4. Assess entity risk
5. Determine priority level
6. Identify false positives

Be decisive but thorough. Provide clear reasoning for your assessment.
Format your response as JSON with the following structure:
{
  "is_real_threat": boolean,
  "confidence": number (0-1),
  "attack_techniques": string[],
  "at_risk_entities": string[],
  "priority": "critical" | "high" | "medium" | "low",
  "estimated_impact": string,
  "rationale": string,
  "requires_immediate_action": boolean,
  "estimated_investigation_time_minutes": number
}`;
  }

  /**
   * Triage an alert
   */
  async triageAlert(alert: SecurityAlert): Promise<TriageResult> {
    const task: AgentTask = {
      task_id: `triage_${alert.alert_id}`,
      agent_id: this.agent_id,
      task_type: 'alert_triage',
      title: `Triage alert: ${alert.title}`,
      description: alert.description,
      objective: `Assess threat level and determine investigation priority for: ${alert.title}`,
      context: {
        alert_id: alert.alert_id,
        alert_title: alert.title,
        alert_description: alert.description,
        current_severity: alert.severity,
        detection_rule: alert.detection_rule_id,
        entity_count: alert.entities.length,
      },
      state: 'pending',
      priority: alert.severity as any,
      retry_count: 0,
      max_retries: 2,
      subtasks: [],
    };

    try {
      await this.acceptTask(task);
      const startTime = Date.now();

      // Step 1: Gather initial context
      logger.info({ alert_id: alert.alert_id }, 'Starting triage assessment');

      // Check if this is a known threat
      const threatIntel = await this.callTool('check_threat_intelligence', {
        indicators: alert.entities.map((e) => e.id),
      });

      // Assess entity criticality
      const assetContext = await this.callTool('assess_asset_criticality', {
        entity_ids: alert.entities.map((e) => e.id),
      });

      // Analyze attack technique
      const techniqueAnalysis = await this.callTool('analyze_attack_technique', {
        rule_id: alert.detection_rule_id,
        alert_title: alert.title,
      });

      // Generate triage assessment
      const prompt = `
Perform triage assessment for this alert:

Title: ${alert.title}
Description: ${alert.description}
Current Severity: ${alert.severity}
Entities Involved: ${JSON.stringify(alert.entities)}
Detection Rule: ${alert.detection_rule_id}

Context from intelligence gathering:
Threat Intelligence: ${JSON.stringify(threatIntel)}
Asset Context: ${JSON.stringify(assetContext)}
Technique Analysis: ${JSON.stringify(techniqueAnalysis)}

Provide your assessment.`;

      const responseText = await this.think(
        {
          threatIntel,
          assetContext,
          techniqueAnalysis,
        },
        prompt
      );

      // Parse response
      let result: TriageResult;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        logger.warn({ response: responseText }, 'Failed to parse JSON response, using defaults');
        result = this.generateDefaultTriageResult(alert);
      }

      const duration = Date.now() - startTime;
      this.updateMetrics(duration, result.confidence);

      task.output_data = result;
      task.state = 'complete';
      await this.completeTask(task, true);

      logger.info(
        { alert_id: alert.alert_id, confidence: result.confidence, priority: result.priority },
        'Triage assessment complete'
      );

      return result;
    } catch (error) {
      logger.error({ error, alert_id: alert.alert_id }, 'Triage assessment failed');
      task.state = 'failed';
      task.error = {
        code: 'TRIAGE_FAILED',
        message: String(error),
      };
      await this.completeTask(task, false);

      // Return safe default
      return this.generateDefaultTriageResult(alert);
    }
  }

  /**
   * Generate default triage result when assessment fails
   */
  private generateDefaultTriageResult(alert: SecurityAlert): TriageResult {
    const severityMap: Record<SeverityLevel, { confidence: number; time: number }> = {
      [SeverityLevel.CRITICAL]: { confidence: 0.95, time: 5 },
      [SeverityLevel.HIGH]: { confidence: 0.85, time: 10 },
      [SeverityLevel.MEDIUM]: { confidence: 0.6, time: 20 },
      [SeverityLevel.LOW]: { confidence: 0.4, time: 30 },
      [SeverityLevel.INFO]: { confidence: 0.1, time: 60 },
    };

    const config = severityMap[alert.severity] || severityMap[SeverityLevel.MEDIUM];

    return {
      is_real_threat: alert.severity !== SeverityLevel.INFO,
      confidence: config.confidence,
      attack_techniques: ['T1234.001'],
      at_risk_entities: alert.entities.map((e) => e.id),
      priority: alert.severity,
      estimated_impact: `Potential impact to ${alert.entities.length} entities`,
      rationale: `Default assessment based on alert severity: ${alert.severity}`,
      requires_immediate_action: alert.severity === SeverityLevel.CRITICAL,
      estimated_investigation_time_minutes: config.time,
    };
  }

  /**
   * Execute a task
   */
  async executeTask(task: AgentTask): Promise<AgentTask> {
    // Triage tasks are handled by triageAlert()
    return task;
  }

  /**
   * Generate response using Claude
   */
  protected async generateResponse(prompt: string, context: Record<string, any>): Promise<string> {
    // In production, would call Claude API
    // For now, generate structured response
    const mockAssessment: TriageResult = {
      is_real_threat: context.threatIntel?.is_malicious || true,
      confidence: 0.85,
      attack_techniques: context.techniqueAnalysis?.techniques || ['T1078.001'],
      at_risk_entities: context.assetContext?.critical_assets || [],
      priority: SeverityLevel.HIGH,
      estimated_impact: 'High - potential lateral movement',
      rationale: 'Alert shows indicators of compromise with strong confidence',
      requires_immediate_action: true,
      estimated_investigation_time_minutes: 15,
    };

    return JSON.stringify(mockAssessment);
  }

  /**
   * Execute tool
   */
  protected async executeTool(tool_name: string, tool_input: Record<string, any>): Promise<any> {
    switch (tool_name) {
      case 'lookup_ioc':
        return this.lookupIOC(tool_input.indicators);
      case 'check_threat_intelligence':
        return this.checkThreatIntelligence(tool_input.indicators);
      case 'assess_asset_criticality':
        return this.assessAssetCriticality(tool_input.entity_ids);
      case 'analyze_attack_technique':
        return this.analyzeAttackTechnique(tool_input.rule_id, tool_input.alert_title);
      case 'score_risk':
        return this.scoreRisk(tool_input.factors);
      case 'check_historical_patterns':
        return this.checkHistoricalPatterns(tool_input.alert_characteristics);
      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }
  }

  private async lookupIOC(indicators: string[]): Promise<any> {
    // Would query threat intelligence feeds
    return {
      indicators_found: indicators.slice(0, 1),
      threat_level: 'high',
    };
  }

  private async checkThreatIntelligence(indicators: string[]): Promise<any> {
    return {
      is_malicious: true,
      known_campaigns: ['APT28'],
      confidence: 0.85,
    };
  }

  private async assessAssetCriticality(entityIds: string[]): Promise<any> {
    return {
      critical_assets: entityIds.filter((_, i) => i === 0), // First is critical
      high_value_assets: entityIds.slice(1),
    };
  }

  private async analyzeAttackTechnique(ruleId: string, title: string): Promise<any> {
    return {
      techniques: ['T1078.001', 'T1570'],
      framework: 'MITRE ATT&CK',
      severity: 'high',
    };
  }

  private async scoreRisk(factors: Record<string, any>): Promise<number> {
    // Weighted risk scoring
    return 0.75;
  }

  private async checkHistoricalPatterns(characteristics: Record<string, any>): Promise<any> {
    return {
      seen_before: true,
      similar_incidents: 3,
      avg_resolution_time: 45,
    };
  }
}

export default TriageAgent;
