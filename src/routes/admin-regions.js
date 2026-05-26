const path = require('path');
const { requireAdminToken } = require('../lib/admin-auth');
const { validateRegions } = require('../../scripts/validate-regions');
const {
  DEFAULT_OUT_DIR,
  DEFAULT_VERSION_ROOT,
  generateRegions,
  normalizeCode,
  timestampForPath,
  writeDataset
} = require('../../scripts/generate-regions');

function parseProvinceCodes(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(normalizeCode).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map(normalizeCode).filter(Boolean);
  }

  return [];
}

function createAdminRegionsRouter(express) {
  const router = express.Router();

  router.post('/regenerate', requireAdminToken, async (req, res, next) => {
    const all = req.body && req.body.all === true;
    const provinceCodes = parseProvinceCodes(req.body && req.body.province_codes);
    const concurrency = req.body && req.body.concurrency ? Number(req.body.concurrency) : 8;

    if (!all && provinceCodes.length === 0) {
      res.status(400).json({
        error: 'Choose all=true or provide province_codes'
      });
      return;
    }

    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
      res.status(400).json({
        error: 'concurrency must be an integer from 1 to 16'
      });
      return;
    }

    try {
      const dataset = await generateRegions({
        all,
        provinceCodes,
        concurrency
      });
      const versionDir = path.join(DEFAULT_VERSION_ROOT, timestampForPath());

      writeDataset(DEFAULT_OUT_DIR, dataset);
      writeDataset(versionDir, dataset);
      const errors = validateRegions(DEFAULT_OUT_DIR);

      if (errors.length > 0) {
        res.status(500).json({
          error: 'Generated data failed validation',
          details: errors
        });
        return;
      }

      res.json({
        status: 'ok',
        metadata: dataset.metadata,
        version_dir: versionDir
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createAdminRegionsRouter
};
