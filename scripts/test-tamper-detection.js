#!/usr/bin/env node
/**
 * BalanceVault - Cryptographic Tamper Detection Proof Utility
 * 
 * Demonstrates the core platform thesis:
 * "Money movement with a ledger you can prove"
 * 
 * Simulates an adversarial attempt to modify a past transaction amount
 * directly in the database, and mathematically proves that the SHA-256
 * chain of custody catches the manipulation immediately.
 */

const { db } = require('../backend/src/config/db');
const { computeLedgerHash, verifyLedgerIntegrity, GENESIS_HASH } = require('../backend/src/utils/cryptoLedger');

async function testTamperDetection() {
  console.log('================================================================');
  console.log('🛡️  BalanceVault Cryptographic Tamper Detection Demonstration');
  console.log('================================================================\n');

  // Step 1: Create clean chained sample transactions
  console.log('1. Minting 3 sequentially chained ledger blocks...');
  const t0 = new Date('2026-11-10T10:00:00Z');
  const t1 = new Date('2026-11-10T10:05:00Z');
  const t2 = new Date('2026-11-10T10:10:00Z');

  // Block 1
  const hash1 = computeLedgerHash({
    previousHash: GENESIS_HASH,
    fromAccountId: null,
    toAccountId: 'ACC-001',
    amount: 1000.00,
    currency: 'USD',
    timestamp: t0,
    type: 'DEPOSIT',
    reference: 'Legitimate Capital Injection'
  });

  const block1 = {
    id: 'tx-block-001',
    fromAccountId: null,
    toAccountId: 'ACC-001',
    amount: 1000.00,
    currency: 'USD',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    reference: 'Legitimate Capital Injection',
    previousHash: GENESIS_HASH,
    ledgerHash: hash1,
    timestamp: t0
  };

  // Block 2
  const hash2 = computeLedgerHash({
    previousHash: hash1,
    fromAccountId: 'ACC-001',
    toAccountId: 'ACC-002',
    amount: 400.00,
    currency: 'USD',
    timestamp: t1,
    type: 'TRANSFER',
    reference: 'Invoice Settlement'
  });

  const block2 = {
    id: 'tx-block-002',
    fromAccountId: 'ACC-001',
    toAccountId: 'ACC-002',
    amount: 400.00,
    currency: 'USD',
    type: 'TRANSFER',
    status: 'COMPLETED',
    reference: 'Invoice Settlement',
    previousHash: hash1,
    ledgerHash: hash2,
    timestamp: t1
  };

  // Block 3
  const hash3 = computeLedgerHash({
    previousHash: hash2,
    fromAccountId: 'ACC-002',
    toAccountId: 'ACC-003',
    amount: 150.00,
    currency: 'USD',
    timestamp: t2,
    type: 'TRANSFER',
    reference: 'Vendor Payment'
  });

  const block3 = {
    id: 'tx-block-003',
    fromAccountId: 'ACC-002',
    toAccountId: 'ACC-003',
    amount: 150.00,
    currency: 'USD',
    type: 'TRANSFER',
    status: 'COMPLETED',
    reference: 'Vendor Payment',
    previousHash: hash2,
    ledgerHash: hash3,
    timestamp: t2
  };

  const chain = [block1, block2, block3];

  console.log(`   Block 1 Hash: ${block1.ledgerHash.substring(0, 24)}...`);
  console.log(`   Block 2 Hash: ${block2.ledgerHash.substring(0, 24)}... (points to Block 1)`);
  console.log(`   Block 3 Hash: ${block3.ledgerHash.substring(0, 24)}... (points to Block 2)`);

  // Step 2: Verify Initial Ledger
  console.log('\n2. Verifying ledger prior to tampering...');
  const initialAudit = verifyLedgerIntegrity(chain);
  console.log(`   Chain Status: ${initialAudit.isValid ? 'VALID' : 'INVALID'}`);
  console.log(`   Message     : ${initialAudit.message}`);

  if (!initialAudit.isValid) {
    throw new Error('Initial chain verification failed.');
  }

  // Step 3: Simulate Adversarial Tamper
  console.log('\n3. ⚠️  SIMULATING ADVERSARIAL DATABASE TAMPERING:');
  console.log('   An attacker updates Block 1 amount in the DB from $1,000.00 -> $9,999.00');
  
  // Clone chain and tamper
  const tamperedChain = [
    { ...block1, amount: 9999.00 }, // FRAUDULENT INJECTION
    { ...block2 },
    { ...block3 }
  ];

  // Step 4: Run Cryptographic Audit on Tampered Chain
  console.log('\n4. Running Cryptographic Verification on Tampered Chain...');
  const tamperedAudit = verifyLedgerIntegrity(tamperedChain);

  console.log(`   Chain Status  : ${tamperedAudit.isValid ? 'VALID' : '🚨 COMPROMISED'}`);
  console.log(`   Broken Blocks : ${tamperedAudit.brokenBlocks.length}`);
  tamperedAudit.brokenBlocks.forEach((broken, idx) => {
    console.log(`     [Broken Block #${broken.index}] TX ID: ${broken.transactionId}`);
    console.log(`       Reason  : ${broken.reason}`);
    console.log(`       Expected: ${broken.expected.substring(0, 32)}...`);
    console.log(`       Actual  : ${broken.actual.substring(0, 32)}...`);
  });

  if (!tamperedAudit.isValid && tamperedAudit.brokenBlocks.length > 0) {
    console.log('\n================================================================');
    console.log('🎉 PROOF VERIFIED: Mathematical tamper-detection succeeded!');
    console.log('Any unauthorized change to transaction records breaks the chain.');
    console.log('BalanceVault delivers a ledger you can prove mathematically.');
    console.log('================================================================\n');
  } else {
    throw new Error('Tamper detection failed to catch the manipulation!');
  }
}

testTamperDetection().catch(err => {
  console.error('Tamper demo error:', err);
  process.exit(1);
});

