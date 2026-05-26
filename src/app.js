const path = require('path');
const express = require('express');
const { getSupabaseConfigStatus } = require('./lib/supabase');
const { getRegionsStatus } = require('./lib/regions-store');
const { createAuthRouter } = require('./routes/auth');
const { createAdminRegionsRouter } = require('./routes/admin-regions');
const { createRegionsRouter } = require('./routes/regions');

function createApp() {
  const app = express();
  const regionsRouter = createRegionsRouter();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        supabase: getSupabaseConfigStatus(),
        regions: getRegionsStatus()
      }
    });
  });

  app.use('/api/auth', createAuthRouter());
  app.use('/api/regions', regionsRouter);
  app.use('/api/admin/regions', createAdminRegionsRouter(express));

  app.get('/api/provinces', (req, res, next) => {
    req.url = '/provinces';
    regionsRouter(req, res, next);
  });

  app.get('/api/cities', (req, res, next) => {
    req.url = `/cities?${new URLSearchParams(req.query).toString()}`;
    regionsRouter(req, res, next);
  });

  app.get('/api/districts', (req, res, next) => {
    req.url = `/districts?${new URLSearchParams(req.query).toString()}`;
    regionsRouter(req, res, next);
  });

  app.get('/api/villages', (req, res, next) => {
    req.url = `/villages?${new URLSearchParams(req.query).toString()}`;
    regionsRouter(req, res, next);
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found'
    });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error'
    });
  });

  return app;
}

module.exports = {
  createApp
};
