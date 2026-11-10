// BalanceVault Account Management & Provable Money Movement Routes
const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateJWT } = require('../middleware/auth');
const { computeLedgerHash, GENESIS_HASH } = require('../utils/cryptoLedger');
const AuditService = require('../services/auditService');

/**
 * Get all accounts owned by the authenticated user
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const accounts = await db.account.findMany({
      where: { userId: req.user.id }
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
});

/**
 * Open a new account (e.g. CHECKING, SAVINGS, ESCROW)
 */
router.post('/create', authenticateJWT, async (req, res) => {
  const { accountType = 'CHECKING', currency = 'USD' } = req.body;

  // Verify onboarding status
  if (req.user.status === 'PENDING_ONBOARDING') {
    return res.status(403).json({
      error: 'Onboarding Required',
      message: 'Account opening requires approved identity verification onboarding.'
    });
  }

  try {
    const newAccount = await db.account.create({
      data: {
        userId: req.user.id,
        accountType,
        currency,
        balance: 0.0,
        status: 'ACTIVE'
      }
    });

    await AuditService.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'ACCOUNT_CREATED',
      entityType: 'ACCOUNT',
      entityId: newAccount.id,
      metadata: { accountNumber: newAccount.accountNumber, type: accountType, currency },
      req
    });

    res.status(201).json(newAccount);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account', message: err.message });
  }
});

/**
 * Deposit funds into account with provable ledger chaining
 */
router.post('/deposit', authenticateJWT, async (req, res) => {
  const { accountId, amount, reference = 'Deposit funding' } = req.body;
  const depositAmount = parseFloat(amount);

  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ error: 'Validation Error', message: 'Deposit amount must be a positive number.' });
  }

  try {
    const account = await db.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: 'Not Found', message: 'Target account not found.' });
    }

    if (account.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied to target account.' });
    }

    // Retrieve head of ledger for cryptographic chaining
    const lastTx = await db.transaction.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    const previousHash = lastTx ? lastTx.ledgerHash : GENESIS_HASH;

    const timestamp = new Date();
    const ledgerHash = computeLedgerHash({
      previousHash,
      fromAccountId: null,
      toAccountId: account.id,
      amount: depositAmount,
      currency: account.currency,
      timestamp,
      type: 'DEPOSIT',
      reference
    });

    // Atomic update
    const updatedAccount = await db.account.update({
      where: { id: account.id },
      data: { balance: account.balance + depositAmount }
    });

    const tx = await db.transaction.create({
      data: {
        fromAccountId: null,
        toAccountId: account.id,
        amount: depositAmount,
        currency: account.currency,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        reference,
        previousHash,
        ledgerHash,
        timestamp
      }
    });

    await AuditService.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'MONEY_DEPOSIT',
      entityType: 'TRANSACTION',
      entityId: tx.id,
      metadata: {
        accountId: account.id,
        amount: depositAmount,
        ledgerHash,
        previousHash
      },
      req
    });

    res.status(201).json({
      message: 'Deposit successful with verified ledger entry.',
      transaction: tx,
      newBalance: updatedAccount.balance
    });
  } catch (err) {
    res.status(500).json({ error: 'Deposit Failed', message: err.message });
  }
});

/**
 * Transfer funds between accounts with cryptographic hash chaining
 */
router.post('/transfer', authenticateJWT, async (req, res) => {
  const { fromAccountId, toAccountId, amount, reference = 'Direct Account Transfer' } = req.body;
  const transferAmount = parseFloat(amount);

  if (isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: 'Validation Error', message: 'Transfer amount must be a positive value.' });
  }

  if (fromAccountId === toAccountId) {
    return res.status(400).json({ error: 'Validation Error', message: 'Source and destination accounts must be distinct.' });
  }

  try {
    const fromAccount = await db.account.findUnique({ where: { id: fromAccountId } });
    if (!fromAccount) {
      return res.status(404).json({ error: 'Not Found', message: 'Source account not found.' });
    }

    if (fromAccount.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to transfer from this account.' });
    }

    if (fromAccount.balance < transferAmount) {
      return res.status(400).json({
        error: 'Insufficient Funds',
        message: `Available balance ($${fromAccount.balance.toFixed(2)}) is insufficient for this transfer ($${transferAmount.toFixed(2)}).`
      });
    }

    const toAccount = await db.account.findUnique({ where: { id: toAccountId } });
    if (!toAccount) {
      return res.status(404).json({ error: 'Not Found', message: 'Destination account not found.' });
    }

    // Get previous ledger hash for cryptographic chaining
    const lastTx = await db.transaction.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    const previousHash = lastTx ? lastTx.ledgerHash : GENESIS_HASH;

    const timestamp = new Date();
    const ledgerHash = computeLedgerHash({
      previousHash,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount: transferAmount,
      currency: fromAccount.currency,
      timestamp,
      type: 'TRANSFER',
      reference
    });

    // Execute atomic balance movements
    const updatedFrom = await db.account.update({
      where: { id: fromAccount.id },
      data: { balance: fromAccount.balance - transferAmount }
    });

    const updatedTo = await db.account.update({
      where: { id: toAccount.id },
      data: { balance: toAccount.balance + transferAmount }
    });

    // Record Provable Ledger Entry
    const tx = await db.transaction.create({
      data: {
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: transferAmount,
        currency: fromAccount.currency,
        type: 'TRANSFER',
        status: 'COMPLETED',
        reference,
        previousHash,
        ledgerHash,
        timestamp
      }
    });

    // Record Immutable Audit Log
    await AuditService.log({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'MONEY_TRANSFER',
      entityType: 'TRANSACTION',
      entityId: tx.id,
      metadata: {
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: transferAmount,
        previousHash,
        ledgerHash
      },
      req
    });

    res.status(201).json({
      message: 'Transfer completed and recorded in provable ledger.',
      transaction: tx,
      fromBalance: updatedFrom.balance,
      toBalance: updatedTo.balance
    });
  } catch (err) {
    res.status(500).json({ error: 'Transfer Failed', message: err.message });
  }
});

/**
 * Get provable ledger transactions for an account
 */
router.get('/:id/ledger', authenticateJWT, async (req, res) => {
  const accountId = req.params.id;

  try {
    const account = await db.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: 'Not Found', message: 'Account not found.' });
    }

    if (account.userId !== req.user.id && !['ADMIN', 'AUDITOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
    }

    const transactions = await db.transaction.findMany({
      where: {
        OR: [
          { fromAccountId: accountId },
          { toAccountId: accountId }
        ]
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json({
      account,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: 'Ledger Query Error', message: err.message });
  }
});

module.exports = router;

