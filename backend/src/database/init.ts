import pool from '../config/database';
import fs from 'fs';
import path from 'path';

// Initialize database by reading and executing schema.sql file
export const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found at: ' + schemaPath);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Database tables initialized successfully');
    
  } catch (error: unknown) {
    console.error('Database initialization error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Close database connection pool gracefully
export const closeDatabase = async () => {
  await pool.end();
};

// Run initialization if file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}
