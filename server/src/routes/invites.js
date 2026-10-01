import { Router } from 'express';
import { param } from 'express-validator';
import { createInvite, resolveInvite, getLinkStats } from '../controllers/invite.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { inviteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Optional auth — lets the public endpoint know who's visiting (to skip owner count)
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  protect(req, res, next);
};

// POST /api/invites/:eventId  (requires auth + RSVP)
router.post(
  '/:eventId',
  protect,
  [param('eventId').notEmpty().withMessage('eventId is required')],
  validate,
  createInvite
);

// GET /api/invites/token/:token  (public, rate-limited)
// Note: uses /token/ prefix to disambiguate from /:eventId/stats
router.get(
  '/token/:token',
  inviteLimiter,
  optionalAuth,
  [param('token').notEmpty().withMessage('token is required')],
  validate,
  resolveInvite
);

// GET /api/invites/:eventId/stats  (owner only)
router.get(
  '/:eventId/stats',
  protect,
  [param('eventId').notEmpty().withMessage('eventId is required')],
  validate,
  getLinkStats
);

export default router;
