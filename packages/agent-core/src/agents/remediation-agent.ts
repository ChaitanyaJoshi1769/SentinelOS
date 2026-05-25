/**
 * Remediation Agent - Autonomous incident response and containment planning
 * Generates and executes remediation actions with approval workflows
 */

import { AgentTask, AgentType } from '@sentinelos/shared';
import BaseAgent from './base-agent';
import pino from 'pino';

const logger = pino();

export interface RemediationAction {
  action_id: string;
  action_type: 'isolate' | 'terminate' | 'reset' | 'block' | 'snapshot' | 'alert';
  target_type: 'endpoint' | 'user' | 'network' | 'process' | 'connection';
  target_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  estimated_impact: string;
  estimated_duration_seconds: number;
  rollback_possible: boolean;
  rollback_steps?: string[];
  requires_approval: boolean;
  approval_justification: string;
  execution_order: number;
}

export interface RemediationPlan {
  plan_id: string;
  investigation_id: string;
  created_at: number;
  severity_level: string;
  urgency: 'immediate' | 'urgent' | 'high' | 'medium' | 'low';
  estimated_total_duration_seconds: number;
  actions: RemediationAction[];
  containment_strategy: string;
  detection_status: 'not_detected' | 'detected_active' | 'detected_contained' | 'eradicated';
  escalation_criteria: string[];
  approval_status: 'pending' | 'approved' | 'rejected' | 'partially_approved';
  notes: string;
}

/**
 * Remediation Agent
 */
export class RemediationAgent extends BaseAgent {
  constructor(agent_id?: string) {
    super(AgentType.REMEDIATION_AGENT, agent_id);
  }

  protected getCapabilities(): string[] {
    return [
      'remediation_planning',
      'action_generation',
      'risk_assessment',
      'impact_calculation',
      'containment_strategy',
      'rollback_planning',
    ];
  }

  protected getAvailableTools(): string[] {
    return [
      'get_remediation_templates',
      'assess_action_impact',
      'calculate_risk_score',
      'generate_rollback_steps',
      'check_dependencies',
      'plan_execution_order',
    ];
  }

  protected getSystemPrompt(): string {
    return `You are a Remediation Agent responsible for autonomous incident response planning.
Your task is to:
1. Generate appropriate remediation actions
2. Assess impact of each action
3. Plan execution order to minimize business disruption
4. Identify rollback procedures
5. Recommend approval requirements
6. Create comprehensive remediation plan

Balance security containment with business continuity.
Be thorough but pragmatic. Consider dependencies and timing.
Format your response as JSON with complete remediation plan.`;
  }

  /**
   * Plan remediation for investigation
   */
  async planRemediation(
    investigationId: string,
    affectedSystems: string[],
    affectedUsers: string[],
    attackChain: string[],
    severity: string,
    blastRadius: number
  ): Promise<RemediationPlan> {
    const task: AgentTask = {
      task_id: `rem_${investigationId}`,
      agent_id: this.agent_id,
      task_type: 'remediation_planning',
      title: `Plan remediation for investigation: ${investigationId}`,
      description: `Generate remediation actions and containment strategy`,
      objective: `Create executable remediation plan with minimal business impact`,
      context: {
        investigation_id: investigationId,
        affected_systems_count: affectedSystems.length,
        affected_users_count: affectedUsers.length,
        attack_stages: attackChain.length,
        blast_radius: blastRadius,
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

      logger.info({ investigation_id: investigationId }, 'Starting remediation planning');

      // Step 1: Get remediation templates
      const templates = await this.callTool('get_remediation_templates', {
        attack_types: attackChain,
        severity,
      });

      // Step 2: Assess impact
      const impacts = await this.callTool('assess_action_impact', {
        affected_systems: affectedSystems,
        affected_users: affectedUsers,
      });

      // Step 3: Calculate risk
      const risks = await this.callTool('calculate_risk_score', {
        blast_radius: blastRadius,
        severity,
      });

      // Step 4: Generate rollback steps
      const rollbacks = await this.callTool('generate_rollback_steps', {
        actions: templates,
      });

      // Step 5: Check dependencies
      const dependencies = await this.callTool('check_dependencies', {
        systems: affectedSystems,
      });

      // Step 6: Plan execution order
      const executionPlan = await this.callTool('plan_execution_order', {
        actions: templates,
        dependencies,
      });

      // Generate remediation plan
      const prompt = `
Plan remediation for security incident:

Investigation ID: ${investigationId}
Affected Systems: ${JSON.stringify(affectedSystems)}
Affected Users: ${JSON.stringify(affectedUsers)}
Attack Chain: ${JSON.stringify(attackChain)}
Severity: ${severity}
Blast Radius: ${blastRadius}

Available Templates: ${JSON.stringify(templates)}
Impact Assessment: ${JSON.stringify(impacts)}
Risk Scores: ${JSON.stringify(risks)}
Rollback Steps: ${JSON.stringify(rollbacks)}
Dependencies: ${JSON.stringify(dependencies)}
Execution Plan: ${JSON.stringify(executionPlan)}

Generate comprehensive remediation plan with:
- Prioritized remediation actions
- Execution sequence
- Approval requirements
- Impact assessment
- Rollback capabilities
- Containment strategy
- Success criteria

Format as JSON with the remediation plan structure.`;

      const responseText = await this.think(
        {
          templates,
          impacts,
          risks,
          rollbacks,
          dependencies,
          executionPlan,
        },
        prompt
      );

      let plan: RemediationPlan;
      try {
        plan = JSON.parse(responseText);
      } catch (e) {
        logger.warn({ response: responseText }, 'Failed to parse remediation plan');
        plan = this.generateDefaultRemediationPlan(
          investigationId,
          affectedSystems,
          affectedUsers,
          severity
        );
      }

      const duration = Date.now() - startTime;
      this.updateMetrics(duration);

      task.output_data = plan;
      task.state = 'complete';
      await this.completeTask(task, true);

      logger.info(
        {
          investigation_id: investigationId,
          actions_generated: plan.actions.length,
          urgency: plan.urgency,
        },
        'Remediation planning complete'
      );

      return plan;
    } catch (error) {
      logger.error({ error, investigation_id: investigationId }, 'Remediation planning failed');
      task.state = 'failed';
      await this.completeTask(task, false);
      return this.generateDefaultRemediationPlan(
        investigationId,
        affectedSystems,
        affectedUsers,
        severity
      );
    }
  }

  /**
   * Generate default remediation plan
   */
  private generateDefaultRemediationPlan(
    investigationId: string,
    affectedSystems: string[],
    affectedUsers: string[],
    severity: string
  ): RemediationPlan {
    const actions: RemediationAction[] = [];
    let executionOrder = 1;

    // Isolation actions (highest priority)
    affectedSystems.forEach((system) => {
      actions.push({
        action_id: `isolate_${system}`,
        action_type: 'isolate',
        target_type: 'endpoint',
        target_id: system,
        severity: 'critical',
        description: `Isolate ${system} from network to prevent lateral movement`,
        estimated_impact: 'System will be unavailable until containment is lifted',
        estimated_duration_seconds: 30,
        rollback_possible: true,
        rollback_steps: ['Restore network connectivity', 'Verify system health'],
        requires_approval: true,
        approval_justification: 'Critical containment action affecting production system',
        execution_order: executionOrder++,
      });
    });

    // Credential reset actions
    affectedUsers.forEach((user) => {
      actions.push({
        action_id: `reset_${user}`,
        action_type: 'reset',
        target_type: 'user',
        target_id: user,
        severity: 'high',
        description: `Reset credentials for ${user}`,
        estimated_impact: 'User will need to log in with new password',
        estimated_duration_seconds: 10,
        rollback_possible: true,
        rollback_steps: ['Restore previous password hash'],
        requires_approval: true,
        approval_justification: 'Credential compromise suspected',
        execution_order: executionOrder++,
      });
    });

    // Blocking actions
    actions.push({
      action_id: `block_c2_traffic`,
      action_type: 'block',
      target_type: 'network',
      target_id: 'firewall',
      severity: 'high',
      description: 'Block known command and control infrastructure',
      estimated_impact: 'Prevents attacker command execution',
      estimated_duration_seconds: 5,
      rollback_possible: true,
      rollback_steps: ['Remove firewall rules'],
      requires_approval: false,
      approval_justification: 'Standard containment procedure',
      execution_order: executionOrder++,
    });

    // Forensic snapshot
    actions.push({
      action_id: `snapshot_forensics`,
      action_type: 'snapshot',
      target_type: 'endpoint',
      target_id: affectedSystems[0] || 'primary',
      severity: 'high',
      description: 'Capture forensic evidence from affected systems',
      estimated_impact: 'Minimal - read-only operation',
      estimated_duration_seconds: 300,
      rollback_possible: false,
      requires_approval: false,
      approval_justification: 'Preserves evidence for investigation',
      execution_order: executionOrder++,
    });

    const severityMap: Record<string, { urgency: string; timeEstimate: number }> = {
      critical: { urgency: 'immediate', timeEstimate: 300 },
      high: { urgency: 'urgent', timeEstimate: 600 },
      medium: { urgency: 'high', timeEstimate: 1800 },
      low: { urgency: 'medium', timeEstimate: 3600 },
    };

    const config = severityMap[severity] || severityMap.medium;

    return {
      plan_id: `plan_${investigationId}`,
      investigation_id: investigationId,
      created_at: Date.now(),
      severity_level: severity,
      urgency: config.urgency as any,
      estimated_total_duration_seconds: config.timeEstimate,
      actions: actions.sort((a, b) => a.execution_order - b.execution_order),
      containment_strategy: `Isolate affected systems, reset compromised credentials, block C2 infrastructure, and preserve forensic evidence.`,
      detection_status: 'detected_active',
      escalation_criteria: [
        'If lateral movement continues after isolation',
        'If additional systems compromise detected',
        'If threat actor C2 communication resumes',
      ],
      approval_status: 'pending',
      notes: `Automated remediation plan generated for ${severity} severity incident. ${affectedSystems.length} systems affected, ${affectedUsers.length} users compromised. Requires approval before execution.`,
    };
  }

  /**
   * Execute a task
   */
  async executeTask(task: AgentTask): Promise<AgentTask> {
    return task;
  }

  /**
   * Generate response
   */
  protected async generateResponse(prompt: string, context: Record<string, any>): Promise<string> {
    const mockPlan: RemediationPlan = {
      plan_id: `plan_${Date.now()}`,
      investigation_id: context.investigationId || 'unknown',
      created_at: Date.now(),
      severity_level: context.severity || 'high',
      urgency: 'urgent',
      estimated_total_duration_seconds: 600,
      actions: context.templates || [],
      containment_strategy:
        'Implement network segmentation and isolate compromised systems while preserving evidence',
      detection_status: 'detected_active',
      escalation_criteria: ['Lateral movement detection', 'Additional compromise'],
      approval_status: 'pending',
      notes: 'Automated remediation plan ready for review',
    };

    return JSON.stringify(mockPlan);
  }

  /**
   * Execute tool
   */
  protected async executeTool(tool_name: string, tool_input: Record<string, any>): Promise<any> {
    switch (tool_name) {
      case 'get_remediation_templates':
        return this.getRemediationTemplates(tool_input);
      case 'assess_action_impact':
        return this.assessActionImpact(tool_input);
      case 'calculate_risk_score':
        return this.calculateRiskScore(tool_input);
      case 'generate_rollback_steps':
        return this.generateRollbackSteps(tool_input.actions);
      case 'check_dependencies':
        return this.checkDependencies(tool_input.systems);
      case 'plan_execution_order':
        return this.planExecutionOrder(tool_input);
      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }
  }

  private async getRemediationTemplates(params: Record<string, any>): Promise<any> {
    return [
      {
        template_id: 'isolate_endpoint',
        action_type: 'isolate',
        description: 'Isolate endpoint from network',
      },
      {
        template_id: 'reset_password',
        action_type: 'reset',
        description: 'Reset user credentials',
      },
      {
        template_id: 'block_ip',
        action_type: 'block',
        description: 'Block IP address at firewall',
      },
    ];
  }

  private async assessActionImpact(params: Record<string, any>): Promise<any> {
    return {
      impact_level: 'medium',
      affected_users: params.affected_users?.length || 0,
      business_continuity_risk: 'acceptable with mitigation',
      recovery_time_estimate: 300,
    };
  }

  private async calculateRiskScore(params: Record<string, any>): Promise<any> {
    return {
      current_risk_score: 0.85,
      risk_after_remediation: 0.15,
      risk_reduction_percentage: 82,
    };
  }

  private async generateRollbackSteps(actions: any[]): Promise<any> {
    return {
      rollback_plans: actions.map((a) => ({
        action_id: a.action_id,
        rollback_steps: ['Reverse changes', 'Verify restoration'],
      })),
    };
  }

  private async checkDependencies(systems: string[]): Promise<any> {
    return {
      critical_dependencies: [],
      safe_to_isolate: systems.length,
    };
  }

  private async planExecutionOrder(params: Record<string, any>): Promise<any> {
    return {
      phases: [
        { phase: 1, action: 'Isolation', duration: 60 },
        { phase: 2, action: 'Credential Reset', duration: 120 },
        { phase: 3, action: 'Blocking', duration: 60 },
      ],
    };
  }
}

export default RemediationAgent;
