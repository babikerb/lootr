import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log("[DEBUG] Checking DATABASE_URL...");
if (!process.env.DATABASE_URL) {
  console.log("ERROR: DATABASE_URL is UNDEFINED! The .env file is not loading.");
} else {
  console.log("DATABASE_URL found!");
}

const { Pool } = pg;

// Create a new Pool using your Neon connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

// check to verify the connection when the server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('[DB] Error connecting to Neon Postgres:', err.stack);
  } else {
    console.log('[DB] Successfully connected to Neon Postgres Database!');
    release(); 
  }
});

export default pool;