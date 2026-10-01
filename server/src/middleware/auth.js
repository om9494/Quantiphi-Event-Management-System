// Placeholder auth middleware — fully implemented in the auth commit.
// Exported here so other route files can import it without circular deps.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const protect = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorised — no token' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded; // { id, email }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorised — invalid token' });
  }
};
