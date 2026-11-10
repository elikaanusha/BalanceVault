// BalanceVault Admin Management & Audit Ledger Routes
const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { verifyLedgerIntegrity } = require('../utils/cryptoLedger');
const AuditService = require('../services/auditService');

// All admin routes require authentication
router.use(authenticateJWT);

/**
 * Platform Overview Statistics
 */
router.get('/stats', requireRole('ADMIN', 'AUDITOR'), async (req, res) => {
  try {
    const totalUsers = await db.user.count();
    const activeUsers = await db.user.count({ where: { status: 'ACTIVE' } });
    const pendingOnboarding = await db.user.count({ where: { status: 'PENDING_ONBOARDING' } });
    const totalTransactions = await db.transaction.count();
    const totalAuditLogs = await db.auditLog.count();

    const transactions = await db.transaction.findMany();
    const totalVolume = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const ledgerStatus = verifyLedgerIntegrity(transactions);

    res.json({
      metrics: {
        totalUsers,
        activeUsers,
        pendingOnboarding,
        totalTransactions,
        totalVolume,
        totalAuditLogs
      },
      ledgerIntegrity: {
        isValid: ledgerStatus.isValid,
        headHash: ledgerStatus.headHash,
        chainLength: ledgerStatus.chainLength
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats Query Failed', message: err.message });
  }
});

/**
 * List all users with account profiles
 */
router.get('/users', requireRole('ADMIN', 'AUDITOR'), async (req, res) => {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const sanitized = users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      accounts: u.accounts || []
    }));

    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: 'User Query Failed', message: err.message });
  }
});

/**
 * Modify user status (e.g. SUSPEND, ACTIVATE)
 */
router.patch('/users/:id/status', requireRole('ADMIN'), async (req, res) => {
  const { status } = req.body;
  const targetUserId = req.params.id;

  if (!['ACTIVE', 'SUSPENDED', 'PENDING_ONBOARDING'].includes(status)) {
    return res.status(400).json({ error: 'Invalid Status', message: 'Allowed statuses: ACTIVE, SUSPENDED, PENDING_ONBOARDING' });
  }

  try {
    const user = await db.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User does not exist.' });
    }

    if (user.role === 'ADMIN' && targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Operation Rejected', message: 'Administrators cannot alter their own active status.' });
    }

    const previousStatus = user.status;
    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { status }
    });

    await AuditService.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'USER_STATUS_CHANGE',
      entityType: 'USER',
      entityId: updated.id,
      metadata: { previousStatus, newStatus: status, userEmail: user.email },
      req
    });

    res.json({
      message: `User status transitioned to ${status}.`,
      user: {
        id: updated.id,
        email: updated.email,
        status: updated.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Status update failed', message: err.message });
  }
});

/**
 * List all onboarding applications
 */
router.get('/onboarding', requireRole('ADMIN', 'AUDITOR'), async (req, res) => {
  try {
    const requests = await db.onboardingRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve onboarding queue', message: err.message });
  }
});

/**
 * Review onboarding application (Approve / Reject)
 */
router.post('/onboarding/:id/review', requireRole('ADMIN'), async (req, res) => {
  const { decision, reviewerNotes = '' } = req.body;
  const requestId = req.params.id;

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid Decision', message: 'Decision must be APPROVED or REJECTED.' });
  }

  try {
    const request = await db.onboardingRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Not Found', message: 'Onboarding request not found.' });
    }

    const now = new Date();
    const updatedRequest = await db.onboardingRequest.update({
      where: { id: requestId },
      data: {
        status: decision,
        reviewerNotes,
        reviewedBy: req.user.email,
        reviewedAt: now
      }
    });

    // If approved, activate user account and provision default primary checking account
    if (decision === 'APPROVED') {
      await db.user.update({
        where: { id: request.userId },
        data: { status: 'ACTIVE' }
      });

      // Provision primary checking account if none exists
      const existingAccounts = await db.account.findMany({ where: { userId: request.userId } });
      if (existingAccounts.length === 0) {
        await db.account.create({
          data: {
            userId: request.userId,
            accountType: 'CHECKING',
            currency: 'USD',
            balance: 1000.0 // Demo opening credit for testing money movement
          }
        });
      }
    }

    await AuditService.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: decision === 'APPROVED' ? 'ONBOARDING_APPROVED' : 'ONBOARDING_REJECTED',
      entityType: 'ONBOARDING',
      entityId: requestId,
      metadata: {
        applicantUserId: request.userId,
        decision,
        reviewerNotes
      },
      req
    });

    res.json({
      message: `Onboarding request ${decision.toLowerCase()} successfully.`,
      request: updatedRequest
    });
  } catch (err) {
    res.status(500).json({ error: 'Review Execution Failed', message: err.message });
  }
});

/**
 * Immutable Audit Logs
 */
router.get('/audit-logs', requireRole('ADMIN', 'AUDITOR'), async (req, res) => {
  try {
    const logs = await AuditService.getLogs({ take: 100 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Audit Query Failed', message: err.message });
  }
});

/**
 * Cryptographic Provable Ledger Integrity Check
 */
router.get('/ledger/verify', requireRole('ADMIN', 'AUDITOR'), async (req, res) => {
  try {
    const transactions = await db.transaction.findMany();
    const integrityReport = verifyLedgerIntegrity(transactions);
    res.json(integrityReport);
  } catch (err) {
    res.status(500).json({ error: 'Ledger Verification Failed', message: err.message });
  }
});

module.exports = router;

