// Events controller — thin layer between routes and services.
// ALL filtering, counting, and grouping happens in services/utils, not here.

import * as tmService from '../services/ticketmaster.service.js';
import { getRsvpedTmIds } from '../services/rsvp.service.js';
import { getFriendsCountMap } from '../utils/friendsCount.js';
import { createError } from '../middleware/errorHandler.js';

// Attach per-event metadata (isRsvped, friendsAttendingCount) to each event
const enrichEvents = async (events, userId) => {
  const tmIds = events.map((e) => e.tmId);
  const [rsvpedSet, friendsMap] = await Promise.all([
    getRsvpedTmIds(userId),
    getFriendsCountMap(tmIds),
  ]);

  return events.map((e) => ({
    ...( e.toObject ? e.toObject() : e ),   // handle both Mongoose docs and plain objects
    isRsvped: rsvpedSet.has(e.tmId),
    friendsAttendingCount: friendsMap.get(e.tmId) || 0,
    hasReminder: false, // populated properly in the reminders commit
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
