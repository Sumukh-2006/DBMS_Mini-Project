// scripts/migrate.js
// Runs all SQL migrations in order against the PostgreSQL database
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { pool } = require('../lib/db');

async function migrate() {
  console.log('--- Running InternTrack PostgreSQL Migrations ---');
  const migrationsDir = path.resolve(__dirname, '../db/migrations');
  const files = [
    '001_init.sql',
    '002_indexes.sql',
    '003_views.sql',
    '004_functions_triggers.sql',
    '005_alter_demo.sql'
  ];

  const client = await pool.connect();
  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Executing migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log(`✓ ${file} applied successfully.`);
    }
    console.log('--- All migrations applied successfully! ---');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
