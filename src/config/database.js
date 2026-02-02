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
  host: "82.25.121.170",
  user: "u309740424_lmsmaindb",
  password: "Pdigi#123",
  database: "u309740424_lmsmaindb",
  port: "3306",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Log database connection attempts
logToFile(`Database pool created for host: 82.25.121.170`);
console.log(`[Database] Initialized pool for MySQL database`);

pool.on('error', (err) => {
  logToFile(`DATABASE ERROR: ${err.message}`);
  console.error('[Database Error]', err.message);
});

pool.on('connection', (connection) => {
  logToFile('New connection established');
  console.log('[Database] Connection established');
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    logToFile('✓ Database connection successful');
    console.log('✓ [Database] Connection test passed');
    await connection.ping();
    connection.release();
  } catch (err) {
    logToFile(`✗ Database connection failed: ${err.message}`);
    console.error('✗ [Database] Connection test failed:', err.message);
  }
})();

module.exports = pool;