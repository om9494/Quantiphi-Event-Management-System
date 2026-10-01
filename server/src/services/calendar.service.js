// Calendar service — all date-grouping logic lives here on the server.
// The frontend receives a plain list of dates; it only highlights them.
// No date math or grouping should happen in the browser.

import Event from '../models/Event.js';
import * as tmService from './ticketmaster.service.js';

// ── GET /api/events/calendar?year=&month=&city= ───────────────────────────
// Returns: { dates: { "YYYY-MM-DD": count, ... } }
// Steps:
//  1. Ensure cache has events for this month by triggering a TM fetch (best-effort)
//  2. Query MongoDB for events in the month range, group by localDate server-side
export const getCalendarDates = async ({ year, month, city = '' }) => {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10); // 1-based

  // Build UTC date range for the full month
  const startOfMonth = new Date(Date.UTC(y, m - 1, 1));
  const endOfMonth   = new Date(Date.UTC(y, m, 1));    // exclusive upper bound

  // Best-effort: refresh cache from Ticketmaster for this city/month
  // We don't await deeply — if TM fails, MongoDB cache still answers
  try {
    await tmService.fetchAndCacheEvents({ city, size: 200, page: 0 });
  } catch {
    // Swallow; fall through to cache query
  }

  const filter = {
    startDate: { $gte: startOfMonth, $lt: endOfMonth },
  };
  if (city) filter.city = { $regex: new RegExp(city, 'i') };

  // Aggregate: group by localDate, count events per date
  const grouped = await Event.aggregate([
    { $match: filter },
    { $group: { _id: '$localDate', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Build a dictionary { "YYYY-MM-DD": count }
  const dates = {};
  for (const { _id, count } of grouped) {
    if (_id) dates[_id] = count;
  }

  return { year: y, month: m, city, dates };
};

// ── GET /api/events/date/:date?city= ────────────────────────────────────────
// Returns all events on a specific YYYY-MM-DD, enriched with RSVP/friends data
export const getEventsByDate = async ({ date, city = '' }) => {
  const filter = { localDate: date };
  if (city) filter.city = { $regex: new RegExp(city, 'i') };

  const events = await Event.find(filter).sort({ startDate: 1 });
  return events;
};
