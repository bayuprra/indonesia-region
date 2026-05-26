const REGION_DATASET_FILES = new Set([
  'metadata.json',
  'provinces.json',
  'cities.json',
  'regencies.json',
  'districts.json',
  'villages.json'
]);

function isRegionJsonRequest(pathname) {
  const normalizedPath = pathname.toLowerCase();
  const fileName = normalizedPath.split('/').pop();

  return (
    normalizedPath.startsWith('/regions/') ||
    normalizedPath.startsWith('/data/regions/') ||
    normalizedPath.startsWith('/public/regions/') ||
    REGION_DATASET_FILES.has(fileName)
  ) && normalizedPath.endsWith('.json');
}

function denyRegionJson(req, res, next) {
  const pathname = req.path || '';

  if (isRegionJsonRequest(pathname)) {
    res.status(403).json({
      error: 'Direct region JSON access is not allowed'
    });
    return;
  }

  next();
}

module.exports = {
  denyRegionJson,
  isRegionJsonRequest
};
