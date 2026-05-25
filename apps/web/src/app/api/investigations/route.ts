import { NextRequest, NextResponse } from 'next/server';
import { InvestigationSchema } from '@sentinelos/schema';
import { getDatabase } from '@sentinelos/database';

/**
 * GET /api/investigations
 * Fetch investigations with optional filtering
 */
export async function GET(request: NextRequest) {
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    db = getDatabase();
    const investigationRepository = db.getInvestigationRepository();

    // Fetch investigations from database
    const result = await investigationRepository.findAll(limit, offset, status);

    // Validate all investigations against schema
    const validatedInvestigations = result.data.map((inv) =>
      InvestigationSchema.parse(inv)
    );

    return NextResponse.json({
      success: true,
      data: validatedInvestigations,
      count: validatedInvestigations.length,
      total: result.total,
    });
  } catch (error) {
    console.error('Error fetching investigations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch investigations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/investigations
 * Create a new investigation
 */
export async function POST(request: NextRequest) {
  let db;
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.alert_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'alert_id is required',
        },
        { status: 400 }
      );
    }

    db = getDatabase();
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

    return NextResponse.json(
      {
        success: true,
        data: validated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating investigation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create investigation',
      },
      { status: 500 }
    );
  }
}
