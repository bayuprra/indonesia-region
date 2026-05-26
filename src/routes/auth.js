const express = require('express');
const { getAuthenticatedUser } = require('../lib/user-auth');
const { getSupabasePublicClient } = require('../lib/supabase');

function createAuthRouter() {
  const router = express.Router();

  router.post('/login', async (req, res, next) => {
    const email = req.body && req.body.email;
    const password = req.body && req.body.password;

    if (!email || !password) {
      res.status(400).json({
        error: 'email and password are required'
      });
      return;
    }

    try {
      const supabase = getSupabasePublicClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.status === 0) {
          res.status(503).json({
            error: 'Supabase Auth is unavailable'
          });
          return;
        }

        res.status(401).json({
          error: 'Invalid login credentials'
        });
        return;
      }

      res.json({
        user: {
          id: data.user.id,
          email: data.user.email
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type
        }
      });
    } catch (error) {
      if (error.message && error.message.includes('SUPABASE_URL')) {
        res.status(503).json({
          error: 'Supabase Auth is not configured'
        });
        return;
      }

      next(error);
    }
  });

  router.get('/me', async (req, res, next) => {
    try {
      const user = await getAuthenticatedUser(req);

      if (!user) {
        res.status(401).json({
          error: 'Authentication required'
        });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (req, res) => {
    res.json({
      status: 'ok'
    });
  });

  return router;
}

module.exports = {
  createAuthRouter
};
