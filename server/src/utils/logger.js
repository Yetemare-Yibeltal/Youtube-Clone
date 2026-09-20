const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const defaultLevel = () => {
  if (process.env.NODE_ENV === "test") return "error";
  return process.env.NODE_ENV === "production" ? "info" : "debug";
};

const threshold = () =>
  LEVELS[process.env.LOG_LEVEL] !== undefined
    ? process.env.LOG_LEVEL
    : defaultLevel();

const write = (level, message, meta) => {
  if (LEVELS[level] > LEVELS[threshold()]) return;

  const time = new Date().toISOString();
  const sink =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;

  if (process.env.NODE_ENV === "production") {
    const entry = { time, level, message };
    if (meta instanceof Error) {
      entry.error = meta.message;
      entry.stack = meta.stack;
    } else if (meta !== undefined) {
      entry.meta = meta;
    }
    sink(JSON.stringify(entry));
    return;
  }

  const detail =
    meta instanceof Error
      ? `\n${meta.stack}`
      : meta !== undefined
        ? ` ${JSON.stringify(meta)}`
        : "";
  sink(`${time} ${level.toUpperCase()} ${message}${detail}`);
};

export const logger = {
  error: (message, meta) => write("error", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  info: (message, meta) => write("info", message, meta),
  debug: (message, meta) => write("debug", message, meta),
};
