/**
 * Simple logging utility for the application
 * In production, this could be replaced with a more robust solution like Pino or Winston
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  stack?: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = (process.env.LOG_LEVEL || 'info').toUpperCase();

const LOG_LEVELS = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

function shouldLog(level: LogLevel): boolean {
  const currentLevel = LOG_LEVELS[logLevel as LogLevel] ?? LOG_LEVELS[LogLevel.INFO];
  return LOG_LEVELS[level] >= currentLevel;
}

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, data } = entry;

  let output = `[${timestamp}] ${level}: ${message}`;

  if (data && Object.keys(data).length > 0) {
    output += ` ${JSON.stringify(data)}`;
  }

  if (entry.stack && isDevelopment) {
    output += `\n${entry.stack}`;
  }

  return output;
}

function log(level: LogLevel, message: string, data?: Record<string, any>) {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };

  const formatted = formatLog(entry);

  switch (level) {
    case LogLevel.DEBUG:
      if (isDevelopment) {
        console.log(`\x1b[36m${formatted}\x1b[0m`); // Cyan
      }
      break;
    case LogLevel.INFO:
      console.log(`\x1b[32m${formatted}\x1b[0m`); // Green
      break;
    case LogLevel.WARN:
      console.warn(`\x1b[33m${formatted}\x1b[0m`); // Yellow
      break;
    case LogLevel.ERROR:
      console.error(`\x1b[31m${formatted}\x1b[0m`); // Red
      break;
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, any>) => {
    log(LogLevel.DEBUG, message, data);
  },

  info: (message: string, data?: Record<string, any>) => {
    log(LogLevel.INFO, message, data);
  },

  warn: (message: string, data?: Record<string, any>) => {
    log(LogLevel.WARN, message, data);
  },

  error: (message: string, error?: Error | Record<string, any>) => {
    const data = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
        }
      : error;

    log(LogLevel.ERROR, message, data as Record<string, any>);
  },
};

/**
 * Create a scoped logger for a specific module
 */
export function createLogger(scope: string) {
  return {
    debug: (message: string, data?: Record<string, any>) => {
      logger.debug(`[${scope}] ${message}`, data);
    },

    info: (message: string, data?: Record<string, any>) => {
      logger.info(`[${scope}] ${message}`, data);
    },

    warn: (message: string, data?: Record<string, any>) => {
      logger.warn(`[${scope}] ${message}`, data);
    },

    error: (message: string, error?: Error | Record<string, any>) => {
      logger.error(`[${scope}] ${message}`, error);
    },
  };
}
