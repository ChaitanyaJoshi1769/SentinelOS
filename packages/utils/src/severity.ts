/**
 * Severity & Risk Scoring Utilities
 * Functions for calculating and comparing severity levels and risk scores
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Severity levels with numeric values for comparison
 */
export const SEVERITY_LEVELS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

/**
 * Get color for severity level
 */
export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'base-content';
  }
}

/**
 * Get badge class for severity
 */
export function getSeverityBadgeClass(severity: Severity): string {
  return `badge-${getSeverityColor(severity)}`;
}

/**
 * Calculate risk score based on multiple factors
 */
export function calculateRiskScore(factors: {
  compromised?: boolean;
  connections?: number;
  severity?: Severity;
  confidence?: number;
}): number {
  let score = 0;

  if (factors.compromised) {
    score += 40;
  }

  if (factors.connections && factors.connections > 0) {
    score += Math.min(factors.connections * 5, 30);
  }

  if (factors.severity) {
    const severityScore = (SEVERITY_LEVELS[factors.severity] / 4) * 20;
    score += severityScore;
  }

  if (factors.confidence && factors.confidence > 0) {
    score += factors.confidence * 10;
  }

  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Get overall severity from array of severities
 */
export function getOverallSeverity(severities: Severity[]): Severity {
  const maxLevel = Math.max(...severities.map((s) => SEVERITY_LEVELS[s]));
  const levelEntries = Object.entries(SEVERITY_LEVELS);
  const foundEntry = levelEntries.find(([, value]) => value === maxLevel);
  return (foundEntry?.[0] as Severity) || 'low';
}

/**
 * Compare two severity levels
 */
export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_LEVELS[b] - SEVERITY_LEVELS[a];
}

/**
 * Check if a severity is critical or high
 */
export function isCriticalOrHigh(severity: Severity): boolean {
  return severity === 'critical' || severity === 'high';
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): { level: Severity; icon: string } {
  if (score >= 80) {
    return { level: 'critical', icon: '🔴' };
  }
  if (score >= 60) {
    return { level: 'high', icon: '🟠' };
  }
  if (score >= 40) {
    return { level: 'medium', icon: '🟡' };
  }
  return { level: 'low', icon: '🟢' };
}
