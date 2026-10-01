import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security headers (XSS, clickjacking, MIME sniffing, etc.) ──────────────
app.use(helmet());

// ── CORS — only the configured frontend origin is allowed ──────────────────
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── HTTP request logger ────────────────────────────────────────────────────
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));          // reject huge payloads
app.use(express.urlencoded({ extended: true }));

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api', router);

// ── 404 handler for unmatched routes ──────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Centralised error handler (must be last middleware) ────────────────────
app.use(errorHandler);

export default app;
