// Invite controller — thin; all logic in invite.service.js
import * as inviteService from '../services/invite.service.js';

// POST /api/invites/:eventId
export const createInvite = async (req, res, next) => {
  try {
    const { link, shareUrl } = await inviteService.createOrGetShareLink(
      req.user.id,
      req.params.eventId
    );
    res.status(201).json({ success: true, token: link.token, shareUrl });
  } catch (err) {
    next(err);
  }
};

// GET /api/invites/:token  (public)
export const resolveInvite = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const { event, link } = await inviteService.resolveInvite(req.params.token, {
      ip,
      userAgent,
      currentUserId: req.user?.id ?? null, // optional auth via optionalAuth middleware
    });

    res.json({ success: true, event, token: link.token });
  } catch (err) {
    next(err);
  }
};

// GET /api/invites/:eventId/stats  (owner only)
export const getLinkStats = async (req, res, next) => {
  try {
    const stats = await inviteService.getLinkStats(req.user.id, req.params.eventId);
    res.json({ success: true, ...stats });
  } catch (err) {
    next(err);
  }
};
