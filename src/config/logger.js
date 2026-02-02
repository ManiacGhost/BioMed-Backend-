const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const errorLogFile = path.join(logDir, 'error.log');
const infoLogFile = path.join(logDir, 'info.log');
const databaseLogFile = path.join(logDir, 'database.log');

function formatLog(level, message) {
  return `[${new Date().toISOString()}] [${level}] ${message}`;
}

const logger = {
  error: (message, error = null) => {
    const log = error ? `${message}\n${error.stack || error}` : message;
    const formatted = formatLog('ERROR', log);
    fs.appendFileSync(errorLogFile, formatted + '\n');
    console.error(formatted);
  },

  info: (message) => {
    const formatted = formatLog('INFO', message);
    fs.appendFileSync(infoLogFile, formatted + '\n');
    console.log(formatted);
  },

  database: (message, query = null, params = null) => {
    let log = message;
    if (query) log += `\nQuery: ${query}`;
    if (params) log += `\nParams: ${JSON.stringify(params)}`;
    const formatted = formatLog('DATABASE', log);
    fs.appendFileSync(databaseLogFile, formatted + '\n');
  },

  warn: (message) => {
    const formatted = formatLog('WARN', message);
    fs.appendFileSync(infoLogFile, formatted + '\n');
    console.warn(formatted);
  }
};

module.exports = logger;
