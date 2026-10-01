// Thin controller — delegates all logic to reminder.service.js
import * as reminderService from '../services/reminder.service.js';

// PUT /api/reminders/:eventId
export const upsertReminder = async (req, res, next) => {
  try {
    const { remindBefore, enabled } = req.body;
    const setting = await reminderService.upsertReminder(
      req.user.id,
      req.params.eventId,
      { remindBefore, enabled }
    );
    res.json({ success: true, reminder: setting });
  } catch (err) {
    next(err);
  }
};

// GET /api/reminders
export const getUserReminders = async (req, res, next) => {
  try {
    const reminders = await reminderService.getUserReminders(req.user.id);
    res.json({ success: true, reminders });
  } catch (err) {
    next(err);
  }
};

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await reminderService.getNotifications(req.user.id);
    // Mark as read after returning — fire-and-forget style
    reminderService.markNotificationsRead(req.user.id).catch(() => {});
    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};
