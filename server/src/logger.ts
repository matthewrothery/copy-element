/**
 * Minimal logger wrapper. Swap implementation later for structured logging.
 */
export const logger = {
  log: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
