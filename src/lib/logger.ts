/**
 * Logger utility that only shows detailed logs in development
 * and minimal/safe logs in production
 */

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// Types for our logger
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  level?: LogLevel;
  safe?: boolean; // If true, log even in production (but without sensitive data)
}

/**
 * Main logging function
 * @param message - The message to log
 * @param data - Optional data to log (will be stripped in production)
 * @param options - Logging options
 */
export const log = (message: string, data?: any, options: LogOptions = {}) => {
  const { level = 'info', safe = false } = options;
  
  // In production, only log safe messages and only errors/warnings
  if (!isDevelopment) {
    // Only log safe messages or errors/warnings
    if (safe || level === 'error' || level === 'warn') {
      // For production, strip sensitive data
      console[level](`[APP] ${message}`);
    }
    return;
  }
  
  // In development, log everything with full details
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data !== undefined) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
};

/**
 * Debug logging (only in development)
 */
export const debug = (message: string, data?: any) => {
  log(message, data, { level: 'debug' });
};

/**
 * Info logging
 */
export const info = (message: string, data?: any, safe: boolean = false) => {
  log(message, data, { level: 'info', safe });
};

/**
 * Warning logging
 */
export const warn = (message: string, data?: any) => {
  log(message, data, { level: 'warn', safe: true });
};

/**
 * Error logging
 */
export const error = (message: string, data?: any) => {
  log(message, data, { level: 'error', safe: true });
};

/**
 * Safe logging for production (minimal information)
 */
export const safe = (message: string) => {
  log(message, undefined, { level: 'info', safe: true });
};

export default {
  debug,
  info,
  warn,
  error,
  safe,
  log
};