const fs = require('fs');
const path = require('path');

// Use absolute path for logs
const logDir = path.join(process.cwd(), 'logs');

console.log(`[Logger] Log directory path: ${logDir}`);

// Create logs directory synchronously
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
    console.log(`[Logger] Created logs directory at ${logDir}`);
  } else {
    console.log(`[Logger] Logs directory already exists at ${logDir}`);
  }
} catch (err) {
  console.error(`[Logger] ERROR creating logs directory: ${err.message}`);
  console.error(`[Logger] Stack: ${err.stack}`);
}

// Verify directory exists and is writable
try {
  if (fs.existsSync(logDir)) {
    fs.accessSync(logDir, fs.constants.W_OK);
    console.log(`[Logger] Logs directory is writable`);
  }
} catch (err) {
  console.error(`[Logger] Cannot write to logs directory: ${err.message}`);
}

const errorLogFile = path.join(logDir, 'error.log');
const infoLogFile = path.join(logDir, 'info.log');
const databaseLogFile = path.join(logDir, 'database.log');

function formatLog(level, message) {
  return `[${new Date().toISOString()}] [${level}] ${message}`;
}

function safeAppendFile(filePath, content) {
  try {
    fs.appendFileSync(filePath, content + '\n', { encoding: 'utf8', flag: 'a' });
  } catch (err) {
    console.error(`[Logger] Failed to write to ${filePath}: ${err.message}`);
  }
}

const logger = {
  error: (message, error = null) => {
    const log = error ? `${message}\n${error.stack || error}` : message;
    const formatted = formatLog('ERROR', log);
    safeAppendFile(errorLogFile, formatted);
    console.error(formatted);
  },

  info: (message) => {
    const formatted = formatLog('INFO', message);
    safeAppendFile(infoLogFile, formatted);
    console.log(formatted);
  },

  database: (message, query = null, params = null) => {
    let log = message;
    if (query) log += `\nQuery: ${query}`;
    if (params) log += `\nParams: ${JSON.stringify(params)}`;
    const formatted = formatLog('DATABASE', log);
    safeAppendFile(databaseLogFile, formatted);
  },

  warn: (message) => {
    const formatted = formatLog('WARN', message);
    safeAppendFile(infoLogFile, formatted);
    console.warn(formatted);
  }
};

module.exports = logger;
