import { Router } from 'express';
import { body, param } from 'express-validator';
import { upsertReminder, getUserReminders, getNotifications } from '../controllers/reminder.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ALLOWED_REMIND_BEFORE } from '../models/ReminderSetting.js';

const router = Router();
router.use(protect);

// GET /api/reminders
router.get('/', getUserReminders);

// PUT /api/reminders/:eventId
router.put(
  '/:eventId',
  [
    param('eventId').notEmpty().withMessage('eventId is required'),
    body('remindBefore')
      .notEmpty()
      .isIn(ALLOWED_REMIND_BEFORE)
      .withMessage(`remindBefore must be one of: ${ALLOWED_REMIND_BEFORE.join(', ')}`),
    body('enabled').optional().isBoolean().withMessage('enabled must be a boolean'),
  ],
  validate,
  upsertReminder
);

// GET /api/notifications — in-app notifications for the logged-in user
router.get('/notifications', getNotifications);

export default router;
