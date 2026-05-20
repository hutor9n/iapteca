import mongoose from 'mongoose';
import { logger } from './logger';
import { metrics } from './metrics';

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iapteca');
    metrics.setGauge('db_connection_status', 1);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('db.connection_failed', { error_message: errorMessage });
    metrics.setGauge('db_connection_status', 0);
    throw error;
  }
};

export * from './models';
