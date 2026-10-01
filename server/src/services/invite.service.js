// Invite service — share link creation, click tracking, friends-attending aggregation.
// All logic here; controller stays thin.

import crypto from 'crypto';
import ShareLink from '../models/ShareLink.js';
import LinkClick from '../models/LinkClick.js';
import Event from '../models/Event.js';
import Rsvp from '../models/Rsvp.js';
import { createError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { getIo } from '../socket.js';

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
    let isNewClick = false;
    try {
      await LinkClick.create({
        shareLink: link._id,
        tmId: link.tmId,
        clickerUser: currentUserId || null,
        visitorHash: vh,
      });
      isNewClick = true;
    } catch (err) {
      // Error code 11000 = MongoDB duplicate key — this visitor already clicked; ignore
      if (err.code !== 11000) throw err;
    }

    // ── Real-time update ────────────────────────────────────────────────────
    // Only broadcast when a genuinely new unique click was recorded.
    // "friendsAttendingCount" = total unique clicks across ALL share links for
    // this event, computed here by a fast countDocuments call.
    if (isNewClick) {
      try {
        const newCount = await LinkClick.countDocuments({ tmId: link.tmId });
        // Emit to every client that joined the "event:<tmId>" room
        getIo().to(`event:${link.tmId}`).emit('friends:update', {
          tmId: link.tmId,
          friendsAttendingCount: newCount,
        });
      } catch {
        // Never let a socket error break the HTTP response
      }
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
