// Reminder service — all reminder business logic lives here.
// Controller just calls these functions and sends HTTP responses.

import ReminderSetting, { ALLOWED_REMIND_BEFORE } from '../models/ReminderSetting.js';
import Notification from '../models/Notification.js';
import Rsvp from '../models/Rsvp.js';
import Event from '../models/Event.js';
import { createError } from '../middleware/errorHandler.js';

// PUT /reminders/:eventId — create or update a reminder setting.
// Rules enforced here (server-side):
//  1. User must have an active RSVP for the event.
//  2. remindBefore must be one of the allowed values.
//  3. The computed reminder time must not already be in the past.
export const upsertReminder = async (userId, tmId, { remindBefore, enabled = true }) => {
  // Rule 1: must have RSVPed
  const rsvp = await Rsvp.findOne({ user: userId, tmId });
  if (!rsvp) throw createError('You must RSVP to an event before setting a reminder', 403);

  // Rule 2: allowed values
  if (!ALLOWED_REMIND_BEFORE.includes(Number(remindBefore))) {
    throw createError(
      `remindBefore must be one of: ${ALLOWED_REMIND_BEFORE.join(', ')} (minutes)`,
      422
    );
  }

  // Rule 3: reminder time must be in the future
  const event = await Event.findOne({ tmId });
  if (event?.startDate) {
    const reminderFiresAt = new Date(event.startDate.getTime() - remindBefore * 60 * 1000);
    if (reminderFiresAt <= new Date()) {
      throw createError('Reminder time is already in the past', 422);
    }
  }

  // Upsert (idempotent) — changing the interval resets `sent` to false
  const setting = await ReminderSetting.findOneAndUpdate(
    { user: userId, tmId },
    { user: userId, tmId, remindBefore: Number(remindBefore), enabled, sent: false },
    { upsert: true, new: true }
  );
  return setting;
};

// GET /reminders — all reminder settings for the logged-in user
export const getUserReminders = async (userId) => {
  return ReminderSetting.find({ user: userId }).lean();
};

// Called by the cron job every minute.
// Finds reminders whose fire-time (event.startDate - remindBefore) has passed,
// creates an in-app Notification, and marks them as sent.
export const processDueReminders = async () => {
  const now = new Date();

  // Find all unsent, enabled reminders
  const pending = await ReminderSetting.find({ sent: false, enabled: true }).lean();
  if (!pending.length) return [];

  const tmIds = [...new Set(pending.map((r) => r.tmId))];
  const events = await Event.find({ tmId: { $in: tmIds } }).lean();
  const eventMap = new Map(events.map((e) => [e.tmId, e]));

  const due = [];
  for (const reminder of pending) {
    const event = eventMap.get(reminder.tmId);
    if (!event?.startDate) continue;

    const fireAt = new Date(new Date(event.startDate).getTime() - reminder.remindBefore * 60 * 1000);
    if (fireAt <= now) {
      due.push({ reminder, event });
    }
  }

  if (!due.length) return [];

  // Create notifications in bulk
  const notifications = await Notification.insertMany(
    due.map(({ reminder, event }) => ({
      user: reminder.user,
      tmId: reminder.tmId,
      message: `Reminder: "${event.title}" starts in ${reminder.remindBefore} minutes!`,
    })),
    { ordered: false } // don't stop on a duplicate; continue inserting others
  );

  // Mark the processed reminders as sent
  const dueIds = due.map(({ reminder }) => reminder._id);
  await ReminderSetting.updateMany({ _id: { $in: dueIds } }, { sent: true });

  return notifications;
};

// GET /notifications — unread in-app notifications for the user
export const getNotifications = async (userId) => {
  return Notification.find({ user: userId, read: false }).sort({ createdAt: -1 }).lean();
};

// Mark notifications as read (called after frontend fetches them)
export const markNotificationsRead = async (userId) => {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
};
