const { getSupabaseAdminClient } = require('./supabase');

function getAccessToken(req) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function getAuthenticatedUser(req) {
  const token = getAccessToken(req);

  if (!token) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

async function requireAuthenticatedUser(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        error: 'Authentication required'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.message && error.message.includes('SUPABASE_URL')) {
      res.status(503).json({
        error: 'Supabase Auth is not configured'
      });
      return;
    }

    next(error);
  }
}

module.exports = {
  getAccessToken,
  getAuthenticatedUser,
  requireAuthenticatedUser
};
