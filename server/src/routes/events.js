import { Router } from 'express';
import { query } from 'express-validator';
import { getEvents, getEventById } from '../controllers/events.controller.js';
import { getCalendarDates, getEventsByDate } from '../controllers/calendar.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Auth is optional on all event routes — logged-in users get isRsvped flags
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  protect(req, res, next);
};

// GET /api/events/calendar?year=&month=&city=
// Server computes which dates in the month have events and their counts.
router.get('/calendar', optionalAuth, getCalendarDates);

// GET /api/events/date/:date?city=
// Returns all events on a specific YYYY-MM-DD day.
router.get('/date/:date', optionalAuth, getEventsByDate);

// GET /api/events?city=&keyword=&category=&page=&size=
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

// GET /api/events/:id  — must come AFTER /calendar and /date/:date
router.get('/:id', optionalAuth, getEventById);

export default router;
