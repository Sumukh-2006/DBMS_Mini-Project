// scripts/show_table.js
// Utility script for DBMS Evaluator / Viva demonstration of SHOW CREATE TABLE in PostgreSQL
const { execSync } = require('child_process');

const tableName = process.argv[2] || 'application';

console.log('='.repeat(80));
console.log(` INTERNTRACK — SCHEMA INSPECTION FOR TABLE: "${tableName}"`);
console.log('='.repeat(80));
console.log('\n[1] PostgreSQL psql \\d+ Detailed Table Specification:');
console.log('-'.repeat(80));

try {
  const psqlOutput = execSync(
    `docker exec interntrack_postgres psql -U postgres -d interntrack_db -c "\\d+ ${tableName}"`,
    { encoding: 'utf-8' }
  );
  console.log(psqlOutput);
} catch (err) {
  console.error('Error querying psql:', err.message);
}

console.log('\n[2] Exact SQL DDL Statement (Equivalent of MySQL "SHOW CREATE TABLE"):');
console.log('-'.repeat(80));

try {
  const dumpOutput = execSync(
    `docker exec interntrack_postgres pg_dump -U postgres -d interntrack_db --schema-only -t "${tableName}"`,
    { encoding: 'utf-8' }
  );

  // Filter out comments and transaction header lines to show clean CREATE TABLE DDL
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

console.log('='.repeat(80));
