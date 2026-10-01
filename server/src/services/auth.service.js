// Auth service — all business logic lives here, not in the controller.
// Controller stays thin: validate → call service → send response.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { createError } from '../middleware/errorHandler.js';

// Sign a JWT for a user document
const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const registerUser = async ({ name, email, password, city, countryCode }) => {
  // Check for duplicate email before attempting to insert
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw createError('Email already registered', 409);

  const user = await User.create({
    name,
    email,
    passwordHash: password, // pre-save hook hashes it
    city: city || '',
    countryCode: countryCode || '',
  });

  const token = signToken(user);
  return { token, user };
};

export const loginUser = async ({ email, password }) => {
  // Explicitly select passwordHash since it's excluded by default
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw createError('Invalid email or password', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw createError('Invalid email or password', 401);

  const token = signToken(user);
  return { token, user };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw createError('User not found', 404);
  return user;
};

export const updateProfile = async (userId, updates) => {
  // Only allow safe fields to be updated
  const allowed = ['name', 'city', 'countryCode', 'avatarUrl', 'bio'];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  if (!user) throw createError('User not found', 404);
  return user;
};
