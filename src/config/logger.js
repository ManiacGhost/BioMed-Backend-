const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`Logs directory created at ${logDir}`);
  }
} catch (err) {
  console.error(`Failed to create logs directory: ${err.message}`);
}

const errorLogFile = path.join(logDir, 'error.log');
const infoLogFile = path.join(logDir, 'info.log');
const databaseLogFile = path.join(logDir, 'database.log');

function formatLog(level, message) {
  return `[${new Date().toISOString()}] [${level}] ${message}`;
}

function safeAppendFile(filePath, content) {
  try {
    fs.appendFileSync(filePath, content + '\n', { encoding: 'utf8' });
  } catch (err) {
    console.error(`Failed to write to ${filePath}: ${err.message}`);
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
