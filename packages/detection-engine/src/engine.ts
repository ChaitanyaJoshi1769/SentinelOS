/**
 * Detection Engine - Sigma rules, YARA, and anomaly detection
 * Evaluates telemetry against detection rules to generate security alerts
 */

import { TelemetryEvent, SecurityAlert, SeverityLevel } from '@sentinelos/shared';
import pino from 'pino';

const logger = pino();

export interface SigmaRule {
  title: string;
  id: string;
  description: string;
  status: string;
  logsource: {
    product?: string;
    service?: string;
    category?: string;
  };
  detection: {
    selection?: Record<string, any>;
    filter?: Record<string, any>;
    condition: string;
  };
  level: 'informational' | 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface YaraRule {
  name: string;
  strings: Array<{
    identifier: string;
    type: 'text' | 'hex' | 'regex';
    value: string;
  }>;
  condition: string;
  severity: string;
}

export interface DetectionMatch {
  rule_id: string;
  rule_name: string;
  rule_type: 'sigma' | 'yara' | 'anomaly';
  severity: SeverityLevel;
  matched_events: TelemetryEvent[];
  match_details: Record<string, any>;
  timestamp: number;
  confidence: number;
}

/**
 * Detection Engine
 */
export class DetectionEngine {
  private sigma_rules: Map<string, SigmaRule> = new Map();
  private yara_rules: Map<string, YaraRule> = new Map();
  private anomaly_models: Map<string, AnomalyDetector> = new Map();
  private detections: Map<string, DetectionMatch> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default detection rules
   */
  private initializeDefaultRules(): void {
    // Sigma rule for suspicious process creation
    this.sigma_rules.set('suspicious_process_creation', {
      title: 'Suspicious Process Creation',
      id: 'sigma_001',
      description: 'Detects suspicious process creation patterns',
      status: 'test',
      logsource: {
        product: 'windows',
        service: 'sysmon',
        category: 'process_creation',
      },
      detection: {
        selection: {
          Image: ['powershell.exe', 'cmd.exe', 'wscript.exe'],
          CommandLine: [
            '*curl*',
            '*wget*',
            '*certutil*',
            '*bitsadmin*',
          ],
        },
        condition: 'selection',
      },
      level: 'high',
      tags: ['execution', 'command_line_interface'],
    });

    // Sigma rule for unauthorized access
    this.sigma_rules.set('unauthorized_access', {
      title: 'Unauthorized Access Attempt',
      id: 'sigma_002',
      description: 'Detects unauthorized access attempts',
      status: 'test',
      logsource: {
        product: 'windows',
        service: 'security',
      },
      detection: {
        selection: {
          EventID: 4625,
        },
        filter: {
          Status: '0xC0000064',
        },
        condition: 'selection and filter',
      },
      level: 'medium',
      tags: ['credential_access'],
    });

    // Sigma rule for data exfiltration
    this.sigma_rules.set('data_exfiltration', {
      title: 'Potential Data Exfiltration',
      id: 'sigma_003',
      description: 'Detects large data transfers to external networks',
      status: 'test',
      logsource: {
        category: 'network_connection',
      },
      detection: {
        selection: {
          destination_ip: ['10.*', '172.16.*', '192.168.*'],
        },
        condition: 'selection',
      },
      level: 'high',
      tags: ['exfiltration'],
    });

    logger.info({ rule_count: this.sigma_rules.size }, 'Detection rules initialized');
  }

  /**
   * Load Sigma rule from YAML/JSON
   */
  loadSigmaRule(rule: SigmaRule): void {
    this.sigma_rules.set(rule.id, rule);
    logger.info({ rule_id: rule.id }, 'Sigma rule loaded');
  }

  /**
   * Load YARA rule
   */
  loadYaraRule(rule: YaraRule): void {
    this.yara_rules.set(rule.name, rule);
    logger.info({ rule_name: rule.name }, 'YARA rule loaded');
  }

  /**
   * Evaluate event against all detection rules
   */
  evaluateEvent(event: TelemetryEvent): DetectionMatch[] {
    const matches: DetectionMatch[] = [];

    // Check Sigma rules
    for (const [ruleId, rule] of this.sigma_rules) {
      if (this.matchesSigmaRule(event, rule)) {
        const severity = this.mapSeverityLevel(rule.level);
        const match: DetectionMatch = {
          rule_id: rule.id,
          rule_name: rule.title,
          rule_type: 'sigma',
          severity,
          matched_events: [event],
          match_details: {
            logsource: rule.logsource,
            tags: rule.tags,
          },
          timestamp: event.timestamp,
          confidence: 0.9,
        };
        matches.push(match);
        logger.info(
          { rule_id: ruleId, event_type: event.event_type },
          'Sigma rule matched'
        );
      }
    }

    // Check YARA rules (for file content/binary analysis)
    if (event.raw_data?.file_content || event.raw_data?.binary) {
      for (const [ruleName, rule] of this.yara_rules) {
        if (this.matchesYaraRule(event, rule)) {
          const match: DetectionMatch = {
            rule_id: ruleName,
            rule_name: rule.name,
            rule_type: 'yara',
            severity: SeverityLevel.HIGH,
            matched_events: [event],
            match_details: {
              matched_strings: rule.strings.map((s) => s.identifier),
            },
            timestamp: event.timestamp,
            confidence: 0.85,
          };
          matches.push(match);
          logger.info({ rule_name: ruleName }, 'YARA rule matched');
        }
      }
    }

    // Check anomaly detection
    const anomalyMatches = this.detectAnomalies(event);
    matches.push(...anomalyMatches);

    return matches;
  }

  /**
   * Evaluate batch of events
   */
  evaluateBatch(events: TelemetryEvent[]): DetectionMatch[] {
    const allMatches: DetectionMatch[] = [];
    const eventsByType = new Map<string, TelemetryEvent[]>();

    // Group events by type for correlation
    for (const event of events) {
      const matches = this.evaluateEvent(event);
      allMatches.push(...matches);

      if (!eventsByType.has(event.event_type)) {
        eventsByType.set(event.event_type, []);
      }
      eventsByType.get(event.event_type)!.push(event);
    }

    // Correlate related events
    const correlatedMatches = this.correlateDetections(allMatches, eventsByType);
    allMatches.push(...correlatedMatches);

    // Deduplicate and store
    for (const match of allMatches) {
      const matchId = `${match.rule_id}_${match.timestamp}`;
      if (!this.detections.has(matchId)) {
        this.detections.set(matchId, match);
      }
    }

    return allMatches;
  }

  /**
   * Convert detection match to alert
   */
  matchToAlert(match: DetectionMatch, source: string): SecurityAlert {
    return {
      alert_id: `alert_${match.rule_id}_${match.timestamp}`,
      timestamp: match.timestamp,
      title: match.rule_name,
      description: `Detection rule ${match.rule_name} matched with ${match.matched_events.length} events`,
      severity: match.severity,
      detection_rule_id: match.rule_id,
      entities: match.matched_events.map((e) => ({
        id: e.entity_id,
        type: e.event_type,
        name: e.entity_id,
      })),
      confidence: match.confidence,
      source_system: source,
      metadata: {
        rule_type: match.rule_type,
        match_details: match.match_details,
        matched_event_count: match.matched_events.length,
      },
      status: 'new',
    };
  }

  /**
   * Match event against Sigma rule
   */
  private matchesSigmaRule(event: TelemetryEvent, rule: SigmaRule): boolean {
    // Simplified matching logic - would be more complex in production
    if (!rule.detection.selection) return false;

    const selection = rule.detection.selection;
    for (const [field, values] of Object.entries(selection)) {
      const eventValue = this.getNestedProperty(event.raw_data, field);
      if (!eventValue) continue;

      const valueArray = Array.isArray(values) ? values : [values];
      const matches = valueArray.some((v) => this.patternMatches(v as string, eventValue));

      if (!matches) return false;
    }

    return true;
  }

  /**
   * Match event against YARA rule
   */
  private matchesYaraRule(event: TelemetryEvent, rule: YaraRule): boolean {
    const content = event.raw_data?.file_content || event.raw_data?.binary || '';
    let matchCount = 0;

    for (const str of rule.strings) {
      if (this.patternMatches(str.value, content)) {
        matchCount++;
      }
    }

    // Simple AND condition evaluation
    return matchCount === rule.strings.length;
  }

  /**
   * Detect anomalies using statistical models
   */
  private detectAnomalies(event: TelemetryEvent): DetectionMatch[] {
    const matches: DetectionMatch[] = [];

    // Volume anomaly detection
    const volumeAnomaly = this.detectVolumeAnomaly(event);
    if (volumeAnomaly) {
      matches.push(volumeAnomaly);
    }

    // Behavioral anomaly detection
    const behaviorAnomaly = this.detectBehaviorAnomaly(event);
    if (behaviorAnomaly) {
      matches.push(behaviorAnomaly);
    }

    return matches;
  }

  /**
   * Detect volume anomalies
   */
  private detectVolumeAnomaly(event: TelemetryEvent): DetectionMatch | null {
    // Check for unusual event volumes
    if (event.event_type === 'network_connection') {
      const volume = (event.raw_data?.bytes_out || 0) as number;
      if (volume > 1000000000) {
        // > 1GB
        return {
          rule_id: 'anomaly_volume_001',
          rule_name: 'Unusual Data Volume',
          rule_type: 'anomaly',
          severity: SeverityLevel.HIGH,
          matched_events: [event],
          match_details: {
            anomaly_type: 'volume',
            bytes_transferred: volume,
            threshold: 1000000000,
          },
          timestamp: event.timestamp,
          confidence: 0.75,
        };
      }
    }

    return null;
  }

  /**
   * Detect behavioral anomalies
   */
  private detectBehaviorAnomaly(event: TelemetryEvent): DetectionMatch | null {
    // Detect unusual process behaviors
    if (
      event.event_type === 'process_creation' &&
      (event.raw_data?.parent_image as string)?.includes('explorer.exe')
    ) {
      const childImage = event.raw_data?.image as string;
      const suspiciousProcesses = [
        'powershell.exe',
        'cmd.exe',
        'wscript.exe',
        'cscript.exe',
      ];

      if (suspiciousProcesses.some((p) => childImage?.includes(p))) {
        return {
          rule_id: 'anomaly_behavior_001',
          rule_name: 'Unusual Process Behavior',
          rule_type: 'anomaly',
          severity: SeverityLevel.MEDIUM,
          matched_events: [event],
          match_details: {
            anomaly_type: 'behavior',
            parent_process: event.raw_data?.parent_image,
            child_process: childImage,
          },
          timestamp: event.timestamp,
          confidence: 0.65,
        };
      }
    }

    return null;
  }

  /**
   * Correlate related detections
   */
  private correlateDetections(
    matches: DetectionMatch[],
    eventsByType: Map<string, TelemetryEvent[]>
  ): DetectionMatch[] {
    const correlatedMatches: DetectionMatch[] = [];

    // Look for attack chains
    const processEvents = eventsByType.get('process_creation') || [];
    const networkEvents = eventsByType.get('network_connection') || [];

    if (processEvents.length > 0 && networkEvents.length > 0) {
      // Check if suspicious process connects to network
      for (const processEvent of processEvents) {
        const processId = processEvent.raw_data?.process_id;
        for (const networkEvent of networkEvents) {
          if (networkEvent.raw_data?.process_id === processId) {
            // Correlated event
            correlatedMatches.push({
              rule_id: 'correlation_001',
              rule_name: 'Suspicious Process with Network Activity',
              rule_type: 'sigma',
              severity: SeverityLevel.CRITICAL,
              matched_events: [processEvent, networkEvent],
              match_details: {
                correlation_type: 'process_network',
                process_image: processEvent.raw_data?.image,
                destination_ip: networkEvent.raw_data?.dest_ip,
              },
              timestamp: Math.max(processEvent.timestamp, networkEvent.timestamp),
              confidence: 0.95,
            });
          }
        }
      }
    }

    return correlatedMatches;
  }

  /**
   * Pattern matching helper
   */
  private patternMatches(pattern: string, value: string): boolean {
    if (!value) return false;

    // Support wildcards and regex
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`, 'i');
      return regex.test(value);
    }

    return value.toLowerCase().includes(pattern.toLowerCase());
  }

  /**
   * Get nested property from object
   */
  private getNestedProperty(obj: any, path: string): any {
    if (!obj) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      current = current?.[part];
    }
    return current;
  }

  /**
   * Map severity level
   */
  private mapSeverityLevel(level: string): SeverityLevel {
    const map: Record<string, SeverityLevel> = {
      informational: SeverityLevel.INFO,
      low: SeverityLevel.LOW,
      medium: SeverityLevel.MEDIUM,
      high: SeverityLevel.HIGH,
      critical: SeverityLevel.CRITICAL,
    };
    return map[level] || SeverityLevel.MEDIUM;
  }

  /**
   * Get detection statistics
   */
  getStats() {
    return {
      total_detections: this.detections.size,
      sigma_rules: this.sigma_rules.size,
      yara_rules: this.yara_rules.size,
      anomaly_detectors: this.anomaly_models.size,
    };
  }
}

/**
 * Placeholder for anomaly detector (would use ML models)
 */
class AnomalyDetector {
  constructor(private modelName: string) {}

  score(event: TelemetryEvent): number {
    // Would use trained ML model
    return 0.5;
  }
}

export default DetectionEngine;
