// Central route aggregator — import new routers here as features are added.
import { Router } from 'express';
import healthRouter from './health.js';

const router = Router();

router.use('/health', healthRouter);

// Auth, events, rsvps, reminders, invites, users — added in subsequent commits
// router.use('/auth', authRouter);
// router.use('/events', eventsRouter);
// router.use('/rsvps', rsvpRouter);
// router.use('/reminders', remindersRouter);
// router.use('/invites', invitesRouter);
// router.use('/users', usersRouter);
// router.use('/notifications', notificationsRouter);

export default router;
