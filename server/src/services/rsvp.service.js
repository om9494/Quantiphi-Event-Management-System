// Placeholder — fully implemented in the RSVP commit.
// Exported here so the events service can call it without a circular dep.

import Rsvp from '../models/Rsvp.js';

// Returns a Set of tmIds the given user has RSVPed to
export const getRsvpedTmIds = async (userId) => {
  if (!userId) return new Set();
  const rsvps = await Rsvp.find({ user: userId }).select('tmId').lean();
  return new Set(rsvps.map((r) => r.tmId));
};
