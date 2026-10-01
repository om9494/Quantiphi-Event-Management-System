// Invite service — share link creation, click tracking, friends-attending aggregation.
// All logic here; controller stays thin.

import crypto from 'crypto';
import ShareLink from '../models/ShareLink.js';
import LinkClick from '../models/LinkClick.js';
import Event from '../models/Event.js';
import Rsvp from '../models/Rsvp.js';
import { createError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

// ── Helpers ────────────────────────────────────────────────────────────────

// Generate a cryptographically random, URL-safe token (24 chars ≈ 144 bits)
const generateToken = () => crypto.randomBytes(18).toString('base64url');

// Deterministic visitor fingerprint from IP + user-agent.
// We hash, never store raw data — privacy-preserving.
const visitorHash = (ip, userAgent) =>
  crypto.createHash('sha256').update(`${ip}|${userAgent}`).digest('hex');

// ── POST /api/invites/:eventId ────────────────────────────────────────────
// Requires auth + existing RSVP. Idempotent: returns the same link if it exists.
export const createOrGetShareLink = async (userId, tmId) => {
  // User must have RSVPed to this event (403 otherwise)
  const rsvp = await Rsvp.findOne({ user: userId, tmId });
  if (!rsvp) throw createError('You must RSVP to an event before sharing it', 403);

  // Return existing link for this (user, event) pair — idempotent
  let link = await ShareLink.findOne({ createdBy: userId, tmId });
  if (!link) {
    link = await ShareLink.create({
      token: generateToken(),
      tmId,
      createdBy: userId,
    });
  }

  // Build the full shareable URL
  const shareUrl = `${env.clientUrl}/invite/${link.token}`;
  return { link, shareUrl };
};

// ── GET /api/invites/:token (public) ─────────────────────────────────────
// Records a deduplicated click, then returns event details.
// The link owner's own visit is NOT counted (as per spec).
export const resolveInvite = async (token, { ip, userAgent, currentUserId } = {}) => {
  const link = await ShareLink.findOne({ token });
  if (!link) throw createError('Invite link not found or expired', 404);

  const event = await Event.findOne({ tmId: link.tmId });
  if (!event) throw createError('Event not found', 404);

  // Do not count the link owner's own clicks
  const isOwner = currentUserId && String(link.createdBy) === String(currentUserId);

  if (!isOwner) {
    const vh = visitorHash(ip || 'unknown', userAgent || 'unknown');

    // Upsert with unique index (shareLink, visitorHash) — duplicate clicks are silently ignored
    try {
      await LinkClick.create({
        shareLink: link._id,
        tmId: link.tmId,
        clickerUser: currentUserId || null,
        visitorHash: vh,
      });
    } catch (err) {
      // Error code 11000 = MongoDB duplicate key — this visitor already clicked; ignore
      if (err.code !== 11000) throw err;
    }
  }

  return { event, link };
};

// ── GET /api/invites/:eventId/stats ─────────────────────────────────────
// Returns total unique clicks on the calling user's share link for an event.
export const getLinkStats = async (userId, tmId) => {
  const link = await ShareLink.findOne({ createdBy: userId, tmId });
  if (!link) throw createError('No share link found for this event', 404);

  // Count unique visitors across this specific link
  const count = await LinkClick.countDocuments({ shareLink: link._id });
  return { tmId, token: link.token, uniqueClicks: count };
};
