import mongoose from 'mongoose';

// Local cache of Ticketmaster events.
// We upsert every time events are fetched so the cache stays fresh,
// but the app can fall back to stale cache data if TM is unreachable.
const eventSchema = new mongoose.Schema(
  {
    tmId: { type: String, required: true, unique: true }, // Ticketmaster event ID
    title: { type: String, required: true },
    venueName: { type: String, default: '' },
    city: { type: String, default: '', index: true },     // indexed for city-based queries
    address: { type: String, default: '' },
    startDate: { type: Date, index: true },               // UTC Date for sorting/filtering
    localDate: { type: String, default: '' },             // "YYYY-MM-DD" for calendar grouping
    localTime: { type: String, default: '' },             // "HH:MM:SS"
    imageUrl: { type: String, default: '' },
    url: { type: String, default: '' },                   // Ticketmaster buy-link
    category: { type: String, default: 'other', index: true },
    rawFetchedAt: { type: Date, default: Date.now },      // when we last cached this event
  },
  { timestamps: true }
);

// Compound index to support calendar queries: filter by city + date range efficiently
eventSchema.index({ city: 1, startDate: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
