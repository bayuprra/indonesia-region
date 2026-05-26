const fs = require('fs');
const path = require('path');
const { validateRegions } = require('./validate-regions');

const SOURCE = {
  name: 'Wilayah.id public mirror',
  url: 'https://wilayah.id',
  apiBaseUrl: 'https://wilayah.id/api',
  note: 'Non-authoritative fallback mirror. It documents data derived from Kepmendagri and cahyadsn/wilayah.'
};

const DEFAULT_OUT_DIR = path.join(__dirname, '..', 'data', 'regions', 'current');
const DEFAULT_PUBLIC_DIR = null;
const DEFAULT_VERSION_ROOT = path.join(__dirname, '..', 'data', 'regions', 'versions');

function parseArgs(argv) {
  const options = {
    all: false,
    provinceCodes: [],
    concurrency: 8,
    outDir: DEFAULT_OUT_DIR,
    publicDir: DEFAULT_PUBLIC_DIR,
    versionRoot: DEFAULT_VERSION_ROOT
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--province-code') {
      options.provinceCodes.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--concurrency') {
      options.concurrency = Number(argv[index + 1]);
      index += 1;
    } else if (arg === '--out') {
      options.outDir = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg === '--public-out') {
      options.publicDir = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg === '--version-root') {
      options.versionRoot = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg === '--no-public-copy') {
      options.publicDir = null;
    } else if (arg === '--help') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.provinceCodes = options.provinceCodes.filter(Boolean).map(normalizeCode);

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error('--concurrency must be a positive integer');
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node scripts/generate-regions.js --province-code 31
  node scripts/generate-regions.js --province-code 31 --province-code 32
  node scripts/generate-regions.js --all --concurrency 8

Options:
  --province-code <code>  Generate one province and its children. Can be repeated.
  --all                   Generate all provinces and children.
  --concurrency <n>       Parallel fetches for child endpoints. Default: 8.
  --out <dir>             Current data output directory.
  --public-out <dir>      Optional static public mirror output directory.
  --no-public-copy        Do not write the public mirror.
`);
}

function normalizeCode(code) {
  return String(code).replace(/\./g, '').trim();
}

function normalizeName(name) {
  return String(name).trim().toUpperCase();
}

function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
}

async function fetchJson(url, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw new Error(`Failed to fetch ${url}: ${lastError.message}`);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function fetchProvinces() {
  const payload = await fetchJson(`${SOURCE.apiBaseUrl}/provinces.json`);
  return {
    records: payload.data.map((province) => ({
      code: normalizeCode(province.code),
      name: normalizeName(province.name)
    })),
    sourceUpdatedAt: payload.meta && payload.meta.updated_at
  };
}

async function fetchCities(provinceCode) {
  const dottedProvinceCode = provinceCode;
  const payload = await fetchJson(`${SOURCE.apiBaseUrl}/regencies/${dottedProvinceCode}.json`);

  return payload.data.map((city) => ({
    code: normalizeCode(city.code),
    name: normalizeName(city.name),
    province_code: provinceCode
  }));
}

async function fetchDistricts(city) {
  const dottedCityCode = `${city.code.slice(0, 2)}.${city.code.slice(2)}`;
  const payload = await fetchJson(`${SOURCE.apiBaseUrl}/districts/${dottedCityCode}.json`);

  return payload.data.map((district) => ({
    code: normalizeCode(district.code),
    name: normalizeName(district.name),
    city_code: city.code
  }));
}

async function fetchVillages(district) {
  const dottedDistrictCode = `${district.code.slice(0, 2)}.${district.code.slice(2, 4)}.${district.code.slice(4)}`;
  const payload = await fetchJson(`${SOURCE.apiBaseUrl}/villages/${dottedDistrictCode}.json`);

  return payload.data.map((village) => ({
    code: normalizeCode(village.code),
    name: normalizeName(village.name),
    district_code: district.code
  }));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function writeDataset(outDir, dataset) {
  writeJson(path.join(outDir, 'metadata.json'), dataset.metadata);
  writeJson(path.join(outDir, 'provinces.json'), dataset.provinces);
  writeJson(path.join(outDir, 'cities.json'), dataset.cities);
  writeJson(path.join(outDir, 'districts.json'), dataset.districts);
  writeJson(path.join(outDir, 'villages.json'), dataset.villages);
}

async function generateRegions(options) {
  const normalizedOptions = {
    ...options,
    provinceCodes: (options.provinceCodes || []).filter(Boolean).map(normalizeCode),
    concurrency: options.concurrency || 8
  };
  const generationDate = new Date();
  const { records: allProvinces, sourceUpdatedAt } = await fetchProvinces();
  const selectedProvinceCodes = normalizedOptions.all
    ? allProvinces.map((province) => province.code)
    : normalizedOptions.provinceCodes;

  if (selectedProvinceCodes.length === 0) {
    throw new Error('Choose --all or at least one --province-code');
  }

  const selectedProvinceSet = new Set(selectedProvinceCodes);
  const provinces = allProvinces.filter((province) => selectedProvinceSet.has(province.code));

  if (provinces.length !== selectedProvinceCodes.length) {
    const foundCodes = new Set(provinces.map((province) => province.code));
    const missingCodes = selectedProvinceCodes.filter((code) => !foundCodes.has(code));
    throw new Error(`Unknown province code(s): ${missingCodes.join(', ')}`);
  }

  console.log(`Fetching cities for ${provinces.length} province(s)`);
  const cities = (await mapWithConcurrency(provinces, normalizedOptions.concurrency, (province) => fetchCities(province.code))).flat();

  console.log(`Fetching districts for ${cities.length} city/regency record(s)`);
  const districts = (await mapWithConcurrency(cities, normalizedOptions.concurrency, fetchDistricts)).flat();

  console.log(`Fetching villages for ${districts.length} district record(s)`);
  const villages = (await mapWithConcurrency(districts, normalizedOptions.concurrency, fetchVillages)).flat();

  const metadata = {
    generated_at: generationDate.toISOString(),
    source: {
      name: SOURCE.name,
      url: SOURCE.url,
      api_base_url: SOURCE.apiBaseUrl,
      version: sourceUpdatedAt || null,
      retrieved_at: generationDate.toISOString(),
      note: SOURCE.note
    },
    scope: {
      complete: Boolean(normalizedOptions.all),
      province_codes: selectedProvinceCodes
    },
    counts: {
      provinces: provinces.length,
      cities: cities.length,
      districts: districts.length,
      villages: villages.length
    }
  };

  return {
    metadata,
    provinces,
    cities,
    districts,
    villages
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const dataset = await generateRegions(options);
  const versionDir = path.join(options.versionRoot, timestampForPath());

  writeDataset(options.outDir, dataset);
  writeDataset(versionDir, dataset);

  if (options.publicDir) {
    writeDataset(options.publicDir, dataset);
  }

  const errors = validateRegions(options.outDir);

  if (errors.length > 0) {
    throw new Error(`Generated data failed validation:\n- ${errors.join('\n- ')}`);
  }

  console.log(`Generated regions data in ${options.outDir}`);
  console.log(`Generated versioned copy in ${versionDir}`);

  if (options.publicDir) {
    console.log(`Generated public copy in ${options.publicDir}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_OUT_DIR,
  DEFAULT_PUBLIC_DIR,
  DEFAULT_VERSION_ROOT,
  generateRegions,
  normalizeCode,
  timestampForPath,
  writeDataset
};
