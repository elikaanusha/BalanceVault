#!/usr/bin/env node
/**
 * BalanceVault - First Administrator Bootstrap & Verification Utility
 * 
 * Implements the PostgreSQL role-separation security model:
 * - Operates under 'bootstrap_operator' role with SET ROLE
 * - Executes the SECURITY DEFINER fn_bootstrap_first_admin stored procedure
 * - Prevents Cloud Postgres / Neon SQLSTATE 42501 permission rejection
 * - Verifies the administrator can authenticate immediately
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const BootstrapService = require('../backend/src/services/bootstrapService');
const bcrypt = require('bcryptjs');
const { db } = require('../backend/src/config/db');

async function main() {
  console.log('================================================================');
  console.log('🛡️  BalanceVault First-Administrator Bootstrap Utility');
  console.log('================================================================');

  const adminEmail = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@balancevault.internal';
  const adminPassword = process.env.ADMIN_PASSWORD || process.argv[3] || 'AdminVault2026!Secure';
  const adminName = process.env.ADMIN_NAME || process.argv[4] || 'Lead System Administrator';
  const operatorRole = process.env.PG_OPERATOR_ROLE || 'bootstrap_operator';

  console.log(`Checking existing bootstrap state...`);
  const status = await BootstrapService.checkBootstrapStatus();

  if (status.isBootstrapped) {
    console.log(`ℹ️  System is already bootstrapped!`);
    console.log(`   Active Admin Account: ${status.adminEmail}`);
    console.log(`   Admin Count: ${status.adminCount}`);
    console.log('   Notice: For security reasons, the initial bootstrap cannot be re-run.');
    process.exit(0);
  }

  console.log(`\nInitializing first administrator under role [${operatorRole}]...`);
  console.log(`   Target Email: ${adminEmail}`);
  console.log(`   Display Name: ${adminName}`);

  try {
    const result = await BootstrapService.bootstrapFirstAdmin({
      email: adminEmail,
      password: adminPassword,
      fullName: adminName,
      operatorRole
    });

    console.log('\n✅ FIRST-ADMIN BOOTSTRAP SUCCEEDED!');
    console.log('----------------------------------------------------------------');
    console.log(`Admin User ID : ${result.admin.id}`);
    console.log(`Email Address : ${result.admin.email}`);
    console.log(`Assigned Role : ${result.admin.role}`);
    console.log(`Status        : ${result.admin.status}`);
    console.log(`Exec Method   : ${result.executionMethod}`);
    console.log('----------------------------------------------------------------');

    // Verification Step: Test admin authentication
    console.log('\nVerifying Administrator Login Flow...');
    const user = await db.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
      throw new Error('Verification failed: User record not found in database.');
    }

    const passwordMatches = await bcrypt.compare(adminPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new Error('Verification failed: Generated password hash does not match input.');
    }

    console.log('✅ ADMIN LOGIN FLOW VERIFIED! Password hash comparison successful.');
    console.log('\n🎉 BalanceVault is initialized and ready for production operations.');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ BOOTSTRAP FAILED:', err.message);
    if (err.code === 'BV001') {
      console.error('Lock active: An admin already exists in this database.');
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal bootstrap execution error:', err);
  process.exit(1);
});

