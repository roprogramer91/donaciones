// Simple migration runner: executes .sql files in back/db/migrations in lexical order
const fs = require('fs');
const path = require('path');
const pool = require('../data/config');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
}

async function appliedMigrations() {
  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  return new Set(rows.map(r => r.name));
}

async function applyMigration(filePath, name) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations(name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
    await pool.query('COMMIT');
    console.log(`Applied: ${name}`);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(`Failed migration ${name}:`, err.message);
    process.exitCode = 1;
  }
}

async function run() {
  const dir = path.join(__dirname, 'migrations');
  await ensureMigrationsTable();
  const done = await appliedMigrations();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (!done.has(f)) {
      await applyMigration(path.join(dir, f), f);
    } else {
      console.log(`Skipping (already applied): ${f}`);
    }
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

