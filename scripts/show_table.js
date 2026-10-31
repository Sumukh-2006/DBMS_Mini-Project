// scripts/show_table.js
// Utility script for DBMS Evaluator / Viva demonstration of SHOW CREATE TABLE in PostgreSQL
// Supports both Docker-based and direct PostgreSQL connections
const { execSync } = require('child_process');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const tableName = process.argv[2] || 'application';

console.log('='.repeat(80));
console.log(` INTERNTRACK — SCHEMA INSPECTION FOR TABLE: "${tableName}"`);
console.log('='.repeat(80));

// Detect connection mode: Docker container vs direct psql
let useDocker = false;
try {
  execSync('docker ps -q -f name=interntrack_postgres', { encoding: 'utf-8', stdio: 'pipe' }).trim();
  useDocker = true;
} catch {
  useDocker = false;
}

// Fallback: check if psql is available directly
let usePsql = false;
if (!useDocker) {
  try {
    execSync('psql --version', { encoding: 'utf-8', stdio: 'pipe' });
    usePsql = true;
  } catch {
    usePsql = false;
  }
}

// Build command prefix
function buildCmd(cmd) {
  if (useDocker) {
    return `docker exec interntrack_postgres ${cmd}`;
  } else if (usePsql) {
    // Parse DATABASE_URL for connection params
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/interntrack_db';
    return `psql "${dbUrl}" -c "${cmd.replace(/"/g, '\\"')}"`;
  }
  return null;
}

console.log(`\nConnection mode: ${useDocker ? 'Docker container' : usePsql ? 'Direct psql' : 'Node.js pg client'}\n`);

// Method 1: Use psql \d+ (Docker or direct)
if (useDocker || usePsql) {
  console.log('[1] PostgreSQL psql \\d+ Detailed Table Specification:');
  console.log('-'.repeat(80));

  try {
    let psqlCmd;
    if (useDocker) {
      psqlCmd = `docker exec interntrack_postgres psql -U postgres -d interntrack_db -c "\\d+ ${tableName}"`;
    } else {
      const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/interntrack_db';
      psqlCmd = `psql "${dbUrl}" -c "\\d+ ${tableName}"`;
    }
    const psqlOutput = execSync(psqlCmd, { encoding: 'utf-8' });
    console.log(psqlOutput);
  } catch (err) {
    console.error('Error querying psql:', err.message);
  }

  console.log('\n[2] Exact SQL DDL Statement (Equivalent of MySQL "SHOW CREATE TABLE"):');
  console.log('-'.repeat(80));

  try {
    let dumpCmd;
    if (useDocker) {
      dumpCmd = `docker exec interntrack_postgres pg_dump -U postgres -d interntrack_db --schema-only -t "${tableName}"`;
    } else {
      const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/interntrack_db';
      dumpCmd = `pg_dump "${dbUrl}" --schema-only -t "${tableName}"`;
    }
    const dumpOutput = execSync(dumpCmd, { encoding: 'utf-8' });

    const lines = dumpOutput
      .split('\n')
      .filter(
        (line) =>
          !line.startsWith('--') &&
          !line.startsWith('SET ') &&
          !line.startsWith('\\') &&
          !line.startsWith('SELECT ')
      )
      .join('\n')
      .trim();

    console.log(lines);
  } catch (err) {
    console.error('Error extracting schema DDL:', err.message);
  }
} else {
  // Fallback: Use Node.js pg client to query information_schema
  console.log('[1] Table Structure via information_schema (Node.js pg client):');
  console.log('-'.repeat(80));

  const { pool } = require('../lib/db');

  async function showTable() {
    try {
      const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [tableName]);

      if (cols.rows.length === 0) {
        console.log(`  Table "${tableName}" not found.`);
      } else {
        console.log(`  Columns for "${tableName}":`);
        for (const col of cols.rows) {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          console.log(`    ${col.column_name.padEnd(30)} ${col.data_type}${maxLen} ${nullable}${def}`);
        }
      }

      const constraints = await pool.query(`
        SELECT conname, contype, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = $1::regclass;
      `, [tableName]);

      if (constraints.rows.length > 0) {
        console.log(`\n  Constraints:`);
        for (const c of constraints.rows) {
          const type = { p: 'PRIMARY KEY', f: 'FOREIGN KEY', u: 'UNIQUE', c: 'CHECK' }[c.contype] || c.contype;
          console.log(`    ${c.conname.padEnd(45)} ${type}  ${c.definition}`);
        }
      }
    } catch (err) {
      console.error('Error:', err.message);
    } finally {
      await pool.end();
    }
  }

  showTable();
}

console.log('='.repeat(80));
