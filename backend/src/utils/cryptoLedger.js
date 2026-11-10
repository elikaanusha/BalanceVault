// BalanceVault Cryptographic Provable Ledger Engine
const crypto = require('crypto');

const GENESIS_HASH = 'GENESIS_BLOCK_0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes deterministic SHA-256 hash for a ledger block/transaction
 */
function computeLedgerHash({ previousHash, fromAccountId, toAccountId, amount, currency, timestamp, type, reference }) {
  const normalizedTime = new Date(timestamp).toISOString();
  const canonicalPayload = [
    previousHash || GENESIS_HASH,
    fromAccountId || 'SYSTEM_TREASURY',
    toAccountId || 'SYSTEM_TREASURY',
    Number(amount).toFixed(2),
    currency || 'USD',
    type,
    reference || '',
    normalizedTime
  ].join('|');

  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}

/**
 * Computes deterministic checksum for an audit log record
 */
function computeAuditChecksum({ actorId, actorRole, action, entityType, entityId, timestamp, metadataJson }) {
  const canonicalString = [
    actorId || 'SYSTEM',
    actorRole || 'UNKNOWN',
    action,
    entityType,
    entityId || 'NONE',
    new Date(timestamp).toISOString(),
    metadataJson || '{}'
  ].join('::');

  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Validates the entire ledger chain from genesis block to current head
 */
function verifyLedgerIntegrity(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      isValid: true,
      chainLength: 0,
      headHash: GENESIS_HASH,
      brokenBlocks: [],
      verifiedAt: new Date().toISOString(),
      message: 'Ledger is empty (Genesis state)'
    };
  }

  // Ensure chronological order (oldest to newest)
  const sorted = [...transactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  let expectedPreviousHash = GENESIS_HASH;
  const brokenBlocks = [];

  for (let i = 0; i < sorted.length; i++) {
    const tx = sorted[i];

    // Check pointer consistency
    if (tx.previousHash !== expectedPreviousHash) {
      brokenBlocks.push({
        index: i,
        transactionId: tx.id,
        reason: 'Broken pointer: previousHash mismatch',
        expected: expectedPreviousHash,
        actual: tx.previousHash
      });
    }

    // Check hash integrity
    const recalculatedHash = computeLedgerHash({
      previousHash: tx.previousHash,
      fromAccountId: tx.fromAccountId,
      toAccountId: tx.toAccountId,
      amount: tx.amount,
      currency: tx.currency,
      timestamp: tx.timestamp,
      type: tx.type,
      reference: tx.reference
    });

    if (recalculatedHash !== tx.ledgerHash) {
      brokenBlocks.push({
        index: i,
        transactionId: tx.id,
        reason: 'Tampered block data: ledgerHash mismatch',
        expected: recalculatedHash,
        actual: tx.ledgerHash
      });
    }

    expectedPreviousHash = tx.ledgerHash;
  }

  const isValid = brokenBlocks.length === 0;

  return {
    isValid,
    chainLength: sorted.length,
    genesisHash: GENESIS_HASH,
    headHash: sorted[sorted.length - 1].ledgerHash,
    brokenBlocks,
    verifiedAt: new Date().toISOString(),
    message: isValid
      ? 'Cryptographic integrity verified. All transaction hashes match chain of custody.'
      : `Ledger compromised: ${brokenBlocks.length} invalid block(s) detected.`
  };
}

module.exports = {
  GENESIS_HASH,
  computeLedgerHash,
  computeAuditChecksum,
  verifyLedgerIntegrity
};

