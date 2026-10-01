// friendsAttendingCount definition:
// "The number of UNIQUE visitors who clicked any share link for a given event."
// A visitor is uniquely identified by (shareLink, visitorHash) — see LinkClick model.
// The link owner's own clicks are excluded at record-time (invite.service.js),
// so every count here represents a genuine outside visitor.

import LinkClick from '../models/LinkClick.js';

// Returns a Map<tmId, count> for a list of tmIds — one aggregation query.
export const getFriendsCountMap = async (tmIds) => {
  if (!tmIds.length) return new Map();

  const results = await LinkClick.aggregate([
    { $match: { tmId: { $in: tmIds } } },
    // Count unique visitorHash values per event
    { $group: { _id: '$tmId', count: { $sum: 1 } } },
  ]);

  const map = new Map();
  for (const r of results) map.set(r._id, r.count);
  return map;
};
