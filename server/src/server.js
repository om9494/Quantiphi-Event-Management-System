import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { startReminderCron } from './jobs/reminderCron.js';

const start = async () => {
  // Connect to MongoDB Atlas before accepting HTTP traffic
  await connectDB();

  // Start the reminder cron job (runs every minute)
  startReminderCron();

  app.listen(env.port, () => {
    console.log(`🚀  Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });
};

start();
