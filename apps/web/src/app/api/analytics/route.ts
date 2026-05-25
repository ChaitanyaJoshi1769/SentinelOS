import { NextRequest } from 'next/server';
import { SecurityMetricSchema, ThreatActorSchema } from '@sentinelos/schema';
import { getDatabase } from '@sentinelos/database';
import {
  successResponse,
  validationError,
  errorResponse,
} from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import { getQueryParam, parseBody } from '@/lib/request';

const logger = createLogger('analytics-api');

/**
 * GET /api/analytics
 * Fetch security analytics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const dateRange = getQueryParam(request, 'dateRange') || '30d';

    logger.debug('Fetching analytics', { dateRange });

    const db = getDatabase();
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

    logger.info(`Fetched ${validatedMetrics.length} metrics and ${validatedThreats.length} threats`);

    return successResponse({
      metrics: validatedMetrics,
      threats: validatedThreats,
      kpis: {
        total_alerts: kpiSummary.totalAlerts,
        critical_alerts: kpiSummary.criticalAlerts,
        resolved_incidents: kpiSummary.resolvedIncidents,
        avg_resolution_time: Math.round(kpiSummary.avgResolutionTime / 60),
        mtbf: kpiSummary.mtbf,
        mttr: Math.round(kpiSummary.mttr / 60),
      },
    });
  } catch (error) {
    logger.error('Error fetching analytics', error as Error);
    return errorResponse('Failed to fetch analytics', 500);
  }
}

/**
 * POST /api/analytics/export
 * Export analytics report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody(request);

    if (!body.format) {
      return validationError('format is required (pdf, csv, json)');
    }

    logger.debug('Exporting analytics report', { format: body.format });

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

    logger.info(`Report generated: ${report.report_id}`);

    return successResponse(report, 201);
  } catch (error) {
    logger.error('Error exporting analytics', error as Error);
    return errorResponse('Failed to export analytics', 500);
  }
}
