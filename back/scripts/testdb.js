// En este script pruebo la conexion directa a la base
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Conexion exitosa:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error al conectar:', error.message);
    process.exit(1);
  }
})();
