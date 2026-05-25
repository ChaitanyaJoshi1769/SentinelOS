/**
 * High-performance telemetry event processor
 * Handles normalization, enrichment, and routing of security events
 */

import { TelemetryEvent, EventType, SeverityLevel, TelemetryEventSchema } from '@sentinelos/shared';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino();

/**
 * Normalizer for events from different sources
 */
export interface EventNormalizer {
  source_system: string;
  normalize(rawEvent: any): TelemetryEvent | null;
}

/**
 * CrowdStrike event normalizer
 */
export class CrowdStrikeNormalizer implements EventNormalizer {
  source_system = 'crowdstrike';

  normalize(rawEvent: any): TelemetryEvent | null {
    try {
      const eventType = this.mapEventType(rawEvent.event_type);
      if (!eventType) return null;

      const timestamp = rawEvent.timestamp ? rawEvent.timestamp * 1000 : Date.now();

      return {
        event_id: uuidv4(),
        timestamp,
        source_system: this.source_system,
        event_type: eventType,
        entity_type: 'endpoint',
        entity_id: rawEvent.device_id || rawEvent.host_id,
        entity_name: rawEvent.host_name || rawEvent.device_name,
        severity: this.mapSeverity(rawEvent.severity),
        classification: this.extractClassification(rawEvent),
        data: {
          original_event_id: rawEvent.event_id,
          timestamp: timestamp,
          ...rawEvent,
        },
        enrichment: {},
        raw_data: JSON.stringify(rawEvent),
      };
    } catch (error) {
      logger.error({ error }, 'CrowdStrike normalization failed');
      return null;
    }
  }

  private mapEventType(csEventType: string): EventType | null {
    const mapping: Record<string, EventType> = {
      ProcessRollup2: EventType.PROCESS_CREATION,
      SuspiciousActivity: EventType.THREAT_DETECTED,
      NetworkKill: EventType.NETWORK_CONNECTION,
      Dns: EventType.DNS_QUERY,
    };
    return mapping[csEventType] || null;
  }

  private mapSeverity(csSeverity: number): SeverityLevel {
    if (csSeverity >= 8) return SeverityLevel.CRITICAL;
    if (csSeverity >= 6) return SeverityLevel.HIGH;
    if (csSeverity >= 4) return SeverityLevel.MEDIUM;
    if (csSeverity >= 2) return SeverityLevel.LOW;
    return SeverityLevel.INFO;
  }

  private extractClassification(rawEvent: any): string[] {
    const classifications: string[] = [];
    if (rawEvent.suspicious_activity) classifications.push('suspicious');
    if (rawEvent.command_line?.includes('powershell')) classifications.push('powershell');
    if (rawEvent.file_hash) classifications.push('hash_observed');
    return classifications;
  }
}

/**
 * Splunk event normalizer
 */
export class SplunkNormalizer implements EventNormalizer {
  source_system = 'splunk';

  normalize(rawEvent: any): TelemetryEvent | null {
    try {
      const timestamp = rawEvent._time ? new Date(rawEvent._time).getTime() : Date.now();

      return {
        event_id: uuidv4(),
        timestamp,
        source_system: this.source_system,
        event_type: this.mapEventType(rawEvent.source) || EventType.PROCESS_CREATION,
        entity_type: this.mapEntityType(rawEvent),
        entity_id: rawEvent.host || rawEvent.src_ip || uuidv4(),
        entity_name: rawEvent.host || rawEvent.src_ip,
        severity: this.mapSeverity(rawEvent.severity),
        classification: this.extractClassification(rawEvent),
        data: rawEvent,
        enrichment: {},
        raw_data: JSON.stringify(rawEvent),
      };
    } catch (error) {
      logger.error({ error }, 'Splunk normalization failed');
      return null;
    }
  }

  private mapEventType(source: string): EventType | null {
    if (source?.includes('process')) return EventType.PROCESS_CREATION;
    if (source?.includes('network')) return EventType.NETWORK_CONNECTION;
    if (source?.includes('dns')) return EventType.DNS_QUERY;
    return null;
  }

  private mapEntityType(rawEvent: any): 'endpoint' | 'identity' | 'network' | 'application' | 'cloud_resource' {
    if (rawEvent.user) return 'identity';
    if (rawEvent.src_ip || rawEvent.dest_ip) return 'network';
    return 'endpoint';
  }

  private mapSeverity(severity: string): SeverityLevel {
    const severityMap: Record<string, SeverityLevel> = {
      critical: SeverityLevel.CRITICAL,
      high: SeverityLevel.HIGH,
      medium: SeverityLevel.MEDIUM,
      low: SeverityLevel.LOW,
    };
    return severityMap[severity?.toLowerCase()] || SeverityLevel.INFO;
  }

  private extractClassification(rawEvent: any): string[] {
    const classifications: string[] = [];
    if (rawEvent.signature) classifications.push(rawEvent.signature);
    if (rawEvent.tags) classifications.push(...(Array.isArray(rawEvent.tags) ? rawEvent.tags : [rawEvent.tags]));
    return classifications;
  }
}

/**
 * Microsoft Defender event normalizer
 */
export class MicrosoftDefenderNormalizer implements EventNormalizer {
  source_system = 'microsoft_defender';

  normalize(rawEvent: any): TelemetryEvent | null {
    try {
      const timestamp = rawEvent.eventDatetime ? new Date(rawEvent.eventDatetime).getTime() : Date.now();

      return {
        event_id: rawEvent.id || uuidv4(),
        timestamp,
        source_system: this.source_system,
        event_type: this.mapEventType(rawEvent.alertTitle) || EventType.THREAT_DETECTED,
        entity_type: 'endpoint',
        entity_id: rawEvent.deviceId || rawEvent.deviceName,
        entity_name: rawEvent.deviceName,
        severity: this.mapSeverity(rawEvent.severity),
        classification: [rawEvent.alertTitle, ...(rawEvent.category ? [rawEvent.category] : [])],
        data: rawEvent,
        enrichment: {
          asset_info: {
            asset_type: 'endpoint',
            criticality: this.mapCriticality(rawEvent),
            owner: rawEvent.assignedTo || 'unassigned',
            tags: rawEvent.tags || [],
          },
        },
        raw_data: JSON.stringify(rawEvent),
      };
    } catch (error) {
      logger.error({ error }, 'Microsoft Defender normalization failed');
      return null;
    }
  }

  private mapEventType(alertTitle: string): EventType | null {
    if (alertTitle?.includes('Process')) return EventType.PROCESS_CREATION;
    if (alertTitle?.includes('Network')) return EventType.NETWORK_CONNECTION;
    if (alertTitle?.includes('File')) return EventType.FILE_MODIFICATION;
    return null;
  }

  private mapSeverity(severity: string): SeverityLevel {
    const severityMap: Record<string, SeverityLevel> = {
      High: SeverityLevel.HIGH,
      Medium: SeverityLevel.MEDIUM,
      Low: SeverityLevel.LOW,
      Informational: SeverityLevel.INFO,
    };
    return severityMap[severity] || SeverityLevel.MEDIUM;
  }

  private mapCriticality(rawEvent: any): 'critical' | 'high' | 'medium' | 'low' {
    if (rawEvent.severity === 'High') return 'high';
    if (rawEvent.severity === 'Medium') return 'medium';
    return 'low';
  }
}

/**
 * Main telemetry processor
 */
export class TelemetryProcessor {
  private normalizers: Map<string, EventNormalizer> = new Map();
  private enrichers: Array<(event: TelemetryEvent) => Promise<void>> = [];

  constructor() {
    this.registerDefaultNormalizers();
  }

  private registerDefaultNormalizers(): void {
    this.normalizers.set('crowdstrike', new CrowdStrikeNormalizer());
    this.normalizers.set('splunk', new SplunkNormalizer());
    this.normalizers.set('microsoft_defender', new MicrosoftDefenderNormalizer());
  }

  /**
   * Register custom normalizer
   */
  registerNormalizer(normalizer: EventNormalizer): void {
    this.normalizers.set(normalizer.source_system, normalizer);
  }

  /**
   * Register enricher function
   */
  registerEnricher(enricher: (event: TelemetryEvent) => Promise<void>): void {
    this.enrichers.push(enricher);
  }

  /**
   * Process raw event from security system
   */
  async process(sourceSystem: string, rawEvent: any): Promise<TelemetryEvent | null> {
    // Step 1: Normalize
    const normalizer = this.normalizers.get(sourceSystem);
    if (!normalizer) {
      logger.warn({ sourceSystem }, 'No normalizer found for source');
      return null;
    }

    const event = normalizer.normalize(rawEvent);
    if (!event) {
      return null;
    }

    // Step 2: Validate
    try {
      TelemetryEventSchema.parse(event);
    } catch (error) {
      logger.error({ error, event }, 'Event validation failed');
      return null;
    }

    // Step 3: Enrich
    for (const enricher of this.enrichers) {
      try {
        await enricher(event);
      } catch (error) {
        logger.error({ error }, 'Enrichment failed');
        // Continue with other enrichers
      }
    }

    return event;
  }

  /**
   * Batch process events
   */
  async processBatch(sourceSystem: string, events: any[]): Promise<TelemetryEvent[]> {
    const results: TelemetryEvent[] = [];

    for (const rawEvent of events) {
      try {
        const event = await this.process(sourceSystem, rawEvent);
        if (event) {
          results.push(event);
        }
      } catch (error) {
        logger.error({ error }, 'Batch processing failed for single event');
      }
    }

    return results;
  }
}

export default TelemetryProcessor;
