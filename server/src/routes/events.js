import { Router } from 'express';
import { query } from 'express-validator';
import { getEvents, getEventById } from '../controllers/events.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Auth is optional on the feed — logged-in users get isRsvped flags
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  protect(req, res, next);
};

// GET /api/events
router.get(
  '/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 0 }).toInt(),
    query('size').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  validate,
  getEvents
);

// GET /api/events/:id  (must come AFTER /calendar and /date routes — added in commit 5)
router.get('/:id', optionalAuth, getEventById);

export default router;
