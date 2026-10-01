import { Router } from 'express';
import { body, param } from 'express-validator';
import { createRsvp, deleteRsvp, getUserRsvps } from '../controllers/rsvp.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All RSVP routes require authentication
router.use(protect);

// GET /api/rsvps — fetch the user's full RSVP dashboard
router.get('/', getUserRsvps);

// POST /api/rsvps  { eventId: "<tmId>" }
router.post(
  '/',
  [body('eventId').notEmpty().withMessage('eventId (Ticketmaster ID) is required')],
  validate,
  createRsvp
);

// DELETE /api/rsvps/:eventId
router.delete(
  '/:eventId',
  [param('eventId').notEmpty().withMessage('eventId is required')],
  validate,
  deleteRsvp
);

export default router;
