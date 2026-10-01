import * as calendarService from '../services/calendar.service.js';
import { getRsvpedTmIds } from '../services/rsvp.service.js';
import { getFriendsCountMap } from '../utils/friendsCount.js';
import { createError } from '../middleware/errorHandler.js';
import ReminderSetting from '../models/ReminderSetting.js';

// GET /api/events/calendar?year=&month=&city=
export const getCalendarDates = async (req, res, next) => {
  try {
    const { year, month, city = '' } = req.query;
    if (!year || !month) throw createError('year and month query params are required', 400);

    const result = await calendarService.getCalendarDates({ year, month, city });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/date/:date?city=
export const getEventsByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { city = '' } = req.query;

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw createError('Date must be in YYYY-MM-DD format', 400);
    }

    const events = await calendarService.getEventsByDate({ date, city });

    // Enrich with isRsvped, friendsAttendingCount, hasReminder
    const tmIds = events.map((e) => e.tmId);
    const [rsvpedSet, friendsMap, reminders] = await Promise.all([
      getRsvpedTmIds(req.user?.id),
      getFriendsCountMap(tmIds),
      req.user?.id
        ? ReminderSetting.find({ user: req.user.id, tmId: { $in: tmIds }, enabled: true }).lean()
        : Promise.resolve([]),
    ]);
    const reminderSet = new Set(reminders.map((r) => r.tmId));

    const enriched = events.map((e) => ({
      ...e.toObject(),
      isRsvped: rsvpedSet.has(e.tmId),
      friendsAttendingCount: friendsMap.get(e.tmId) || 0,
      hasReminder: reminderSet.has(e.tmId),
    }));

    res.json({ success: true, date, data: enriched });
  } catch (err) {
    next(err);
  }
};
