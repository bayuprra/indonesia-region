const fs = require('fs');
const path = require('path');

const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data', 'regions', 'current');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

function validateRecords(records, datasetName, parentField, parentCodes, errors) {
  const codes = new Set();

  assert(Array.isArray(records), `${datasetName} must be an array`, errors);

  if (!Array.isArray(records)) {
    return codes;
  }

  records.forEach((record, index) => {
    const label = `${datasetName}[${index}]`;

    assert(record && typeof record === 'object' && !Array.isArray(record), `${label} must be an object`, errors);

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return;
    }

    assert(typeof record.code === 'string' && record.code.length > 0, `${label}.code must be a non-empty string`, errors);
    assert(typeof record.name === 'string' && record.name.length > 0, `${label}.name must be a non-empty string`, errors);
    assert(!Object.prototype.hasOwnProperty.call(record, 'value'), `${label} must not include a combined value field`, errors);

    if (typeof record.code === 'string') {
      assert(!codes.has(record.code), `${datasetName} has duplicate code ${record.code}`, errors);
      codes.add(record.code);
    }

    if (parentField) {
      assert(typeof record[parentField] === 'string' && record[parentField].length > 0, `${label}.${parentField} must be a non-empty string`, errors);

      if (typeof record[parentField] === 'string' && parentCodes) {
        assert(parentCodes.has(record[parentField]), `${label}.${parentField} references missing parent ${record[parentField]}`, errors);
      }
    }
  });

  return codes;
}

function validateRegions(dataDir = DEFAULT_DATA_DIR) {
  const errors = [];
  const metadataPath = path.join(dataDir, 'metadata.json');
  const provincesPath = path.join(dataDir, 'provinces.json');
  const citiesPath = path.join(dataDir, 'cities.json');
  const districtsPath = path.join(dataDir, 'districts.json');
  const villagesPath = path.join(dataDir, 'villages.json');

  [metadataPath, provincesPath, citiesPath, districtsPath, villagesPath].forEach((filePath) => {
    assert(fs.existsSync(filePath), `Missing file: ${filePath}`, errors);
  });

  if (errors.length > 0) {
    return errors;
  }

  const metadata = readJson(metadataPath);
  const provinces = readJson(provincesPath);
  const cities = readJson(citiesPath);
  const districts = readJson(districtsPath);
  const villages = readJson(villagesPath);

  assert(metadata && typeof metadata === 'object' && !Array.isArray(metadata), 'metadata must be an object', errors);
  assert(typeof metadata.generated_at === 'string', 'metadata.generated_at must be a string', errors);
  assert(metadata.source && typeof metadata.source === 'object', 'metadata.source must be an object', errors);
  assert(typeof metadata.source.name === 'string', 'metadata.source.name must be a string', errors);
  assert(typeof metadata.source.url === 'string', 'metadata.source.url must be a string', errors);

  const provinceCodes = validateRecords(provinces, 'provinces', null, null, errors);
  const cityCodes = validateRecords(cities, 'cities', 'province_code', provinceCodes, errors);
  const districtCodes = validateRecords(districts, 'districts', 'city_code', cityCodes, errors);
  validateRecords(villages, 'villages', 'district_code', districtCodes, errors);

  return errors;
}

if (require.main === module) {
  const dataDir = process.argv[2] || DEFAULT_DATA_DIR;
  const errors = validateRegions(dataDir);

  if (errors.length > 0) {
    console.error(`Region validation failed with ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Region validation passed for ${dataDir}`);
}

module.exports = {
  validateRegions
};
