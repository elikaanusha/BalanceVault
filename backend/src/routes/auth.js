// BalanceVault Authentication & First-Admin Bootstrap Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { db } = require('../config/db');
const { authenticateJWT } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const AuditService = require('../services/auditService');
const BootstrapService = require('../services/bootstrapService');

/**
 * Check First-Admin Bootstrap Status
 */
router.get('/bootstrap/status', async (req, res) => {
  try {
    const status = await BootstrapService.checkBootstrapStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Bootstrap Status Error', message: err.message });
  }
});

/**
 * Execute First-Admin Bootstrap
 */
router.post('/bootstrap', authRateLimiter, async (req, res) => {
  const { email, password, fullName, operatorRole = 'bootstrap_operator' } = req.body;

  try {
    const result = await BootstrapService.bootstrapFirstAdmin({
      email,
      password,
      fullName,
      operatorRole,
      req
    });

    res.status(201).json(result);
  } catch (err) {
    const status = err.statusCode || (err.code === 'BV001' ? 409 : 400);
    res.status(status).json({
      error: 'Bootstrap Error',
      code: err.code || 'BOOTSTRAP_FAILED',
      message: err.message
    });
  }
});

/**
 * Account-Holder Self-Registration
 */
router.post('/register', authRateLimiter, async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email, password, and full name are required.' });
  }

  try {
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role: 'ACCOUNT_HOLDER',
        status: 'PENDING_ONBOARDING'
      }
    });

    await AuditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_REGISTER',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: user.email, status: user.status },
      req
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Registration successful. Please proceed with account onboarding.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration Failed', message: err.message });
  }
});

/**
 * Universal Login (Admin, Account Holder, Auditor)
 */
router.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
  }

  try {
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      await AuditService.log({
        actorRole: 'ANONYMOUS',
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        metadata: { email, reason: 'USER_NOT_FOUND' },
        req
      });
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await AuditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        entityId: user.id,
        metadata: { email: user.email, reason: 'INVALID_CREDENTIALS' },
        req
      });
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid email or password.' });
    }

    if (user.status === 'SUSPENDED') {
      await AuditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_REJECTED_SUSPENDED',
        entityType: 'AUTH',
        entityId: user.id,
        metadata: { email: user.email },
        req
      });
      return res.status(403).json({ error: 'Account Suspended', message: 'Your account is currently suspended. Please contact support.' });
    }

    // Record login success
    await AuditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
      req
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login Error', message: err.message });
  }
});

/**
 * Fetch Current Identity
 */
router.get('/me', authenticateJWT, async (req, res) => {
  const accounts = await db.account.findMany({ where: { userId: req.user.id } });
  const onboarding = await db.onboardingRequest.findFirst({ where: { userId: req.user.id } });

  res.json({
    user: req.user,
    accounts,
    onboarding
  });
});

module.exports = router;

