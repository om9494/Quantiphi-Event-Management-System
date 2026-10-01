// Central route aggregator — add new routers here as features land.
import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import eventsRouter from './events.js';
import rsvpsRouter from './rsvps.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/events', eventsRouter);
router.use('/rsvps', rsvpsRouter);

// reminders, invites, notifications — added in subsequent commits
// router.use('/reminders', remindersRouter);
// router.use('/invites', invitesRouter);
// router.use('/notifications', notificationsRouter);

export default router;
