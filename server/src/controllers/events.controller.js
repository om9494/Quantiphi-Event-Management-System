// Events controller — thin layer between routes and services.
// ALL filtering, counting, and grouping happens in services/utils, not here.

import * as tmService from '../services/ticketmaster.service.js';
import { getRsvpedTmIds } from '../services/rsvp.service.js';
import { getFriendsCountMap } from '../utils/friendsCount.js';
import { createError } from '../middleware/errorHandler.js';
import ReminderSetting from '../models/ReminderSetting.js';

// Returns a Set of tmIds that have an active reminder for the user
const getReminderTmIds = async (userId) => {
  if (!userId) return new Set();
  const settings = await ReminderSetting.find({ user: userId, enabled: true }).select('tmId').lean();
  return new Set(settings.map((s) => s.tmId));
};

// Attach per-event metadata (isRsvped, friendsAttendingCount, hasReminder) to each event
const enrichEvents = async (events, userId) => {
  const tmIds = events.map((e) => e.tmId);
  const [rsvpedSet, friendsMap, reminderSet] = await Promise.all([
    getRsvpedTmIds(userId),
    getFriendsCountMap(tmIds),
    getReminderTmIds(userId),
  ]);

  return events.map((e) => ({
    ...( e.toObject ? e.toObject() : e ),   // handle both Mongoose docs and plain objects
    isRsvped: rsvpedSet.has(e.tmId),
    friendsAttendingCount: friendsMap.get(e.tmId) || 0,
    hasReminder: reminderSet.has(e.tmId),
  }));
};

// GET /api/events?city=&keyword=&category=&page=&size=
export const getEvents = async (req, res, next) => {
  try {
    const { city = '', keyword = '', category = '', page = 0, size = 20 } = req.query;
    const { events, totalPages, fromCache } = await tmService.fetchAndCacheEvents({
      city,
      keyword,
      category,
      page: Number(page),
      size: Number(size),
    });

    const enriched = await enrichEvents(events, req.user?.id);
    res.json({ success: true, data: enriched, totalPages, fromCache });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:id
export const getEventById = async (req, res, next) => {
  try {
    const event = await tmService.getEventById(req.params.id);
    if (!event) throw createError('Event not found', 404);

    const [enriched] = await enrichEvents([event], req.user?.id);
    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};
