import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/remediation
 * Fetch remediation actions and approvals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get('actionType');
    const status = searchParams.get('status');

    // Mock remediation data
    const mockActions = [
      {
        action_id: 'action_1',
        action_type: 'isolate',
        target_type: 'endpoint',
        target_id: 'endpoint_1',
        severity: 'critical',
        description: 'Isolate compromised workstation from network',
        estimated_impact: 'User loses network access. Requires VPN reconnection.',
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
    ];

    const mockApprovals = [
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
    ];

    // Filter by type if provided
    let actions = mockActions;
    if (actionType) {
      actions = actions.filter((a) => a.action_type === actionType);
    }

    let approvals = mockApprovals;
    if (status) {
      approvals = approvals.filter((a) => a.status === status);
    }

    return NextResponse.json({
      success: true,
      data: {
        actions,
        approvals,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/remediation/approve
 * Approve a remediation action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.request_id || !body.approver) {
      return NextResponse.json(
        {
          success: false,
          error: 'request_id and approver are required',
        },
        { status: 400 }
      );
    }

    // Mock approval
    const approval = {
      request_id: body.request_id,
      status: 'approved',
      approver: body.approver,
      approval_time: Date.now(),
      approval_notes: body.notes || '',
    };

    return NextResponse.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
