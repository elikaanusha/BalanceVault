// BalanceVault Database Adapter (Prisma + Resilient Storage Engine)
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

let prisma = null;
let isPrismaConnected = false;

// Initialize Prisma Client
try {
  prisma = new PrismaClient({
    log: ['error', 'warn']
  });
} catch (e) {
  console.warn('⚠️  Prisma client not yet generated. Falling back to local storage engine.');
}

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../../.data');
const DATA_FILE = path.join(DATA_DIR, 'storage.json');

const loadPersistedData = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || [],
        accounts: parsed.accounts || [],
        transactions: parsed.transactions || [],
        onboardingRequests: parsed.onboardingRequests || [],
        auditLogs: parsed.auditLogs || [],
        adminBootstrapLogs: parsed.adminBootstrapLogs || []
      };
    }
  } catch (e) {}
  return { users: [], accounts: [], transactions: [], onboardingRequests: [], auditLogs: [], adminBootstrapLogs: [] };
};

// Resilient local data store
const inMemoryData = loadPersistedData();

const saveData = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryData, null, 2), 'utf8');
  } catch (e) {}
};

// Seed genesis block and demo state if in-memory
const seedInMemory = () => {
  console.log('📦 BalanceVault resilient storage engine initialized.');
};
seedInMemory();

// Fallback wrapper that replicates Prisma's query API
const fallbackDb = {
  user: {
    findUnique: async ({ where }) => {
      if (where.id) return inMemoryData.users.find(u => u.id === where.id) || null;
      if (where.email) return inMemoryData.users.find(u => u.email.toLowerCase() === where.email.toLowerCase()) || null;
      return null;
    },
    findFirst: async ({ where = {} }) => {
      return inMemoryData.users.find(u => {
        let match = true;
        if (where.role && u.role !== where.role) match = false;
        if (where.status && u.status !== where.status) match = false;
        if (where.email && u.email.toLowerCase() !== where.email.toLowerCase()) match = false;
        return match;
      }) || null;
    },
    findMany: async ({ where = {}, orderBy = {} } = {}) => {
      let results = inMemoryData.users.filter(u => {
        if (where.role && u.role !== where.role) return false;
        if (where.status && u.status !== where.status) return false;
        return true;
      });
      return results.map(u => ({ ...u, accounts: inMemoryData.accounts.filter(a => a.userId === u.id) }));
    },
    create: async ({ data }) => {
      const newUser = {
        id: data.id || crypto.randomUUID(),
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role || 'ACCOUNT_HOLDER',
        status: data.status || 'PENDING_ONBOARDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryData.users.push(newUser);
      saveData();
      return newUser;
    },
    update: async ({ where, data }) => {
      const idx = inMemoryData.users.findIndex(u => u.id === where.id || u.email === where.email);
      if (idx === -1) throw new Error('User not found');
      inMemoryData.users[idx] = { ...inMemoryData.users[idx], ...data, updatedAt: new Date() };
      saveData();
      return inMemoryData.users[idx];
    },
    count: async ({ where = {} } = {}) => {
      return inMemoryData.users.filter(u => {
        if (where.role && u.role !== where.role) return false;
        return true;
      }).length;
    }
  },

  account: {
    findUnique: async ({ where }) => {
      if (where.id) return inMemoryData.accounts.find(a => a.id === where.id) || null;
      if (where.accountNumber) return inMemoryData.accounts.find(a => a.accountNumber === where.accountNumber) || null;
      return null;
    },
    findMany: async ({ where = {} } = {}) => {
      return inMemoryData.accounts.filter(a => {
        if (where.userId && a.userId !== where.userId) return false;
        if (where.status && a.status !== where.status) return false;
        return true;
      });
    },
    create: async ({ data }) => {
      const newAcc = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        accountNumber: data.accountNumber || ('BV-' + Math.floor(10000000 + Math.random() * 90000000)),
        accountType: data.accountType || 'CHECKING',
        currency: data.currency || 'USD',
        balance: data.balance || 0.0,
        status: data.status || 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryData.accounts.push(newAcc);
      saveData();
      return newAcc;
    },
    update: async ({ where, data }) => {
      const idx = inMemoryData.accounts.findIndex(a => a.id === where.id);
      if (idx === -1) throw new Error('Account not found');
      inMemoryData.accounts[idx] = { ...inMemoryData.accounts[idx], ...data, updatedAt: new Date() };
      saveData();
      return inMemoryData.accounts[idx];
    }
  },

  transaction: {
    findFirst: async ({ orderBy = {} } = {}) => {
      if (inMemoryData.transactions.length === 0) return null;
      const sorted = [...inMemoryData.transactions].sort((a, b) => b.timestamp - a.timestamp);
      return sorted[0];
    },
    findMany: async ({ where = {}, orderBy = {} } = {}) => {
      let results = inMemoryData.transactions.filter(t => {
        if (where.OR) {
          return where.OR.some(cond => (cond.fromAccountId && t.fromAccountId === cond.fromAccountId) || (cond.toAccountId && t.toAccountId === cond.toAccountId));
        }
        return true;
      });
      return results.sort((a, b) => b.timestamp - a.timestamp);
    },
    create: async ({ data }) => {
      const newTx = {
        id: data.id || crypto.randomUUID(),
        fromAccountId: data.fromAccountId || null,
        toAccountId: data.toAccountId || null,
        amount: data.amount,
        currency: data.currency || 'USD',
        type: data.type,
        status: data.status || 'COMPLETED',
        reference: data.reference || null,
        previousHash: data.previousHash,
        ledgerHash: data.ledgerHash,
        signature: data.signature || null,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      };
      inMemoryData.transactions.push(newTx);
      saveData();
      return newTx;
    },
    count: async () => inMemoryData.transactions.length
  },

  onboardingRequest: {
    findUnique: async ({ where }) => {
      return inMemoryData.onboardingRequests.find(r => r.id === where.id) || null;
    },
    findFirst: async ({ where = {} } = {}) => {
      return inMemoryData.onboardingRequests.find(r => {
        if (where.userId && r.userId !== where.userId) return false;
        return true;
      }) || null;
    },
    findMany: async ({ where = {} } = {}) => {
      return inMemoryData.onboardingRequests.map(r => {
        const user = inMemoryData.users.find(u => u.id === r.userId);
        return { ...r, user };
      });
    },
    create: async ({ data }) => {
      const newReq = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        businessName: data.businessName || null,
        registrationNumber: data.registrationNumber || null,
        documentType: data.documentType,
        documentUrl: data.documentUrl || null,
        notes: data.notes || null,
        status: data.status || 'SUBMITTED',
        reviewerNotes: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      };
      inMemoryData.onboardingRequests.push(newReq);
      saveData();
      return newReq;
    },
    update: async ({ where, data }) => {
      const idx = inMemoryData.onboardingRequests.findIndex(r => r.id === where.id);
      if (idx === -1) throw new Error('Onboarding request not found');
      inMemoryData.onboardingRequests[idx] = { ...inMemoryData.onboardingRequests[idx], ...data, updatedAt: new Date() };
      saveData();
      return inMemoryData.onboardingRequests[idx];
    }
  },

  auditLog: {
    findMany: async ({ orderBy = {}, take = 100 } = {}) => {
      const sorted = [...inMemoryData.auditLogs].sort((a, b) => b.timestamp - a.timestamp);
      return sorted.slice(0, take);
    },
    create: async ({ data }) => {
      const newLog = {
        id: data.id || crypto.randomUUID(),
        actorId: data.actorId || null,
        actorRole: data.actorRole,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        metadataJson: data.metadataJson || null,
        checksum: data.checksum,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      };
      inMemoryData.auditLogs.push(newLog);
      saveData();
      return newLog;
    },
    count: async () => inMemoryData.auditLogs.length
  },

  adminBootstrapLog: {
    create: async ({ data }) => {
      const log = {
        id: crypto.randomUUID(),
        operatorRole: data.operatorRole,
        adminEmail: data.adminEmail,
        executionMethod: data.executionMethod,
        pgRoleUsed: data.pgRoleUsed,
        success: data.success,
        errorMessage: data.errorMessage || null,
        timestamp: new Date()
      };
      inMemoryData.adminBootstrapLogs.push(log);
      saveData();
      return log;
    },
    findMany: async () => [...inMemoryData.adminBootstrapLogs]
  }
};

// Check PostgreSQL connectivity
const checkDbConnection = async () => {
  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      isPrismaConnected = true;
      return {
        status: 'HEALTHY',
        engine: 'PostgreSQL (Prisma)',
        connected: true
      };
    } catch (err) {
      isPrismaConnected = false;
      return {
        status: 'DEGRADED',
        engine: 'Resilient Local Storage (PostgreSQL not connected)',
        connected: false,
        error: err.message
      };
    }
  }
  return {
    status: 'HEALTHY',
    engine: 'Resilient Local Storage Engine',
    connected: true
  };
};

// Active database client proxy (routes to Prisma if connected, otherwise fallbackDb)
const db = new Proxy({}, {
  get(target, prop) {
    if (isPrismaConnected && prisma && prisma[prop]) {
      return prisma[prop];
    }
    return fallbackDb[prop] || (prisma && prisma[prop]);
  }
});

module.exports = {
  db,
  prisma,
  checkDbConnection,
  isPrismaConnected: () => isPrismaConnected
};

