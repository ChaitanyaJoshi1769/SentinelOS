/**
 * Agent Coordinator - Multi-agent orchestration for autonomous investigations
 * Manages agent collaboration, task delegation, and result synthesis
 */

import {
  AgentCollaboration,
  SecurityAlert,
  Investigation,
  AgentConversation,
} from '@sentinelos/shared';
import BaseAgent from '../agents/base-agent';
import { TriageAgent } from '../agents/triage-agent';
import { InvestigationAgent } from '../agents/investigation-agent';
import { GraphAnalyzerAgent } from '../agents/graph-analyzer-agent';
import { ThreatIntelligenceAgent } from '../agents/threat-intelligence-agent';
import { RemediationAgent } from '../agents/remediation-agent';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino();

/**
 * Coordinator for multi-agent collaboration
 */
export class AgentCoordinator {
  private coordination_id: string;
  private agents: Map<string, BaseAgent> = new Map();
  private conversations: Map<string, AgentConversation> = new Map();
  private active_investigations: Map<string, AgentCollaboration> = new Map();

  constructor() {
    this.coordination_id = `coord_${uuidv4()}`;
    this.initializeAgents();
  }

  /**
   * Initialize default agents
   */
  private initializeAgents(): void {
    const triageAgent = new TriageAgent(`agent_triage_${uuidv4()}`);
    const investigationAgent = new InvestigationAgent(`agent_investigation_${uuidv4()}`);
    const graphAnalyzerAgent = new GraphAnalyzerAgent(`agent_graph_${uuidv4()}`);
    const threatIntelligenceAgent = new ThreatIntelligenceAgent(`agent_ti_${uuidv4()}`);
    const remediationAgent = new RemediationAgent(`agent_remediation_${uuidv4()}`);

    this.agents.set(triageAgent.getStatus().agent_id, triageAgent);
    this.agents.set(investigationAgent.getStatus().agent_id, investigationAgent);
    this.agents.set(graphAnalyzerAgent.getStatus().agent_id, graphAnalyzerAgent);
    this.agents.set(threatIntelligenceAgent.getStatus().agent_id, threatIntelligenceAgent);
    this.agents.set(remediationAgent.getStatus().agent_id, remediationAgent);

    logger.info({ agent_count: this.agents.size }, 'Agents initialized');
  }

  /**
   * Orchestrate autonomous investigation
   */
  async investigateAlert(alert: SecurityAlert): Promise<Investigation> {
    const collaboration = this.createCollaboration(alert.alert_id);

    try {
      logger.info({ alert_id: alert.alert_id, collaboration_id: collaboration.collaboration_id },
        'Starting coordinated investigation');

      // Phase 1: Triage
      logger.debug('Phase 1: Triage');
      const triageAgent = this.getAgent('triage') as TriageAgent;
      const triageResult = await triageAgent.triageAlert(alert);

      if (!triageResult.is_real_threat) {
        logger.info({ alert_id: alert.alert_id }, 'Alert triaged as false positive');
        return this.createFalsePositiveInvestigation(alert, triageResult);
      }

      // Phase 2: Evidence Gathering
      logger.debug('Phase 2: Investigation');
      const investigationAgent = this.getAgent('investigation') as InvestigationAgent;
      const findings = await investigationAgent.investigateAlert(alert.alert_id, [
        {
          timestamp: alert.timestamp,
          event_type: 'alert',
          entity_id: alert.entities[0]?.id || 'unknown',
          description: alert.title,
          severity: 'critical',
          source_system: 'detection_engine',
          raw_data: alert.metadata,
        },
      ]);

      // Phase 3: Graph Analysis
      logger.debug('Phase 3: Graph Analysis');
      const graphAgent = this.getAgent('graph_analyzer') as GraphAnalyzerAgent;
      const attackAnalysis = await graphAgent.analyzeAttackPaths(
        alert.entities[0]?.id || 'unknown',
        alert.entities.map((e) => e.id)
      );

      // Phase 4: Threat Intelligence Correlation
      logger.debug('Phase 4: Threat Intelligence');
      const tiAgent = this.getAgent('threat_intelligence') as ThreatIntelligenceAgent;
      const threatIntelligence = await tiAgent.correlateWithIntelligence(
        findings.attack_chain || [],
        findings.indicators_found || [],
        Date.now() - alert.timestamp
      );

      // Phase 5: Remediation Planning
      logger.debug('Phase 5: Remediation Planning');
      const remediationAgent = this.getAgent('remediation') as RemediationAgent;
      const remediationPlan = await remediationAgent.planRemediation(
        `inv_${uuidv4()}`,
        findings.affected_systems || [],
        findings.affected_identities || [],
        findings.attack_chain || [],
        alert.severity,
        attackAnalysis.blast_radius?.node_count || 0
      );

      // Synthesize results into investigation
      const investigation = this.synthesizeInvestigation(alert, {
        triageResult,
        findings,
        attackAnalysis,
        threatIntelligence,
        remediationPlan,
      });

      this.active_investigations.set(investigation.investigation_id, collaboration);

      logger.info(
        {
          investigation_id: investigation.investigation_id,
          alert_id: alert.alert_id,
          status: investigation.status,
        },
        'Investigation complete'
      );

      return investigation;
    } catch (error) {
      logger.error({ error, alert_id: alert.alert_id }, 'Investigation failed');
      throw error;
    }
  }

  /**
   * Create collaboration context
   */
  private createCollaboration(alertId: string): AgentCollaboration {
    return {
      collaboration_id: `collab_${uuidv4()}`,
      investigation_id: `inv_${uuidv4()}`,
      coordinator_agent_id: this.coordination_id,
      specialist_agents: Array.from(this.agents.values()).map((agent) => {
        const status = agent.getStatus();
        return {
          agent_id: status.agent_id,
          agent_type: status.agent_type,
          responsibility: this.getAgentResponsibility(status.agent_type),
        };
      }),
      status: 'initiated',
      created_at: Date.now(),
      plan: {
        phases: [
          {
            phase_id: 'phase_1',
            description: 'Initial Alert Triage',
            agents: ['agent_triage'],
            tasks: ['assess_severity', 'check_false_positive'],
            dependencies: [],
          },
          {
            phase_id: 'phase_2',
            description: 'Evidence Gathering',
            agents: ['agent_investigation'],
            tasks: ['query_telemetry', 'correlate_events', 'build_timeline'],
            dependencies: ['phase_1'],
          },
          {
            phase_id: 'phase_3',
            description: 'Graph Analysis',
            agents: ['agent_graph'],
            tasks: ['analyze_paths', 'calculate_blast_radius', 'identify_escalation'],
            dependencies: ['phase_2'],
          },
          {
            phase_id: 'phase_4',
            description: 'Threat Intelligence',
            agents: ['agent_threat_intelligence'],
            tasks: ['attribute_actors', 'correlate_campaigns', 'enrich_indicators'],
            dependencies: ['phase_2', 'phase_3'],
          },
          {
            phase_id: 'phase_5',
            description: 'Remediation Planning',
            agents: ['agent_remediation'],
            tasks: ['generate_actions', 'assess_impact', 'plan_execution'],
            dependencies: ['phase_3', 'phase_4'],
          },
          {
            phase_id: 'phase_6',
            description: 'Synthesis',
            agents: ['coordinator'],
            tasks: ['synthesize_findings', 'generate_narrative', 'recommendations'],
            dependencies: ['phase_5'],
          },
        ],
      },
      results: {
        key_findings: [],
        evidence_collected: [],
        attack_assessment: '',
        recommended_actions: [],
      },
      metrics: {
        total_time_ms: 0,
        phases_completed: 0,
        coordination_efficiency: 0,
      },
    };
  }

  /**
   * Get agent responsibility description
   */
  private getAgentResponsibility(agentType: string): string {
    switch (agentType) {
      case 'triage_agent':
        return 'Initial alert assessment and severity determination';
      case 'investigation_agent':
        return 'Evidence gathering and timeline reconstruction';
      case 'graph_analyzer_agent':
        return 'Attack path analysis and blast radius calculation';
      default:
        return 'Investigation support';
    }
  }

  /**
   * Synthesize investigation from agent results
   */
  private synthesizeInvestigation(
    alert: SecurityAlert,
    results: Record<string, any>
  ): Investigation {
    const narrative = this.generateNarrative(results);

    return {
      investigation_id: `inv_${uuidv4()}`,
      alert_id: alert.alert_id,
      created_at: Date.now(),
      updated_at: Date.now(),
      status: results.triageResult?.is_real_threat ? 'complete' : 'resolved',
      confidence: results.triageResult?.confidence || 0.5,
      findings: [
        {
          title: 'Initial Assessment',
          description: results.triageResult?.rationale || 'Alert evaluated',
          severity: alert.severity,
          evidence: [],
        },
        {
          title: 'Evidence Analysis',
          description: `Found ${results.findings?.key_events?.length || 0} key events`,
          severity: alert.severity,
          evidence: results.findings?.key_events?.map((e: any) => e.description) || [],
        },
        {
          title: 'Attack Path Analysis',
          description: `Identified ${results.attackAnalysis?.attack_paths?.length || 0} potential attack paths`,
          severity: alert.severity,
          evidence: [],
        },
        {
          title: 'Threat Attribution',
          description: `${results.threatIntelligence?.attributed_actors?.length || 0} actors matched to attack pattern`,
          severity: alert.severity,
          evidence: results.threatIntelligence?.attributed_actors?.map((a: any) => a.actor_name) || [],
        },
      ],
      recommendations: [
        ...( results.triageResult?.requires_immediate_action ? ['Take immediate action to contain'] : []),
        'Isolate affected endpoints',
        'Review credential access',
        'Monitor for lateral movement',
        'Collect forensic evidence',
        ...(results.attackAnalysis?.recommended_containment || []),
        ...(results.threatIntelligence?.recommended_mitigations || []),
      ],
      timeline: results.findings?.timeline || [],
      notes: narrative,
      ai_analysis: {
        summary: narrative,
        key_insights: [
          results.triageResult?.estimated_impact || 'Potential impact to network',
          `Attack requires ${results.triageResult?.estimated_investigation_time_minutes || 30} minutes to investigate`,
          `${results.attackAnalysis?.blast_radius?.node_count || 0} systems potentially affected`,
          `Attribution: ${results.threatIntelligence?.attributed_actors?.[0]?.actor_name || 'Unknown actor'}`,
        ],
        risk_assessment: `${results.triageResult?.is_real_threat ? 'High' : 'Low'} risk threat requiring ${
          results.triageResult?.requires_immediate_action ? 'immediate' : 'standard'
        } response`,
        recommendations: [
          ...(results.attackAnalysis?.recommended_containment || []),
          ...(results.threatIntelligence?.recommended_mitigations || []),
          ...(results.remediationPlan?.actions?.map((a: any) => a.description) || []),
        ],
      },
    };
  }

  /**
   * Generate narrative
   */
  private generateNarrative(results: Record<string, any>): string {
    return `
Investigation Summary:

Threat Assessment:
The alert was assessed with ${(results.triageResult?.confidence * 100).toFixed(0)}% confidence.
Estimated impact: ${results.triageResult?.estimated_impact || 'Unknown'}

Evidence Gathered:
${results.findings?.timeline?.length || 0} timeline events identified
${results.findings?.affected_systems?.length || 0} systems potentially affected
${results.findings?.indicators_found?.length || 0} indicators of compromise

Attack Analysis:
${results.attackAnalysis?.attack_paths?.length || 0} attack paths identified
Lateral movement possible: ${results.attackAnalysis?.lateral_movement_hops || 0} hops
Privilege escalation detected: ${results.attackAnalysis?.privilege_escalation_detected ? 'Yes' : 'No'}
Blast radius: ${results.attackAnalysis?.blast_radius?.node_count || 0} nodes

Threat Intelligence:
${results.threatIntelligence?.attributed_actors?.length || 0} threat actors matched
${results.threatIntelligence?.related_campaigns?.length || 0} related campaigns identified
Attribution confidence: ${(results.threatIntelligence?.attributed_actors?.[0]?.attribution_confidence * 100).toFixed(0) || 'Unknown'}%

Remediation Plan:
Severity: ${results.remediationPlan?.severity_level || 'Unknown'}
Urgency: ${results.remediationPlan?.urgency || 'Unknown'}
Actions to execute: ${results.remediationPlan?.actions?.length || 0}
Estimated total duration: ${(results.remediationPlan?.estimated_total_duration_seconds / 60).toFixed(0) || 0} minutes

Recommended Actions:
${(results.remediationPlan?.actions || []).map((a: any) => `- ${a.description}`).join('\n')}

Recommended Mitigations:
${(results.threatIntelligence?.recommended_mitigations || []).map((m: string) => `- ${m}`).join('\n')}
`;
  }

  /**
   * Create false positive investigation
   */
  private createFalsePositiveInvestigation(alert: SecurityAlert, triageResult: any): Investigation {
    return {
      investigation_id: `inv_${uuidv4()}`,
      alert_id: alert.alert_id,
      created_at: Date.now(),
      updated_at: Date.now(),
      status: 'resolved',
      confidence: triageResult.confidence,
      findings: [
        {
          title: 'False Positive Detected',
          description: 'Alert was determined to be a false positive',
          severity: 'low',
          evidence: [triageResult.rationale],
        },
      ],
      recommendations: ['Mark as false positive', 'Update detection rules if appropriate'],
      timeline: [],
      notes: `Alert ${alert.alert_id} was triaged as a false positive with ${(triageResult.confidence * 100).toFixed(0)}% confidence.`,
    };
  }

  /**
   * Get agent by type
   */
  private getAgent(agentType: string): BaseAgent | undefined {
    return Array.from(this.agents.values()).find((agent) =>
      agent.getStatus().agent_type.includes(agentType)
    );
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values()).map((agent) => agent.getInfo());
  }

  /**
   * Get investigation status
   */
  getInvestigationStatus(investigationId: string) {
    const collaboration = this.active_investigations.get(investigationId);
    if (!collaboration) {
      return null;
    }

    return {
      investigation_id: investigationId,
      collaboration_id: collaboration.collaboration_id,
      status: collaboration.status,
      agents: collaboration.specialist_agents,
      progress: `${collaboration.metrics.phases_completed} of ${collaboration.plan?.phases?.length || 0} phases complete`,
    };
  }
}

export default AgentCoordinator;
