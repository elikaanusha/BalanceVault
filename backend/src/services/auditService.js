// BalanceVault Immutable Audit Service
const { db } = require('../config/db');
const { computeAuditChecksum } = require('../utils/cryptoLedger');

class AuditService {
  /**
   * Log security, auth, account, or admin action with tamper-evident checksum
   */
  static async log({ actorId = null, actorRole = 'ANONYMOUS', action, entityType, entityId = null, metadata = {}, req = null }) {
    const timestamp = new Date();
    const metadataJson = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const userAgent = req ? (req.headers['user-agent'] || 'API_CLIENT') : 'INTERNAL_SYSTEM';

    const checksum = computeAuditChecksum({
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      timestamp,
      metadataJson
    });

    try {
      const entry = await db.auditLog.create({
        data: {
          actorId,
          actorRole,
          action,
          entityType,
          entityId,
          ipAddress,
          userAgent,
          metadataJson,
          checksum,
          timestamp
        }
      });
      return entry;
    } catch (err) {
      console.error('Failed to write audit log:', err.message);
      return null;
    }
  }

  static async getLogs({ take = 50, actorId = null, action = null } = {}) {
    const where = {};
    if (actorId) where.actorId = actorId;
    if (action) where.action = action;
    return await db.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take
    });
  }
}

module.exports = AuditService;

