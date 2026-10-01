import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — only allow requests from the React dev server (or deployed frontend)
app.use(cors({ origin: env.clientUrl, credentials: true }));

// Request logging (dev = coloured, production = combined)
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// All API routes
app.use('/api', router);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralised error handler (must be last)
app.use(errorHandler);

export default app;
