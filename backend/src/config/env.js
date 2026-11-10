// BalanceVault Environment Configuration
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://bv_app_user:bv_secure_password@localhost:5432/balancevault?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'balancevault-super-secret-jwt-key-2026-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100
};

