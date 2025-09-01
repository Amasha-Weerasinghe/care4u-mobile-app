import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 60000,
  max: 10,
  min: 2,
});

// Connection event handlers
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
});

// Monitor pool status
setInterval(() => {
  const poolStatus = {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };

  if (poolStatus.waitingCount > 0) {
    console.warn('Database pool has waiting connections:', poolStatus);
  }

  if (poolStatus.totalCount >= poolStatus.idleCount + 5) {
    console.warn('Database pool is getting busy:', poolStatus);
  }
}, 30000);

// Test connection function
export const testConnection = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      return true;
    } catch (error) {
      console.error(
        `Database connection test failed (attempt ${i + 1}/${retries}):`,
        error instanceof Error ? error.message : String(error)
      );
      if (i === retries - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
};

export const executeQuery = async <T = any>(
  query: string,
  params: any[] = [],
  retries = 3
): Promise<T[]> => {
  let client;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      client = await pool.connect();
      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Query failed (attempt ${attempt}/${retries}):`, lastError.message);

      if (attempt === retries) {
        throw lastError;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  throw lastError || new Error('Query failed after all retries');
};

export default pool;
