const path = require('path');
const express = require('express');
const { getSupabaseConfigStatus } = require('./lib/supabase');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        supabase: getSupabaseConfigStatus()
      }
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found'
    });
  });

  return app;
}

module.exports = {
  createApp
};
