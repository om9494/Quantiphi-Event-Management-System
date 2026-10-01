// Thin controller — just validates, calls the service, sends the response.
import * as authService from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, city, countryCode } = req.body;
    const { token, user } = await authService.registerUser({ name, email, password, city, countryCode });
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser({ email, password });
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
