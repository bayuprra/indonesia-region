function getBearerToken(req) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function requireAdminToken(req, res, next) {
  const expectedToken = process.env.ADMIN_API_TOKEN;

  if (!expectedToken) {
    res.status(503).json({
      error: 'Admin API token is not configured'
    });
    return;
  }

  const providedToken = getBearerToken(req) || req.get('x-admin-token');

  if (providedToken !== expectedToken) {
    res.status(401).json({
      error: 'Unauthorized'
    });
    return;
  }

  next();
}

module.exports = {
  requireAdminToken
};
