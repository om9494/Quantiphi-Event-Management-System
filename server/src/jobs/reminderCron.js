// Reminder cron job — runs every minute, finds due reminders,
// creates in-app notifications, and marks reminders as sent.
// Imported once in server.js; runs in the same process as the API.

import cron from 'node-cron';
import { processDueReminders } from '../services/reminder.service.js';

export const startReminderCron = () => {
  // '* * * * *' = every minute
  cron.schedule('* * * * *', async () => {
    try {
      const fired = await processDueReminders();
      if (fired.length) {
        console.log(`🔔  Reminder cron: dispatched ${fired.length} notification(s)`);
      }
    } catch (err) {
      // Never let the cron crash the process
      console.error('⚠️  Reminder cron error:', err.message);
    }
  });

  console.log('⏰  Reminder cron job started (every minute)');
};
