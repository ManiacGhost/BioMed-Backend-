const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Create a simple log function that writes directly
const logToFile = (msg) => {
  try {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(path.join(process.cwd(), 'database.log'), logLine);
  } catch (err) {
    console.error('Failed to log:', err.message);
  }
};

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Log database connection attempts
logToFile(`Database pool created for host: ${process.env.DB_HOST}`);
console.log(`[Database] Initialized pool for ${process.env.DB_HOST}`);

pool.on('error', (err) => {
  logToFile(`DATABASE ERROR: ${err.message}`);
  console.error('[Database Error]', err.message);
});

pool.on('connection', (connection) => {
  logToFile('New connection established');
});

module.exports = pool;