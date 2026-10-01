// Ticketmaster Discovery API v2 integration.
// API key is server-side only — never sent to or used by the browser.
// Normalises the raw TM payload into our Event schema shape,
// then upserts into MongoDB so the DB acts as a cache.

import axios from 'axios';
import Event from '../models/Event.js';
import { env } from '../config/env.js';

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';

// ── Normalise one Ticketmaster event object into our schema ────────────────
const normalise = (tmEvent) => {
  // Pull the first image with ratio 16_9 and width>=640, or just the first image
  const images = tmEvent.images || [];
  const img =
    images.find((i) => i.ratio === '16_9' && i.width >= 640) ||
    images[0] ||
    {};

  // Venue details are nested under _embedded.venues[0]
  const venue = tmEvent._embedded?.venues?.[0] || {};
  const city = venue.city?.name || tmEvent.city || '';
  const address = [venue.address?.line1, venue.address?.line2]
    .filter(Boolean)
    .join(', ');

  // Dates
  const dates = tmEvent.dates?.start || {};
  const startDate = dates.dateTime ? new Date(dates.dateTime) : null;

  // Classification → category
  const segment = tmEvent.classifications?.[0]?.segment?.name || 'other';

  return {
    tmId: tmEvent.id,
    title: tmEvent.name,
    venueName: venue.name || '',
    city,
    address,
    startDate,
    localDate: dates.localDate || '',
    localTime: dates.localTime || '',
    imageUrl: img.url || '',
    url: tmEvent.url || '',
    category: segment.toLowerCase(),
    rawFetchedAt: new Date(),
  };
};

// ── Fetch events from Ticketmaster and upsert into MongoDB ─────────────────
export const fetchAndCacheEvents = async ({ city = '', keyword = '', category = '', page = 0, size = 20 } = {}) => {
  let tmEvents = [];
  let totalPages = 1;

  try {
    const params = {
      apikey: env.ticketmasterApiKey,
      size,
      page,
      sort: 'date,asc',
    };
    if (city) params.city = city;
    if (keyword) params.keyword = keyword;
    if (category) params.classificationName = category;

    const { data } = await axios.get(`${TM_BASE}/events.json`, { params, timeout: 8000 });

    tmEvents = data._embedded?.events || [];
    totalPages = data.page?.totalPages || 1;

    // Upsert each event into our cache (updateOne with upsert avoids duplicates)
    const ops = tmEvents.map((e) => ({
      updateOne: {
        filter: { tmId: e.id },
        update: { $set: normalise(e) },
        upsert: true,
      },
    }));
    if (ops.length) await Event.bulkWrite(ops);
  } catch (err) {
    // Ticketmaster is unavailable — fall back to cached data
    console.warn('⚠️  Ticketmaster API error, serving from cache:', err.message);

    const filter = {};
    if (city) filter.city = { $regex: new RegExp(city, 'i') };
    if (category) filter.category = category.toLowerCase();

    // Serve up to `size` most-recently-fetched cached events
    const cached = await Event.find(filter)
      .sort({ startDate: 1 })
      .skip(page * size)
      .limit(size);
    return { events: cached, totalPages: 1, fromCache: true };
  }

  // Build normalised event array from DB (so callers always get a consistent shape)
  const normalised = tmEvents.map(normalise);
  return { events: normalised, totalPages, fromCache: false };
};

// ── Fetch a single event by tmId (from cache, or refetch from TM) ──────────
export const getEventById = async (tmId) => {
  // Try cache first
  let event = await Event.findOne({ tmId });
  if (event) return event;

  // Not in cache — fetch directly from TM
  try {
    const { data } = await axios.get(`${TM_BASE}/events/${tmId}.json`, {
      params: { apikey: env.ticketmasterApiKey },
      timeout: 8000,
    });
    const norm = normalise(data);
    event = await Event.findOneAndUpdate({ tmId }, { $set: norm }, { upsert: true, new: true });
    return event;
  } catch {
    return null;
  }
};
