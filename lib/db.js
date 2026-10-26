// lib/db.js
// PostgreSQL connection pool with pg client and helper transaction utilities
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/interntrack_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Execute a parameterized query against the PostgreSQL pool.
 * @param {string} text - SQL query with $1, $2 placeholders
 * @param {Array} params - Array of parameter values
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Logging queries in dev mode
  if (process.env.DEBUG_SQL === 'true') {
    console.log('[PG SQL]', { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
}

/**
 * Acquire a dedicated client for transactions or session-variable queries.
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Executes a function within a database transaction, automatically rolling back on error.
 * @param {Function} callback - async (client) => { ... }
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
};
