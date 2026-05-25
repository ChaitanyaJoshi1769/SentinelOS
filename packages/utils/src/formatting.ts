import { format, formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';

/**
 * Formatting Utilities
 * Common formatting functions for dates, times, and numbers
 */

/**
 * Format a timestamp as a readable date string
 */
export function formatDate(timestamp: number, formatStr = 'MMM dd, yyyy'): string {
  return format(new Date(timestamp), formatStr);
}

/**
 * Format a timestamp as time with date
 */
export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
}

/**
 * Format a timestamp as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Format duration in milliseconds to readable string
 */
export function formatDurationMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format investigation time in minutes to readable string
 */
export function formatInvestigationTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a large number with thousands separator
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format risk score (0-100) with color-coded status
 */
export function formatRiskScore(score: number): { value: string; severity: string } {
  const severity = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
  return {
    value: `${score.toFixed(0)}%`,
    severity,
  };
}

/**
 * Format confidence score (0-1) as percentage
 */
export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}
