// BalanceVault API Server
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { apiRateLimiter } = require('./middleware/rateLimiter');

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const onboardingRoutes = require('./routes/onboarding');
const adminRoutes = require('./routes/admin');

const app = express();

// Global Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting
app.use('/api', apiRateLimiter);

// Mount API Endpoints
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);

// Root informative endpoint
app.get('/', (req, res) => {
  res.json({
    project: 'BalanceVault',
    tagline: 'Money movement with a ledger you can prove',
    status: 'ACTIVE',
    documentation: {
      health: '/api/health',
      ready: '/api/ready',
      auth: '/api/auth',
      accounts: '/api/accounts',
      admin: '/api/admin'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred while processing the request.'
  });
});

// Start Server
if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 BalanceVault Backend running on port ${env.PORT}`);
    console.log(`   Health: http://localhost:${env.PORT}/api/health`);
    console.log(`   Readiness: http://localhost:${env.PORT}/api/ready`);
    console.log(`====================================================`);
  });
}

module.exports = app;

