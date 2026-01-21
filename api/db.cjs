const { Pool } = require("pg");

let pool;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
      max: Number(process.env.PGPOOL_MAX || 5),
      idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_MS || 30000),
      connectionTimeoutMillis: Number(process.env.PGPOOL_CONN_TIMEOUT_MS || 5000),
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL not set");
  return p.query(text, params);
}

module.exports = { getPool, query };
