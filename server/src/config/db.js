import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    // useNewUrlParser / useUnifiedTopology are defaults in Mongoose 8+
    const conn = await mongoose.connect(env.mongodbUri);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1); // crash fast — nothing works without a DB
  }
};
