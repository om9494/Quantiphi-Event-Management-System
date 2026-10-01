// Centralised env config — import this instead of process.env directly.
// Throws early with a readable message if any required variable is missing,
// so you catch misconfiguration at startup, not mid-request.
import dotenv from 'dotenv';
dotenv.config();

const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'TICKETMASTER_API_KEY',
  'CLIENT_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ticketmasterApiKey: process.env.TICKETMASTER_API_KEY,
  clientUrl: process.env.CLIENT_URL,
};
