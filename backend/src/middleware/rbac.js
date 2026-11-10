// BalanceVault Role-Based Access Control (RBAC) Middleware
const AuditService = require('../services/auditService');

/**
 * Middleware factory ensuring the authenticated user possesses one of the allowed roles
 * @param  {...string} roles Allowed roles (e.g. 'ADMIN', 'ACCOUNT_HOLDER', 'AUDITOR')
 */
const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required prior to permission verification.'
      });
    }

    if (!roles.includes(req.user.role)) {
      // Record access denial to audit trail
      await AuditService.log({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ACCESS_DENIED',
        entityType: 'ENDPOINT',
        entityId: req.originalUrl,
        metadata: {
          requiredRoles: roles,
          userRole: req.user.role,
          method: req.method
        },
        req
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: `Role violation: Action requires [${roles.join(', ')}], but current identity has '${req.user.role}'.`
      });
    }

    next();
  };
};

module.exports = { requireRole };

