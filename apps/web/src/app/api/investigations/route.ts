import { NextRequest } from 'next/server';
import { InvestigationSchema } from '@sentinelos/schema';
import { getDatabase } from '@sentinelos/database';
import {
  successResponse,
  paginatedResponse,
  validationError,
  errorResponse,
} from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import { getQueryParam, parseBody } from '@/lib/request';

const logger = createLogger('investigations-api');

/**
 * GET /api/investigations
 * Fetch investigations with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const status = getQueryParam(request, 'status') || undefined;
    const limit = Math.min(
      parseInt(getQueryParam(request, 'limit') || '50', 10),
      100
    );
    const offset = parseInt(getQueryParam(request, 'offset') || '0', 10);

    logger.debug('Fetching investigations', { status, limit, offset });

    const db = getDatabase();
    const investigationRepository = db.getInvestigationRepository();

    // Fetch investigations from database
    const result = await investigationRepository.findAll(limit, offset, status);

    // Validate all investigations against schema
    const validatedInvestigations = result.data.map((inv) =>
      InvestigationSchema.parse(inv)
    );

    logger.info(`Found ${validatedInvestigations.length} investigations`);

    return paginatedResponse(
      validatedInvestigations,
      result.total,
      validatedInvestigations.length
    );
  } catch (error) {
    logger.error('Error fetching investigations', error as Error);
    return errorResponse('Failed to fetch investigations', 500);
  }
}

/**
 * POST /api/investigations
 * Create a new investigation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request);

    // Validate required fields
    if (!body.alert_id) {
      return validationError('alert_id is required');
    }

    logger.debug('Creating new investigation', { alert_id: body.alert_id });

    const db = getDatabase();
    const investigationRepository = db.getInvestigationRepository();

    // Create investigation in database
    const newInvestigation = await investigationRepository.create({
      alert_id: body.alert_id,
      status: body.status || 'open',
      confidence: body.confidence || 0,
      findings: body.findings || [],
      timeline: body.timeline || [],
      recommendations: body.recommendations || [],
      ai_narrative: body.ai_narrative || '',
    });

    // Validate against schema
    const validated = InvestigationSchema.parse(newInvestigation);

    logger.info(`Investigation created: ${validated.investigation_id}`);

    return successResponse(validated, 201);
  } catch (error) {
    logger.error('Error creating investigation', error as Error);
    return errorResponse('Failed to create investigation', 500);
  }
}
