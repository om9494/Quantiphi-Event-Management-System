import { Router } from 'express';

const router = Router();

// GET /api/health — quick liveness check (no DB query needed)
router.get('/', (_req, res) => {
  res.json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

export default router;
