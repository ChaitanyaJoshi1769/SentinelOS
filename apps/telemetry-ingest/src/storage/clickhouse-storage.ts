/**
 * ClickHouse storage layer for petabyte-scale telemetry
 * Optimized for time-series security event data
 */

import { TelemetryEvent } from '@sentinelos/shared';
import pino from 'pino';

const logger = pino();

/**
 * ClickHouse telemetry storage
 */
export class ClickHouseStorage {
  private client: any;
  private initialized = false;

  constructor(
    private host: string,
    private port: number,
    private database: string,
    private username: string,
    private password: string
  ) {
    // Note: Using dynamic import pattern as ClickHouse client setup
    // In production, would use official ClickHouse Node.js driver
  }

  /**
   * Initialize storage and create tables
   */
  async initialize(): Promise<void> {
    try {
      // Create database if not exists
      await this.executeQuery(`CREATE DATABASE IF NOT EXISTS ${this.database}`);

      // Create telemetry events table
      await this.createTelemetryTable();

      // Create indexes
      await this.createIndexes();

      this.initialized = true;
      logger.info('ClickHouse storage initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize ClickHouse storage');
      throw error;
    }
  }

  /**
   * Create main telemetry events table
   */
  private async createTelemetryTable(): Promise<void> {
    const tableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.database}.telemetry_events (
        event_id UUID,
        timestamp DateTime,
        source_system String,
        event_type String,
        entity_type String,
        entity_id String,
        entity_name String,
        severity String,
        classification Array(String),
        data String,
        enrichment String,
        raw_data String,
        created_at DateTime DEFAULT now(),
        INDEX idx_timestamp (timestamp) TYPE minmax GRANULARITY 1,
        INDEX idx_source (source_system) TYPE set(100) GRANULARITY 1,
        INDEX idx_entity (entity_id) TYPE set(100) GRANULARITY 1
      )
      ENGINE = MergeTree()
      ORDER BY (timestamp, source_system, event_type)
      TTL timestamp + toIntervalMonth(1)
      SETTINGS index_granularity = 8192
    `;

    await this.executeQuery(tableQuery);
  }

  /**
   * Create additional indexes for performance
   */
  private async createIndexes(): Promise<void> {
    // Create materialized view for high-risk events
    const highRiskView = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${this.database}.high_risk_events
      ENGINE = ReplacingMergeTree()
      ORDER BY (timestamp, event_id)
      AS
      SELECT *
      FROM ${this.database}.telemetry_events
      WHERE severity IN ('critical', 'high')
    `;

    await this.executeQuery(highRiskView);

    // Create aggregation table for metrics
    const metricsTable = `
      CREATE TABLE IF NOT EXISTS ${this.database}.telemetry_metrics (
        time_bucket DateTime,
        source_system String,
        event_type String,
        severity String,
        event_count UInt64
      )
      ENGINE = SummingMergeTree()
      ORDER BY (time_bucket, source_system, event_type, severity)
    `;

    await this.executeQuery(metricsTable);
  }

  /**
   * Store telemetry event
   */
  async storeEvent(event: TelemetryEvent): Promise<void> {
    try {
      const insertQuery = `
        INSERT INTO ${this.database}.telemetry_events
        (event_id, timestamp, source_system, event_type, entity_type, entity_id, entity_name, severity, classification, data, enrichment, raw_data)
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        event.event_id,
        new Date(event.timestamp),
        event.source_system,
        event.event_type,
        event.entity_type,
        event.entity_id,
        event.entity_name,
        event.severity,
        JSON.stringify(event.classification),
        JSON.stringify(event.data),
        JSON.stringify(event.enrichment),
        event.raw_data,
      ];

      await this.executeQuery(insertQuery, values);
    } catch (error) {
      logger.error({ error, event_id: event.event_id }, 'Failed to store event');
      throw error;
    }
  }

  /**
   * Batch store events
   */
  async storeBatch(events: TelemetryEvent[]): Promise<{ stored: number; failed: number }> {
    let stored = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.storeEvent(event);
        stored++;
      } catch (error) {
        logger.error({ error, event_id: event.event_id }, 'Failed to store event in batch');
        failed++;
      }
    }

    return { stored, failed };
  }

  /**
   * Query events
   */
  async queryEvents(
    filters: {
      source_system?: string;
      event_type?: string;
      severity?: string;
      entity_id?: string;
      time_range?: {
        start: number;
        end: number;
      };
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<TelemetryEvent[]> {
    let query = `SELECT * FROM ${this.database}.telemetry_events WHERE 1=1`;
    const params: any[] = [];

    if (filters.source_system) {
      query += ' AND source_system = ?';
      params.push(filters.source_system);
    }

    if (filters.event_type) {
      query += ' AND event_type = ?';
      params.push(filters.event_type);
    }

    if (filters.severity) {
      query += ' AND severity = ?';
      params.push(filters.severity);
    }

    if (filters.entity_id) {
      query += ' AND entity_id = ?';
      params.push(filters.entity_id);
    }

    if (filters.time_range) {
      query += ' AND timestamp >= ? AND timestamp <= ?';
      params.push(new Date(filters.time_range.start));
      params.push(new Date(filters.time_range.end));
    }

    query += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit);
    params.push(offset);

    try {
      const result = await this.executeQuery(query, params);
      return this.mapRowsToEvents(result);
    } catch (error) {
      logger.error({ error }, 'Query failed');
      throw error;
    }
  }

  /**
   * Get event count
   */
  async getEventCount(
    filters?: {
      source_system?: string;
      time_range?: { start: number; end: number };
    }
  ): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.database}.telemetry_events WHERE 1=1`;
    const params: any[] = [];

    if (filters?.source_system) {
      query += ' AND source_system = ?';
      params.push(filters.source_system);
    }

    if (filters?.time_range) {
      query += ' AND timestamp >= ? AND timestamp <= ?';
      params.push(new Date(filters.time_range.start));
      params.push(new Date(filters.time_range.end));
    }

    try {
      const result = await this.executeQuery(query, params);
      return result[0]?.count || 0;
    } catch (error) {
      logger.error({ error }, 'Count query failed');
      throw error;
    }
  }

  /**
   * Execute query
   */
  private async executeQuery(query: string, params?: any[]): Promise<any[]> {
    // In production, use official ClickHouse driver
    // This is a placeholder for the architecture
    logger.debug({ query, params_count: params?.length }, 'Executing query');
    return [];
  }

  /**
   * Map database rows to TelemetryEvent objects
   */
  private mapRowsToEvents(rows: any[]): TelemetryEvent[] {
    return rows.map((row) => ({
      event_id: row.event_id,
      timestamp: new Date(row.timestamp).getTime(),
      source_system: row.source_system,
      event_type: row.event_type,
      entity_type: row.entity_type as any,
      entity_id: row.entity_id,
      entity_name: row.entity_name,
      severity: row.severity as any,
      classification: JSON.parse(row.classification),
      data: JSON.parse(row.data),
      enrichment: JSON.parse(row.enrichment),
      raw_data: row.raw_data,
    }));
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    logger.info('ClickHouse connection closed');
  }
}

export default ClickHouseStorage;
