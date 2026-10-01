// Central route aggregator — add new routers here as features land.
import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import eventsRouter from './events.js';
import rsvpsRouter from './rsvps.js';
import remindersRouter from './reminders.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/events', eventsRouter);
router.use('/rsvps', rsvpsRouter);
router.use('/reminders', remindersRouter);

// /reminders/notifications is nested under reminders router
// invites — added in next commit
// router.use('/invites', invitesRouter);

export default router;
