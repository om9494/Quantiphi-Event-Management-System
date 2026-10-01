import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

// GET /api/health — liveness + DB readiness check
router.get('/', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState];

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    message: dbState === 1 ? 'API is healthy' : 'Database not ready',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});

export default router;
