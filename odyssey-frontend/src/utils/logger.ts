/**
 * Production-safe logging utility
 * Only logs in development environment
 */

const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development' || import.meta.env.DEV;

export const logger = {
  log: (...args: Parameters<typeof console.log>) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: Parameters<typeof console.error>) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  warn: (...args: Parameters<typeof console.warn>) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: Parameters<typeof console.info>) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

export default logger;
