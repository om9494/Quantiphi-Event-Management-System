// RSVP service — all RSVP business logic on the server.
// No duplicate-checking, sorting, or "upcoming/past" splitting in the client.

import Rsvp from '../models/Rsvp.js';
import Event from '../models/Event.js';
import * as tmService from './ticketmaster.service.js';
import { getFriendsCountMap } from '../utils/friendsCount.js';
import { createError } from '../middleware/errorHandler.js';

// Returns a Set of tmIds the given user has RSVPed to (used by events feed)
export const getRsvpedTmIds = async (userId) => {
  if (!userId) return new Set();
  const rsvps = await Rsvp.find({ user: userId }).select('tmId').lean();
  return new Set(rsvps.map((r) => r.tmId));
};

// POST /rsvps — idempotent: calling twice returns the same doc, no 409
export const createRsvp = async (userId, tmId) => {
  // Ensure the event exists in our cache (upsert from TM if not)
  let event = await Event.findOne({ tmId });
  if (!event) {
    event = await tmService.getEventById(tmId);
    if (!event) throw createError('Event not found', 404);
  }

  // findOneAndUpdate with upsert is atomic — no race-condition duplicates
  const rsvp = await Rsvp.findOneAndUpdate(
    { user: userId, tmId },
    { user: userId, tmId, status: 'going' },
    { upsert: true, new: true }
  );
  return { rsvp, event };
};

// DELETE /rsvps/:eventId
export const deleteRsvp = async (userId, tmId) => {
  const rsvp = await Rsvp.findOneAndDelete({ user: userId, tmId });
  if (!rsvp) throw createError('RSVP not found', 404);
  return rsvp;
};

// GET /rsvps — user's confirmed events, split into upcoming/past by the server
export const getUserRsvps = async (userId) => {
  const rsvps = await Rsvp.find({ user: userId }).lean();
  if (!rsvps.length) return { upcoming: [], past: [] };

  const tmIds = rsvps.map((r) => r.tmId);

  // Fetch full event objects from cache
  const events = await Event.find({ tmId: { $in: tmIds } }).lean();
  const eventMap = new Map(events.map((e) => [e.tmId, e]));

  // Friends counts for all RSVPed events in one aggregation
  const friendsMap = await getFriendsCountMap(tmIds);

  const now = new Date();
  const upcoming = [];
  const past = [];

  for (const rsvp of rsvps) {
    const event = eventMap.get(rsvp.tmId);
    if (!event) continue; // event was purged from cache; skip

    const enriched = {
      ...event,
      rsvpId: rsvp._id,
      rsvpCreatedAt: rsvp.createdAt,
      friendsAttendingCount: friendsMap.get(rsvp.tmId) || 0,
      isRsvped: true,
    };

    // Server decides upcoming vs past — no date logic in the client
    if (event.startDate && new Date(event.startDate) >= now) {
      upcoming.push(enriched);
    } else {
      past.push(enriched);
    }
  }

  // Sort upcoming ascending, past descending
  upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  past.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  return { upcoming, past };
};
