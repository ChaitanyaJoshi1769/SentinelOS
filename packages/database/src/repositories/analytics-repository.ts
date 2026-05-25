import { SecurityMetric, ThreatActor, AlertType, KPI } from '@sentinelos/schema';
import { DatabaseClient } from '../client';

/**
 * Analytics Repository
 * Handles database operations for security metrics and analytics data
 */
export class AnalyticsRepository {
  constructor(private db: DatabaseClient) {}

  /**
   * Find security metric by ID
   */
  async findMetricById(metricId: string): Promise<SecurityMetric | null> {
    const query = `
      SELECT * FROM security_metrics
      WHERE metric_id = $1
    `;

    const result = await this.db.getOne<SecurityMetric>(query, [metricId]);
    return result || null;
  }

  /**
   * Find all security metrics within date range
   */
  async findMetricsByDateRange(
    startTime: number,
    endTime: number
  ): Promise<SecurityMetric[]> {
    const query = `
      SELECT * FROM security_metrics
      WHERE created_at >= $1 AND created_at <= $2
      ORDER BY created_at DESC
    `;

    const data = await this.db.getMany<SecurityMetric>(query, [startTime, endTime]);
    return data;
  }

  /**
   * Get metrics grouped by type
   */
  async findMetricsByType(
    type: string,
    startTime: number,
    endTime: number
  ): Promise<SecurityMetric[]> {
    const query = `
      SELECT * FROM security_metrics
      WHERE type = $1 AND created_at >= $2 AND created_at <= $3
      ORDER BY created_at DESC
    `;

    const data = await this.db.getMany<SecurityMetric>(query, [type, startTime, endTime]);
    return data;
  }

  /**
   * Create security metric
   */
  async createMetric(metric: Omit<SecurityMetric, 'metric_id' | 'created_at'>): Promise<SecurityMetric> {
    const metricId = `metric_${Date.now()}`;
    const now = Date.now();

    const query = `
      INSERT INTO security_metrics (
        metric_id, type, name, value, unit, severity, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      metricId,
      metric.type,
      metric.name,
      metric.value,
      metric.unit,
      metric.severity,
      now,
    ];

    const result = await this.db.getOne<SecurityMetric>(query, values);
    if (!result) {
      throw new Error('Failed to create security metric');
    }

    return result;
  }

  /**
   * Get KPI summary for date range
   */
  async getKPISummary(
    startTime: number,
    endTime: number
  ): Promise<{
    totalAlerts: number;
    criticalAlerts: number;
    resolvedIncidents: number;
    avgResolutionTime: number;
    mtbf: number;
    mttr: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total_alerts,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_alerts,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_incidents,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_resolution_time
      FROM security_metrics
      WHERE created_at >= $1 AND created_at <= $2
    `;

    const result = await this.db.getOne<any>(query, [startTime, endTime]);

    return {
      totalAlerts: parseInt(result?.total_alerts || 0, 10),
      criticalAlerts: parseInt(result?.critical_alerts || 0, 10),
      resolvedIncidents: parseInt(result?.resolved_incidents || 0, 10),
      avgResolutionTime: parseFloat(result?.avg_resolution_time || 0),
      mtbf: 0, // Mean Time Between Failures - would need specialized calculation
      mttr: parseFloat(result?.avg_resolution_time || 0), // Mean Time To Recover
    };
  }

  /**
   * Find threat actors
   */
  async findThreatActors(): Promise<ThreatActor[]> {
    const query = `
      SELECT actor_id, name, country, known_techniques, last_seen
      FROM threat_actors
      ORDER BY last_seen DESC
    `;

    const data = await this.db.getMany<ThreatActor>(query);
    return data;
  }

  /**
   * Find threat actor by ID
   */
  async findThreatActorById(actorId: string): Promise<ThreatActor | null> {
    const query = `
      SELECT actor_id, name, country, known_techniques, last_seen
      FROM threat_actors
      WHERE actor_id = $1
    `;

    const result = await this.db.getOne<ThreatActor>(query, [actorId]);
    return result || null;
  }

  /**
   * Get alert distribution by type
   */
  async getAlertDistribution(
    startTime: number,
    endTime: number
  ): Promise<Array<{ type: AlertType; count: number }>> {
    const query = `
      SELECT
        type,
        COUNT(*) as count
      FROM security_metrics
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY type
      ORDER BY count DESC
    `;

    const data = await this.db.getMany<{ type: AlertType; count: number }>(
      query,
      [startTime, endTime]
    );
    return data;
  }

  /**
   * Get severity trend over time
   */
  async getSeverityTrend(
    startTime: number,
    endTime: number,
    interval: '1hour' | '1day' | '1week' = '1day'
  ): Promise<Array<{ time: number; critical: number; high: number; medium: number; low: number }>> {
    const intervalMs =
      interval === '1hour' ? 3600000 : interval === '1day' ? 86400000 : 604800000;

    const query = `
      SELECT
        (created_at / $3)::integer * $3 as time_bucket,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
      FROM security_metrics
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `;

    const data = await this.db.getMany<any>(query, [startTime, endTime, intervalMs]);

    return data.map((row) => ({
      time: row.time_bucket,
      critical: parseInt(row.critical || 0, 10),
      high: parseInt(row.high || 0, 10),
      medium: parseInt(row.medium || 0, 10),
      low: parseInt(row.low || 0, 10),
    }));
  }
}
