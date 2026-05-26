const fs = require('fs');
const path = require('path');

const DEFAULT_REGIONS_DIR = path.join(__dirname, '..', '..', 'data', 'regions', 'current');

const DATASETS = {
  metadata: 'metadata.json',
  provinces: 'provinces.json',
  cities: 'cities.json',
  districts: 'districts.json',
  villages: 'villages.json'
};

function getRegionsDir() {
  return process.env.REGIONS_DATA_DIR || DEFAULT_REGIONS_DIR;
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function readDataset(name) {
  const fileName = DATASETS[name];

  if (!fileName) {
    throw new Error(`Unknown regions dataset: ${name}`);
  }

  const filePath = path.join(getRegionsDir(), fileName);

  if (!fs.existsSync(filePath)) {
    const error = new Error(`Regions dataset not found: ${fileName}`);
    error.code = 'REGIONS_DATASET_NOT_FOUND';
    throw error;
  }

  return readJsonFile(filePath);
}

function getRegionsStatus() {
  const dir = getRegionsDir();
  const files = Object.values(DATASETS);
  const presentFiles = files.filter((fileName) => fs.existsSync(path.join(dir, fileName)));
  const ready = presentFiles.length === files.length;

  let metadata = null;

  if (fs.existsSync(path.join(dir, DATASETS.metadata))) {
    metadata = readDataset('metadata');
  }

  return {
    ready,
    dataDir: dir,
    presentFiles,
    missingFiles: files.filter((fileName) => !presentFiles.includes(fileName)),
    metadata
  };
}

function filterByParent(records, parentField, parentCode) {
  if (!parentCode) {
    return records;
  }

  return records.filter((record) => record[parentField] === parentCode);
}

function getMetadata() {
  return readDataset('metadata');
}

function getProvinces() {
  return readDataset('provinces');
}

function getCities(provinceCode) {
  return filterByParent(readDataset('cities'), 'province_code', provinceCode);
}

function getDistricts(cityCode) {
  return filterByParent(readDataset('districts'), 'city_code', cityCode);
}

function getVillages(districtCode) {
  return filterByParent(readDataset('villages'), 'district_code', districtCode);
}

module.exports = {
  getRegionsStatus,
  getMetadata,
  getProvinces,
  getCities,
  getDistricts,
  getVillages
};
