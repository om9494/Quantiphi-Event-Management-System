import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

const start = async () => {
  // Connect to MongoDB Atlas before accepting HTTP traffic
  await connectDB();

  app.listen(env.port, () => {
    console.log(`🚀  Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });
};

start();
