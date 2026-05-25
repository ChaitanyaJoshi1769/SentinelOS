import { NextRequest } from 'next/server';
import { RemediationActionSchema, ApprovalRequestSchema } from '@sentinelos/schema';
import { getDatabase } from '@sentinelos/database';
import {
  successResponse,
  validationError,
  errorResponse,
} from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import { getQueryParam, parseBody } from '@/lib/request';

const logger = createLogger('remediation-api');

/**
 * GET /api/remediation
 * Fetch remediation actions and approvals
 */
export async function GET(request: NextRequest) {
  try {
    const actionType = getQueryParam(request, 'actionType') || undefined;
    const status = getQueryParam(request, 'status') || undefined;

    logger.debug('Fetching remediation data', { actionType, status });

    const db = getDatabase();
    const remediationRepository = db.getRemediationRepository();

    // Fetch actions and approvals from database
    const actions = await remediationRepository.findAllActions(actionType, status);
    const approvals = await remediationRepository.findAllApprovals(status);

    // Validate data against schemas
    const validatedActions = actions.map((a) => RemediationActionSchema.parse(a));
    const validatedApprovals = approvals.map((a) => ApprovalRequestSchema.parse(a));

    logger.info(`Found ${validatedActions.length} actions and ${validatedApprovals.length} approvals`);

    return successResponse({
      actions: validatedActions,
      approvals: validatedApprovals,
    });
  } catch (error) {
    logger.error('Error fetching remediation data', error as Error);
    return errorResponse('Failed to fetch remediation data', 500);
  }
}

/**
 * POST /api/remediation/approve
 * Approve a remediation action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request);

    if (!body.request_id || !body.approver) {
      return validationError('request_id and approver are required');
    }

    logger.debug('Approving remediation action', { request_id: body.request_id });

    const db = getDatabase();
    const remediationRepository = db.getRemediationRepository();

    // Approve the action in database
    const approval = await remediationRepository.approveAction(
      body.request_id,
      body.approver,
      body.notes
    );

    // Validate against schema
    const validated = ApprovalRequestSchema.parse(approval);

    logger.info(`Action approved: ${validated.request_id}`);

    return successResponse(validated);
  } catch (error) {
    logger.error('Error approving remediation action', error as Error);
    return errorResponse('Failed to approve action', 500);
  }
}
