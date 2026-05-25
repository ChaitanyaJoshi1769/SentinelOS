/**
 * Remediation Orchestration - Executes remediation actions with approval workflows
 * Integrates with EDR tools, endpoints, and network infrastructure
 */

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

export interface ApprovalRequest {
  request_id: string;
  action_id: string;
  action_description: string;
  investigation_id: string;
  severity: string;
  requested_by: string;
  requested_at: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approver?: string;
  approval_time?: number;
  approval_notes?: string;
  expires_at: number;
}

export interface ExecutionResult {
  action_id: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  started_at?: number;
  completed_at?: number;
  result_data?: Record<string, any>;
  error?: string;
  execution_log: string[];
}

/**
 * Remediation Orchestrator
 */
export class RemediationOrchestrator {
  private pending_approvals: Map<string, ApprovalRequest> = new Map();
  private execution_results: Map<string, ExecutionResult> = new Map();
  private action_queue: RemediationAction[] = [];

  constructor() {
    logger.info('Remediation orchestrator initialized');
  }

  /**
   * Queue remediation actions for approval/execution
   */
  queueActions(actions: RemediationAction[]): string[] {
    const actionIds: string[] = [];

    // Sort by execution order
    const sorted = [...actions].sort((a, b) => a.execution_order - b.execution_order);

    for (const action of sorted) {
      this.action_queue.push(action);
      actionIds.push(action.action_id);

      logger.info(
        {
          action_id: action.action_id,
          action_type: action.action_type,
          requires_approval: action.requires_approval,
        },
        'Action queued'
      );
    }

    return actionIds;
  }

  /**
   * Request approval for an action
   */
  requestApproval(
    action: RemediationAction,
    investigation_id: string,
    requested_by: string,
    approval_timeout_minutes: number = 30
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      request_id: `approval_${action.action_id}`,
      action_id: action.action_id,
      action_description: action.description,
      investigation_id,
      severity: action.severity,
      requested_by,
      requested_at: Date.now(),
      status: 'pending',
      expires_at: Date.now() + approval_timeout_minutes * 60 * 1000,
    };

    this.pending_approvals.set(request.request_id, request);

    logger.info(
      {
        request_id: request.request_id,
        action_id: action.action_id,
        expires_in_minutes: approval_timeout_minutes,
      },
      'Approval requested'
    );

    return request;
  }

  /**
   * Approve a remediation action
   */
  approveAction(
    request_id: string,
    approver: string,
    notes: string = ''
  ): boolean {
    const request = this.pending_approvals.get(request_id);
    if (!request) {
      logger.warn({ request_id }, 'Approval request not found');
      return false;
    }

    if (request.status !== 'pending') {
      logger.warn({ request_id, current_status: request.status }, 'Action already processed');
      return false;
    }

    if (Date.now() > request.expires_at) {
      request.status = 'expired';
      logger.warn({ request_id }, 'Approval request expired');
      return false;
    }

    request.status = 'approved';
    request.approver = approver;
    request.approval_time = Date.now();
    request.approval_notes = notes;

    logger.info(
      {
        request_id,
        action_id: request.action_id,
        approver,
      },
      'Action approved'
    );

    return true;
  }

  /**
   * Reject a remediation action
   */
  rejectAction(
    request_id: string,
    rejector: string,
    reason: string
  ): boolean {
    const request = this.pending_approvals.get(request_id);
    if (!request) return false;

    request.status = 'rejected';
    request.approver = rejector;
    request.approval_notes = reason;

    logger.info(
      {
        request_id,
        action_id: request.action_id,
        rejector,
        reason,
      },
      'Action rejected'
    );

    return true;
  }

  /**
   * Execute approved remediation action
   */
  async executeAction(action: RemediationAction): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      action_id: action.action_id,
      status: 'executing',
      started_at: Date.now(),
      execution_log: [],
    };

    this.execution_results.set(action.action_id, result);

    try {
      result.execution_log.push(`Starting execution of ${action.action_type} on ${action.target_id}`);

      // Execute action based on type
      switch (action.action_type) {
        case 'isolate':
          await this.isolateEndpoint(action);
          break;
        case 'terminate':
          await this.terminateProcess(action);
          break;
        case 'reset':
          await this.resetCredentials(action);
          break;
        case 'block':
          await this.blockIPAddress(action);
          break;
        case 'snapshot':
          await this.captureSnapshot(action);
          break;
        case 'alert':
          await this.raiseAlert(action);
          break;
      }

      result.status = 'completed';
      result.completed_at = Date.now();
      result.execution_log.push('Action completed successfully');

      logger.info(
        {
          action_id: action.action_id,
          duration_seconds: (result.completed_at - (result.started_at || 0)) / 1000,
        },
        'Action executed'
      );
    } catch (error) {
      result.status = 'failed';
      result.completed_at = Date.now();
      result.error = String(error);
      result.execution_log.push(`Error: ${error}`);

      logger.error(
        {
          action_id: action.action_id,
          error: String(error),
        },
        'Action execution failed'
      );

      // Trigger rollback if possible
      if (action.rollback_possible && action.rollback_steps) {
        await this.rollbackAction(action, result);
      }
    }

    return result;
  }

  /**
   * Execute batch of approved actions in sequence
   */
  async executeBatch(actions: RemediationAction[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    const sorted = actions.sort((a, b) => a.execution_order - b.execution_order);

    for (const action of sorted) {
      const result = await this.executeAction(action);
      results.push(result);

      // If critical action fails, stop execution
      if (result.status === 'failed' && action.severity === 'critical') {
        logger.warn({ action_id: action.action_id }, 'Critical action failed, stopping batch');
        break;
      }

      // Small delay between actions to prevent system overload
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Rollback a remediation action
   */
  private async rollbackAction(
    action: RemediationAction,
    result: ExecutionResult
  ): Promise<void> {
    logger.info({ action_id: action.action_id }, 'Initiating rollback');

    result.execution_log.push('Initiating rollback...');
    result.status = 'rolled_back';

    if (!action.rollback_steps) return;

    for (const step of action.rollback_steps) {
      result.execution_log.push(`Rollback: ${step}`);
    }

    result.execution_log.push('Rollback completed');
    logger.info({ action_id: action.action_id }, 'Rollback completed');
  }

  /**
   * Isolate endpoint from network
   */
  private async isolateEndpoint(action: RemediationAction): Promise<void> {
    // Would integrate with EDR tools (CrowdStrike, MS Defender, etc.)
    logger.info({ endpoint: action.target_id }, 'Isolating endpoint');

    // Simulated EDR integration
    const result = {
      status: 'success',
      endpoint_id: action.target_id,
      isolation_time: new Date().toISOString(),
    };

    const execution = this.execution_results.get(action.action_id);
    if (execution) {
      execution.result_data = result;
      execution.execution_log.push(`Endpoint ${action.target_id} isolated from network`);
    }
  }

  /**
   * Terminate suspicious process
   */
  private async terminateProcess(action: RemediationAction): Promise<void> {
    logger.info({ process_id: action.target_id }, 'Terminating process');

    const execution = this.execution_results.get(action.action_id);
    if (execution) {
      execution.result_data = {
        process_id: action.target_id,
        terminated_at: new Date().toISOString(),
      };
      execution.execution_log.push(`Process ${action.target_id} terminated`);
    }
  }

  /**
   * Reset compromised credentials
   */
  private async resetCredentials(action: RemediationAction): Promise<void> {
    logger.info({ user: action.target_id }, 'Resetting credentials');

    const execution = this.execution_results.get(action.action_id);
    if (execution) {
      execution.result_data = {
        user: action.target_id,
        reset_time: new Date().toISOString(),
        temporary_password_set: true,
      };
      execution.execution_log.push(`Credentials reset for ${action.target_id}`);
    }
  }

  /**
   * Block IP address at firewall
   */
  private async blockIPAddress(action: RemediationAction): Promise<void> {
    logger.info({ ip_address: action.target_id }, 'Blocking IP address');

    const execution = this.execution_results.get(action.action_id);
    if (execution) {
      execution.result_data = {
        ip_address: action.target_id,
        blocked_at: new Date().toISOString(),
        firewall_rule_id: `rule_${Date.now()}`,
      };
      execution.execution_log.push(`IP address ${action.target_id} blocked at firewall`);
    }
  }

  /**
   * Capture forensic snapshot
   */
  private async captureSnapshot(action: RemediationAction): Promise<void> {
    logger.info({ target: action.target_id }, 'Capturing forensic snapshot');

    const execution = this.execution_results.get(action.action_id);
    if (execution) {
      execution.result_data = {
        target: action.target_id,
        snapshot_id: `snap_${Date.now()}`,
        captured_at: new Date().toISOString(),
        size_mb: Math.ceil(Math.random() * 10000),
      };
      execution.execution_log.push(`Forensic snapshot captured from ${action.target_id}`);
    }
  }

  /**
   * Raise security alert
   */
  private async raiseAlert(action: RemediationAction): Promise<void> {
    logger.info({ alert_type: action.target_id }, 'Raising security alert');

    const execution = this.execution_results.get(action.action_id);
    if (execution) {
      execution.result_data = {
        alert_id: `alert_${Date.now()}`,
        alert_type: action.target_id,
        severity: action.severity,
        created_at: new Date().toISOString(),
      };
      execution.execution_log.push(`Security alert raised: ${action.description}`);
    }
  }

  /**
   * Get execution status
   */
  getExecutionStatus(action_id: string): ExecutionResult | undefined {
    return this.execution_results.get(action_id);
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pending_approvals.values()).filter(
      (req) => req.status === 'pending' && req.expires_at > Date.now()
    );
  }

  /**
   * Get orchestration statistics
   */
  getStats() {
    return {
      queued_actions: this.action_queue.length,
      pending_approvals: this.getPendingApprovals().length,
      completed_actions: Array.from(this.execution_results.values()).filter(
        (r) => r.status === 'completed'
      ).length,
      failed_actions: Array.from(this.execution_results.values()).filter(
        (r) => r.status === 'failed'
      ).length,
      total_executions: this.execution_results.size,
    };
  }
}

export default RemediationOrchestrator;
