import { RemediationAction, ApprovalRequest } from '@sentinelos/schema';
import { DatabaseClient } from '../client';

/**
 * Remediation Repository
 * Handles database operations for remediation actions and approval requests
 */
export class RemediationRepository {
  constructor(private db: DatabaseClient) {}

  /**
   * Find remediation action by ID
   */
  async findActionById(actionId: string): Promise<RemediationAction | null> {
    const query = `
      SELECT * FROM remediation_actions
      WHERE action_id = $1
    `;

    const result = await this.db.getOne<RemediationAction>(query, [actionId]);
    return result || null;
  }

  /**
   * Find all remediation actions with optional filtering
   */
  async findAllActions(
    actionType?: string,
    status?: string
  ): Promise<RemediationAction[]> {
    let query = 'SELECT * FROM remediation_actions';
    const params: any[] = [];
    const whereClauses: string[] = [];

    if (actionType) {
      whereClauses.push(`action_type = $${params.length + 1}`);
      params.push(actionType);
    }

    if (status) {
      whereClauses.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const data = await this.db.getMany<RemediationAction>(query, params);
    return data;
  }

  /**
   * Create remediation action
   */
  async createAction(
    action: Omit<RemediationAction, 'action_id' | 'created_at' | 'updated_at'>
  ): Promise<RemediationAction> {
    const actionId = `action_${Date.now()}`;
    const now = Date.now();

    const query = `
      INSERT INTO remediation_actions (
        action_id, investigation_id, action_type, description,
        status, target_entity, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      actionId,
      action.investigation_id,
      action.action_type,
      action.description,
      action.status || 'pending',
      action.target_entity,
      now,
      now,
    ];

    const result = await this.db.getOne<RemediationAction>(query, values);
    if (!result) {
      throw new Error('Failed to create remediation action');
    }

    return result;
  }

  /**
   * Update remediation action status
   */
  async updateActionStatus(actionId: string, status: string): Promise<RemediationAction> {
    const query = `
      UPDATE remediation_actions
      SET status = $1, updated_at = $2
      WHERE action_id = $3
      RETURNING *
    `;

    const result = await this.db.getOne<RemediationAction>(query, [
      status,
      Date.now(),
      actionId,
    ]);

    if (!result) {
      throw new Error('Remediation action not found');
    }

    return result;
  }

  /**
   * Find approval request by ID
   */
  async findApprovalById(requestId: string): Promise<ApprovalRequest | null> {
    const query = `
      SELECT * FROM approval_requests
      WHERE request_id = $1
    `;

    const result = await this.db.getOne<ApprovalRequest>(query, [requestId]);
    return result || null;
  }

  /**
   * Find all approval requests with optional filtering
   */
  async findAllApprovals(status?: string): Promise<ApprovalRequest[]> {
    let query = 'SELECT * FROM approval_requests';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const data = await this.db.getMany<ApprovalRequest>(query, params);
    return data;
  }

  /**
   * Create approval request
   */
  async createApproval(
    approval: Omit<ApprovalRequest, 'request_id' | 'created_at'>
  ): Promise<ApprovalRequest> {
    const requestId = `req_${Date.now()}`;
    const now = Date.now();

    const query = `
      INSERT INTO approval_requests (
        request_id, action_id, investigation_id, requester,
        status, approval_notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      requestId,
      approval.action_id,
      approval.investigation_id,
      approval.requester,
      approval.status || 'pending',
      approval.approval_notes || null,
      now,
    ];

    const result = await this.db.getOne<ApprovalRequest>(query, values);
    if (!result) {
      throw new Error('Failed to create approval request');
    }

    return result;
  }

  /**
   * Approve remediation action
   */
  async approveAction(
    requestId: string,
    approver: string,
    notes?: string
  ): Promise<ApprovalRequest> {
    const query = `
      UPDATE approval_requests
      SET status = $1, approver = $2, approval_notes = $3, approved_at = $4
      WHERE request_id = $5
      RETURNING *
    `;

    const result = await this.db.getOne<ApprovalRequest>(query, [
      'approved',
      approver,
      notes || null,
      Date.now(),
      requestId,
    ]);

    if (!result) {
      throw new Error('Approval request not found');
    }

    return result;
  }

  /**
   * Reject remediation action
   */
  async rejectAction(
    requestId: string,
    rejector: string,
    reason?: string
  ): Promise<ApprovalRequest> {
    const query = `
      UPDATE approval_requests
      SET status = $1, approver = $2, approval_notes = $3, approved_at = $4
      WHERE request_id = $5
      RETURNING *
    `;

    const result = await this.db.getOne<ApprovalRequest>(query, [
      'rejected',
      rejector,
      reason || null,
      Date.now(),
      requestId,
    ]);

    if (!result) {
      throw new Error('Approval request not found');
    }

    return result;
  }
}
