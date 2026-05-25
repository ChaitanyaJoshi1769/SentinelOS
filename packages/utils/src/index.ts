/**
 * Utils Package
 * Common utility functions used across SentinelOS
 */

// Formatting utilities
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDurationMs,
  formatInvestigationTime,
  formatPercent,
  formatNumber,
  formatRiskScore,
  formatConfidence,
} from './formatting';

// Severity and risk utilities
export {
  getSeverityColor,
  getSeverityBadgeClass,
  calculateRiskScore,
  getOverallSeverity,
  compareSeverity,
  isCriticalOrHigh,
  getRiskLevel,
  SEVERITY_LEVELS,
  type Severity,
} from './severity';

// Helper utilities
export {
  groupBy,
  countBy,
  unique,
  difference,
  intersection,
  flatten,
  chunk,
  deepMerge,
  omit,
  pick,
  delay,
  retry,
} from './helpers';
