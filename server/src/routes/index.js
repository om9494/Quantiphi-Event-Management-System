// Central route aggregator — add new routers here as features land.
import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import usersRouter from './users.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);

// Events, rsvps, reminders, invites, notifications — added in subsequent commits
// router.use('/events', eventsRouter);
// router.use('/rsvps', rsvpRouter);
// router.use('/reminders', remindersRouter);
// router.use('/invites', invitesRouter);
// router.use('/notifications', notificationsRouter);

export default router;
