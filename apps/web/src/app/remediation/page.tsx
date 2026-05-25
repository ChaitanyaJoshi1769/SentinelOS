'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

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
  requires_approval: boolean;
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
  expires_at: number;
}

export interface ExecutionResult {
  action_id: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  started_at?: number;
  completed_at?: number;
  result_data?: Record<string, any>;
  error?: string;
}

/**
 * Remediation Orchestration Page
 * Manage approval workflows and execution of remediation actions
 */
export default function RemediationPage() {
  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [selectedAction, setSelectedAction] = useState<RemediationAction | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRemediationData();
  }, []);

  const loadRemediationData = async () => {
    try {
      // Mock data for remediation actions
      const mockActions: RemediationAction[] = [
        {
          action_id: 'action_1',
          action_type: 'isolate',
          target_type: 'endpoint',
          target_id: 'endpoint_1',
          severity: 'critical',
          description: 'Isolate compromised workstation from network',
          estimated_impact: 'User loses network access. Requires VPN reconnection after remediation.',
          estimated_duration_seconds: 60,
          rollback_possible: true,
          requires_approval: true,
          execution_order: 1,
        },
        {
          action_id: 'action_2',
          action_type: 'terminate',
          target_type: 'process',
          target_id: 'powershell.exe',
          severity: 'high',
          description: 'Terminate suspicious PowerShell process',
          estimated_impact: 'Kills running PowerShell script. May interrupt user tasks.',
          estimated_duration_seconds: 5,
          rollback_possible: false,
          requires_approval: true,
          execution_order: 2,
        },
        {
          action_id: 'action_3',
          action_type: 'block',
          target_type: 'network',
          target_id: '192.168.1.100',
          severity: 'critical',
          description: 'Block C2 server IP at firewall',
          estimated_impact: 'Prevents outbound connections to attacker infrastructure.',
          estimated_duration_seconds: 30,
          rollback_possible: true,
          requires_approval: true,
          execution_order: 3,
        },
        {
          action_id: 'action_4',
          action_type: 'reset',
          target_type: 'user',
          target_id: 'john.smith@company.com',
          severity: 'high',
          description: 'Reset credentials for compromised user account',
          estimated_impact: 'User must re-authenticate. Temporary password will be generated.',
          estimated_duration_seconds: 45,
          rollback_possible: false,
          requires_approval: true,
          execution_order: 4,
        },
        {
          action_id: 'action_5',
          action_type: 'snapshot',
          target_type: 'endpoint',
          target_id: 'endpoint_1',
          severity: 'high',
          description: 'Capture forensic snapshot of compromised endpoint',
          estimated_impact: 'Generates disk snapshot. May impact system performance during capture.',
          estimated_duration_seconds: 300,
          rollback_possible: true,
          requires_approval: false,
          execution_order: 5,
        },
      ];

      const mockApprovals: ApprovalRequest[] = [
        {
          request_id: 'approval_1',
          action_id: 'action_1',
          action_description: 'Isolate compromised workstation from network',
          investigation_id: 'inv_1',
          severity: 'critical',
          requested_by: 'system',
          requested_at: Date.now() - 600000,
          status: 'pending',
          expires_at: Date.now() + 1800000,
        },
        {
          request_id: 'approval_2',
          action_id: 'action_2',
          action_description: 'Terminate suspicious PowerShell process',
          investigation_id: 'inv_1',
          severity: 'high',
          requested_by: 'system',
          requested_at: Date.now() - 300000,
          status: 'pending',
          expires_at: Date.now() + 1800000,
        },
      ];

      const mockExecutions: ExecutionResult[] = [
        {
          action_id: 'action_3',
          status: 'completed',
          started_at: Date.now() - 120000,
          completed_at: Date.now() - 90000,
          result_data: {
            ip_address: '192.168.1.100',
            blocked_at: new Date(Date.now() - 90000).toISOString(),
            firewall_rule_id: 'rule_1626435600000',
          },
        },
      ];

      setActions(mockActions);
      setApprovals(mockApprovals);
      setExecutions(mockExecutions);
    } catch (error) {
      console.error('Failed to load remediation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  const approveAction = (approvalId: string) => {
    setApprovals(
      approvals.map((a) =>
        a.request_id === approvalId
          ? {
              ...a,
              status: 'approved',
              approver: 'Current User',
              approval_time: Date.now(),
            }
          : a
      )
    );
  };

  const rejectAction = (approvalId: string) => {
    setApprovals(
      approvals.map((a) =>
        a.request_id === approvalId
          ? {
              ...a,
              status: 'rejected',
              approver: 'Current User',
            }
          : a
      )
    );
  };

  if (loading) {
    return <div className="p-6">Loading remediation data...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Remediation Orchestration</h1>

      <div className="grid grid-cols-4 gap-6 mb-6">
        {/* Stats */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm">Pending Approvals</h3>
            <div className="text-3xl font-bold text-warning mt-2">
              {approvals.filter((a) => a.status === 'pending').length}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm">Queued Actions</h3>
            <div className="text-3xl font-bold text-info mt-2">{actions.length}</div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm">Completed</h3>
            <div className="text-3xl font-bold text-success mt-2">
              {executions.filter((e) => e.status === 'completed').length}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm">Failed</h3>
            <div className="text-3xl font-bold text-error mt-2">
              {executions.filter((e) => e.status === 'failed').length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="col-span-1">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg">Pending Approvals</h2>

              <div className="space-y-3 mt-4">
                {approvals
                  .filter((a) => a.status === 'pending')
                  .map((approval) => (
                    <div key={approval.request_id} className="card bg-base-100 border-l-4 border-warning">
                      <div className="card-body p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{approval.action_description}</h4>
                            <p className="text-xs opacity-75 mt-1">
                              Expires:{' '}
                              {format(approval.expires_at, 'HH:mm')}
                            </p>
                          </div>
                          <span
                            className={`badge badge-${getSeverityColor(
                              approval.severity
                            )} badge-sm`}
                          >
                            {approval.severity.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => approveAction(approval.request_id)}
                            className="btn btn-success btn-xs flex-1"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectAction(approval.request_id)}
                            className="btn btn-error btn-xs flex-1"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Queue */}
        <div className="col-span-2">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg">Queued Actions</h2>

              <div className="overflow-x-auto mt-4">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Impact</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((action) => {
                      const execution = executions.find((e) => e.action_id === action.action_id);
                      const approval = approvals.find((a) => a.action_id === action.action_id);

                      return (
                        <tr key={action.action_id}>
                          <td className="font-mono text-xs">{action.action_type}</td>
                          <td className="text-xs">{action.target_id}</td>
                          <td className="text-xs max-w-xs truncate">{action.estimated_impact}</td>
                          <td className="text-xs">{action.estimated_duration_seconds}s</td>
                          <td>
                            {execution ? (
                              <span
                                className={`badge badge-${
                                  execution.status === 'completed'
                                    ? 'success'
                                    : execution.status === 'failed'
                                      ? 'error'
                                      : 'info'
                                }`}
                              >
                                {execution.status}
                              </span>
                            ) : approval ? (
                              <span className="badge badge-warning">
                                {approval.status}
                              </span>
                            ) : (
                              <span className="badge">pending</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setSelectedAction(action);
                                setShowApprovalModal(true);
                              }}
                              className="btn btn-xs btn-ghost"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className="card bg-base-200 shadow-lg mt-6">
        <div className="card-body">
          <h2 className="card-title">Execution History</h2>

          <div className="space-y-3 mt-4">
            {executions.map((execution) => (
              <div key={execution.action_id} className="card bg-base-100">
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {
                          actions.find((a) => a.action_id === execution.action_id)
                            ?.description
                        }
                      </h4>
                      {execution.started_at && (
                        <p className="text-xs opacity-75 mt-1">
                          Started: {format(execution.started_at, 'MMM dd HH:mm:ss')}
                          {execution.completed_at && (
                            <>
                              {' '}
                              | Completed:{' '}
                              {format(execution.completed_at, 'MMM dd HH:mm:ss')}
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <span
                      className={`badge badge-${
                        execution.status === 'completed'
                          ? 'success'
                          : execution.status === 'failed'
                            ? 'error'
                            : 'info'
                      }`}
                    >
                      {execution.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Details Modal */}
      {showApprovalModal && selectedAction && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>

            <h3 className="font-bold text-lg">{selectedAction.description}</h3>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-semibold">Action Type</label>
                <p className="text-sm opacity-75">{selectedAction.action_type}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Target</label>
                  <p className="text-sm opacity-75">
                    {selectedAction.target_type}: {selectedAction.target_id}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold">Severity</label>
                  <p className="text-sm opacity-75">{selectedAction.severity}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Estimated Impact</label>
                <p className="text-sm opacity-75">{selectedAction.estimated_impact}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Duration</label>
                  <p className="text-sm opacity-75">
                    {selectedAction.estimated_duration_seconds} seconds
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold">Rollback</label>
                  <p className="text-sm opacity-75">
                    {selectedAction.rollback_possible ? 'Possible' : 'Not possible'}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="btn btn-ghost"
              >
                Close
              </button>
            </div>
          </div>

          <div
            className="modal-backdrop"
            onClick={() => setShowApprovalModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
}
