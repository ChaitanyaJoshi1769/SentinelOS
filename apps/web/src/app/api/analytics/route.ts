import { NextRequest, NextResponse } from 'next/server';
import { SecurityMetricSchema, ThreatActorSchema } from '@sentinelos/schema';
import { getDatabase } from '@sentinelos/database';

/**
 * GET /api/analytics
 * Fetch security analytics and metrics
 */
export async function GET(request: NextRequest) {
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30d';

    db = getDatabase();
    const analyticsRepository = db.getAnalyticsRepository();

    // Calculate date range
    const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
    const endTime = Date.now();
    const startTime = endTime - days * 86400000;

    // Fetch metrics from database
    const metrics = await analyticsRepository.findMetricsByDateRange(startTime, endTime);
    const threats = await analyticsRepository.findThreatActors();
    const kpiSummary = await analyticsRepository.getKPISummary(startTime, endTime);

    // Validate data against schemas
    const validatedMetrics = metrics.map((m) => SecurityMetricSchema.parse(m));
    const validatedThreats = threats.map((t) => ThreatActorSchema.parse(t));

    return NextResponse.json({
      success: true,
      data: {
        metrics: validatedMetrics,
        threats: validatedThreats,
        kpis: {
          total_alerts: kpiSummary.totalAlerts,
          critical_alerts: kpiSummary.criticalAlerts,
          resolved_incidents: kpiSummary.resolvedIncidents,
          avg_resolution_time: Math.round(kpiSummary.avgResolutionTime / 60), // Convert to minutes
          mtbf: kpiSummary.mtbf,
          mttr: Math.round(kpiSummary.mttr / 60), // Convert to minutes
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/export
 * Export analytics report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.format) {
      return NextResponse.json(
        {
          success: false,
          error: 'format is required (pdf, csv, json)',
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const analyticsRepository = db.getAnalyticsRepository();

    // Calculate date range from request
    const dateRange = body.date_range || '30d';
    const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
    const endTime = Date.now();
    const startTime = endTime - days * 86400000;

    // Get the data for the report
    const metrics = await analyticsRepository.findMetricsByDateRange(startTime, endTime);
    const kpiSummary = await analyticsRepository.getKPISummary(startTime, endTime);

    // Generate report
    const report = {
      report_id: `report_${Date.now()}`,
      format: body.format,
      generated_at: new Date().toISOString(),
      date_range: dateRange,
      metrics_count: metrics.length,
      kpis: kpiSummary,
      url: `/reports/report_${Date.now()}.${body.format}`,
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export analytics',
      },
      { status: 500 }
    );
  }
}
