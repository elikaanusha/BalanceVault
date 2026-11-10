// BalanceVault Distributed Rate Limiter
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { redisClient, isRedisConnected } = require('../config/redis');

// Construct rate limiter with Redis backend or fast in-memory fallback
let store = undefined;

try {
  if (isRedisConnected() && redisClient) {
    const { RedisStore } = require('rate-limit-redis');
    store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'bv_rl:'
    });
  }
} catch (e) {
  // Graceful fallback to memory
}

const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please throttle requests and try again later.',
    windowMs: env.RATE_LIMIT_WINDOW_MS
  }
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit on authentication attempts to prevent brute force
  standardHeaders: true,
  legacyHeaders: false,
  store,
  message: {
    error: 'Too Many Authentication Attempts',
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.'
  }
});

module.exports = {
  apiRateLimiter,
  authRateLimiter
};

