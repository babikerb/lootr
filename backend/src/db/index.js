import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Neon serverless connection
// Make sure you have DATABASE_URL="your-neon-postgres-string" in your .env file
export const sql = neon(process.env.NEON_API_URL);

// Example test query you can use later:
// const result = await sql`SELECT version()`;