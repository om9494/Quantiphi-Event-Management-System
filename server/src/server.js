import http from 'http';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { initSocket } from './socket.js';
import { startReminderCron } from './jobs/reminderCron.js';

const start = async () => {
  // Connect to MongoDB Atlas before accepting HTTP traffic
  await connectDB();

  // Wrap Express app in a native HTTP server so Socket.io can share the same port
  const httpServer = http.createServer(app);

  // Attach Socket.io — must happen before httpServer.listen()
  initSocket(httpServer);

  // Start the reminder cron job (runs every minute)
  startReminderCron();

  httpServer.listen(env.port, () => {
    console.log(`🚀  Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });
};

start();
