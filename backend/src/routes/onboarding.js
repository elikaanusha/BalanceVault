// BalanceVault User Onboarding Workflow Routes
const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateJWT } = require('../middleware/auth');
const AuditService = require('../services/auditService');

/**
 * Get current user onboarding status
 */
router.get('/status', authenticateJWT, async (req, res) => {
  try {
    const request = await db.onboardingRequest.findFirst({
      where: { userId: req.user.id }
    });

    res.json({
      userStatus: req.user.status,
      onboarding: request || { status: 'NOT_SUBMITTED' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve onboarding status', message: err.message });
  }
});

/**
 * Submit onboarding KYC verification request
 */
router.post('/submit', authenticateJWT, async (req, res) => {
  const { businessName, registrationNumber, documentType = 'GOVERNMENT_ID', notes } = req.body;

  try {
    const existing = await db.onboardingRequest.findFirst({
      where: { userId: req.user.id }
    });

    if (existing && existing.status === 'APPROVED') {
      return res.status(400).json({ error: 'Already Approved', message: 'User is already verified and approved.' });
    }

    let request;
    if (existing) {
      request = await db.onboardingRequest.update({
        where: { id: existing.id },
        data: {
          businessName,
          registrationNumber,
          documentType,
          notes,
          status: 'SUBMITTED',
          reviewerNotes: null
        }
      });
    } else {
      request = await db.onboardingRequest.create({
        data: {
          userId: req.user.id,
          businessName,
          registrationNumber,
          documentType,
          notes,
          status: 'SUBMITTED'
        }
      });
    }

    await AuditService.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'ONBOARDING_SUBMITTED',
      entityType: 'ONBOARDING',
      entityId: request.id,
      metadata: { businessName, registrationNumber, documentType },
      req
    });

    res.status(201).json({
      message: 'Onboarding application submitted for administrative review.',
      request
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit onboarding', message: err.message });
  }
});

module.exports = router;

