require('dotenv').config();

// Initialize logger FIRST before anything else
const logger = require('./config/logger');

const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'server.log');

function logToFile(message) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}

// Catch crashes
process.on('uncaughtException', (err) => {
  logToFile('UNCAUGHT EXCEPTION:\n' + err.stack + '\n');
});

process.on('unhandledRejection', (err) => {
  logToFile('UNHANDLED REJECTION:\n' + err + '\n');
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
  logToFile(`EXPRESS ERROR:\n${err.stack}\n`);
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

app.use(cors());

app.listen(PORT, () => {
  const startupMsg = `Server started on port ${PORT}`;
  logToFile(startupMsg);
  logger.info(startupMsg);
  logger.info(`API Version: ${API_VERSION}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Logs directory: ${path.join(__dirname, 'logs')}`);
});
