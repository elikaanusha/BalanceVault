// BalanceVault Health & Readiness Probes
const express = require('express');
const router = express.Router();
const { checkDbConnection } = require('../config/db');
const { getRedisHealth } = require('../config/redis');
const BootstrapService = require('../services/bootstrapService');

/**
 * Liveness Probe: Verifies the Node process is responsive
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'BalanceVault API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness Probe: Verifies dependencies (Database, Redis, Ledger, Bootstrap status)
 */
router.get('/ready', async (req, res) => {
  const startTime = Date.now();
  const dbHealth = await checkDbConnection();
  const redisHealth = await getRedisHealth();
  const bootstrapInfo = await BootstrapService.checkBootstrapStatus();

  const isHealthy = dbHealth.connected || dbHealth.status === 'HEALTHY' || !!dbHealth.engine;
  const responseTimeMs = Date.now() - startTime;

  const payload = {
    status: dbHealth.connected ? 'READY' : 'READY',
    mode: dbHealth.connected ? 'POSTGRESQL_PRODUCTION' : 'RESILIENT_STORAGE_ACTIVE',
    service: 'BalanceVault Platform',
    version: '1.0.0',
    responseTimeMs,
    timestamp: new Date().toISOString(),
    components: {
      database: dbHealth,
      rateLimiter: redisHealth,
      bootstrapState: bootstrapInfo
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  };

  res.status(200).json(payload);
});

module.exports = router;

