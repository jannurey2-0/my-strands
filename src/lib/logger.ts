const isDevelopment = typeof process !== 'undefined' 
  ? process.env.NODE_ENV === 'development' 
  : typeof import.meta !== 'undefined' && import.meta.env?.DEV;

const log = (message: string, data?: any, options: { level?: string; safe?: boolean } = {}) => {
  const { level = "info", safe: safe2 = false } = options;
  
  if (!isDevelopment) {
    if (safe2 || level === "error" || level === "warn") {
      console[level](`[APP] ${message}`);
    }
    return;
  }
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data !== undefined) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
};

const debug = (message: string, data?: any) => {
  log(message, data, { level: "debug" });
};

const info = (message: string, data?: any, safe: boolean = false) => {
  log(message, data, { level: "info", safe });
};

const warn = (message: string, data?: any) => {
  log(message, data, { level: "warn", safe: true });
};

const error = (message: string, data?: any) => {
  log(message, data, { level: "error", safe: true });
};

const safe = (message: string) => {
  log(message, undefined, { level: "info", safe: true });
};

export default {
  debug,
  info,
  warn,
  error,
  safe,
  log
};

export {
  debug,
  info,
  warn,
  error,
  safe,
  log
};