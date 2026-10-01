import * as rsvpService from '../services/rsvp.service.js';

// POST /api/rsvps
export const createRsvp = async (req, res, next) => {
  try {
    const { eventId } = req.body; // eventId = tmId
    const { rsvp, event } = await rsvpService.createRsvp(req.user.id, eventId);
    res.status(201).json({ success: true, rsvp, event });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/rsvps/:eventId
export const deleteRsvp = async (req, res, next) => {
  try {
    await rsvpService.deleteRsvp(req.user.id, req.params.eventId);
    res.json({ success: true, message: 'RSVP cancelled' });
  } catch (err) {
    next(err);
  }
};

// GET /api/rsvps — RSVP dashboard data (upcoming + past, server-split)
export const getUserRsvps = async (req, res, next) => {
  try {
    const data = await rsvpService.getUserRsvps(req.user.id);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};
