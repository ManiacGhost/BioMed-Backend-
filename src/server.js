require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Simple direct logging - bypasses logger module issues
const logFileRoot = path.join(process.cwd(), 'app.log');

function directLog(message) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${message}`;
  console.log(logMsg);
  try {
    fs.appendFileSync(logFileRoot, logMsg + '\n', { encoding: 'utf8' });
  } catch (err) {
    console.error(`Failed to write log: ${err.message}`);
  }
}

directLog('=== APPLICATION STARTING ===');
directLog(`Working directory: ${process.cwd()}`);
directLog(`Node environment: ${process.env.NODE_ENV}`);

// Now load logger
const logger = require('./config/logger');
logger.info('Logger module initialized');

const logFile = path.join(__dirname, 'server.log');

function logToFile(message) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}

// Catch crashes
process.on('uncaughtException', (err) => {
  const msg = `UNCAUGHT EXCEPTION:\n${err.stack || err}\n`;
  logToFile(msg);
  directLog(msg);
  logger.error('Uncaught Exception', err);
});

process.on('unhandledRejection', (err) => {
  const msg = `UNHANDLED REJECTION:\n${err}\n`;
  logToFile(msg);
  directLog(msg);
  logger.error('Unhandled Rejection', err);
});
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use(`/api/${API_VERSION}/health`, require('./routes/health'));
app.use(`/api/${API_VERSION}/courses`, require('./routes/courses'));
app.use(`/api/${API_VERSION}/blogs`, require('./routes/blogs'));
app.use(`/api/${API_VERSION}/images`, require('./routes/images'));
app.use(`/api/${API_VERSION}/users`, require('./routes/users'));
app.use(`/api/${API_VERSION}/newsletter`, require('./routes/newsletter'));
app.use(`/api/${API_VERSION}/contact`, require('./routes/contact'));

// Error handling middleware
app.use((err, req, res, next) => {
  const errorMsg = `EXPRESS ERROR:\n${err.stack || err}\n`;
  logToFile(errorMsg);
  directLog(errorMsg);
  logger.error('Express Error', err);
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

app.listen(PORT, () => {
  const startupMsg = `Server started on port ${PORT}`;
  logToFile(startupMsg);
  directLog(startupMsg);
  directLog(`API Version: ${API_VERSION}`);
  directLog(`Environment: ${process.env.NODE_ENV}`);
  directLog(`Log file: ${logFileRoot}`);
  logger.info(startupMsg);
  logger.info(`API Version: ${API_VERSION}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USERNAME:", process.env.DB_USERNAME);
console.log("DB_PASSWORD exists:", !!process.env.DB_PASSWORD);
console.log("DB_DATABASE:", process.env.DB_DATABASE);