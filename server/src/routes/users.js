import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All user profile routes require authentication
router.use(protect);

// GET /api/users/profile
router.get('/profile', getProfile);

// PUT /api/users/profile
router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('city').optional().trim(),
    body('countryCode').optional().trim().isLength({ max: 3 }),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio max 500 chars'),
    body('avatarUrl').optional().trim().isURL().withMessage('avatarUrl must be a valid URL'),
  ],
  validate,
  updateProfile
);

export default router;
