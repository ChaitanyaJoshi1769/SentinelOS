import { NextRequest, NextResponse } from 'next/server';
import { RemediationActionSchema, ApprovalRequestSchema } from '@sentinelos/schema';
import { getDatabase } from '@sentinelos/database';

/**
 * GET /api/remediation
 * Fetch remediation actions and approvals
 */
export async function GET(request: NextRequest) {
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get('actionType') || undefined;
    const status = searchParams.get('status') || undefined;

    db = getDatabase();
    const remediationRepository = db.getRemediationRepository();

    // Fetch actions and approvals from database
    const actions = await remediationRepository.findAllActions(actionType, status);
    const approvals = await remediationRepository.findAllApprovals(status);

    // Validate data against schemas
    const validatedActions = actions.map((a) => RemediationActionSchema.parse(a));
    const validatedApprovals = approvals.map((a) => ApprovalRequestSchema.parse(a));

    return NextResponse.json({
      success: true,
      data: {
        actions: validatedActions,
        approvals: validatedApprovals,
      },
    });
  } catch (error) {
    console.error('Error fetching remediation data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch remediation data',
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
  let db;
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

    db = getDatabase();
    const remediationRepository = db.getRemediationRepository();

    // Approve the action in database
    const approval = await remediationRepository.approveAction(
      body.request_id,
      body.approver,
      body.notes
    );

    // Validate against schema
    const validated = ApprovalRequestSchema.parse(approval);

    return NextResponse.json({
      success: true,
      data: validated,
    });
  } catch (error) {
    console.error('Error approving remediation action:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve action',
      },
      { status: 500 }
    );
  }
}
