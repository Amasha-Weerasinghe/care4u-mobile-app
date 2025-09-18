import dotenv from 'dotenv';
import path from 'path';

// Configure environment variables first, before other imports
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
dotenv.config({ path: path.join(__dirname, '../', envFile) });

import express from 'express';
import { initializeDatabase } from './database/init';
import { testConnection } from './config/database';
import authRoutes from './routes/auth';
import mealRoutes from './routes/meals';
import sugarRoutes from './routes/sugar';
import exerciseRoutes from './routes/exercise';
import appointmentRoutes from './routes/appointments';
import mealRecommendationRoutes from './routes/mealRecommendations';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/sugar', sugarRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/meal-recommendations', mealRecommendationRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Database health check route
app.get('/health/db', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      success: dbConnected,
      message: dbConnected ? 'Database is connected' : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Show database connection info
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const url = new URL(dbUrl);
        const maskedUrl = `${url.protocol}//${url.username}:***@${url.hostname}${url.port ? ':' + url.port : ''}${url.pathname}`;
        console.log('Database:', maskedUrl);
      } catch (e) {
        console.log('Database: Invalid URL format');
      }
    } else {
      console.log('Database: Not configured');
    }
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize database tables
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Set up periodic database health checks
    setInterval(async () => {
      try {
        const isConnected = await testConnection(1);
        if (!isConnected) {
          console.warn('Database connection health check failed');
        }
      } catch (error) {
        console.error('Database health check error:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

  } catch (error) {
    console.error('Server startup failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

startServer();

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

