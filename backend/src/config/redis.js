// BalanceVault Redis Client & Health Monitor
const env = require('./env');

let redisClient = null;
let isRedisConnected = false;

// In-memory fallback cache and rate limit store
const memoryStore = new Map();

try {
  const Redis = require('ioredis');
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        // Stop retrying after 3 attempts to prevent log spam
        return null;
      }
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    console.log('✅ Connected to Redis at', env.REDIS_URL);
  }).catch((err) => {
    isRedisConnected = false;
    console.warn('⚠️  Redis server unavailable. Utilizing high-performance In-Memory rate limiter fallback.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
  });
} catch (e) {
  isRedisConnected = false;
}

const getRedisHealth = async () => {
  if (!redisClient || !isRedisConnected) {
    return {
      status: 'DEGRADED',
      mode: 'IN_MEMORY_FALLBACK',
      connected: false,
      message: 'Redis offline; in-memory fallback active'
    };
  }
  try {
    const ping = await redisClient.ping();
    return {
      status: 'HEALTHY',
      mode: 'REDIS_CLUSTERED',
      connected: true,
      ping
    };
  } catch (err) {
    return {
      status: 'DEGRADED',
      mode: 'IN_MEMORY_FALLBACK',
      connected: false,
      error: err.message
    };
  }
};

module.exports = {
  redisClient,
  isRedisConnected: () => isRedisConnected,
  getRedisHealth,
  memoryStore
};

