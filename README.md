# Indonesian Region API

Express.js service for Indonesian administrative region data.

The goal is to provide reliable, auditable region data for:

- Provinces
- Cities/regencies: kabupaten/kota
- Districts: kecamatan
- Villages: kelurahan/desa

The project should prefer generated, versioned JSON data over live frontend calls to third-party APIs. API routes should read local generated data, validate it, and support protected update/regeneration workflows.

## Current Status

This is an initial Express app scaffold.

Implemented:

- `GET /api/health`
- Static file serving from `public/`

Not yet implemented:

- Region data generator
- Region validation script
- Region API routes
- Protected update/regeneration route
- Automated tests, linting, formatting, or build scripts

## Requirements

- Node.js
- npm

## Setup

```sh
npm install
```

## Run

```sh
npm start
```

The app runs on `http://localhost:3000` by default. Set `PORT` to use another port.

For development with automatic restart on file changes:

```sh
npm run dev
```

## Available Commands

Only commands currently defined in `package.json` are listed here.

```sh
npm install
npm start
npm run dev
```

- `npm start`: runs `node src/server.js`
- `npm run dev`: runs `node --watch src/server.js`
- Build: Not yet defined
- Test: Not yet defined
- Lint: Not yet defined
- Format: Not yet defined

## Current API

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-05-26T00:00:00.000Z"
}
```

## Planned Region Data Design

Preferred data source order:

1. Official Kemendagri / Ditjen Bina Administrasi Kewilayahan data, if accessible in a reliable machine-readable format or as a local import file.
2. API.co.id Indonesia Regional API as a fallback source.
3. Other public mirrors only when documented as non-authoritative fallback sources.

Generated records should keep codes as strings and keep code/name separate:

```json
{
  "code": "31",
  "name": "DKI JAKARTA"
}
```

Child records should include parent codes:

```json
{
  "code": "3172",
  "name": "KOTA JAKARTA TIMUR",
  "province_code": "31"
}
```

Do not include a combined `code-name` field in generated JSON. Client applications may build and store that format themselves.

## Planned Data Layout

No generator exists yet. When added, use a versioned layout such as:

```text
data/
  regions/
    current/
      metadata.json
      provinces.json
      cities.json
      districts.json
      villages.json
    versions/
      YYYY-MM-DDTHH-mm-ssZ/
        metadata.json
        provinces.json
        cities.json
        districts.json
        villages.json
scripts/
  generate-regions.js
  validate-regions.js
```

Scoped payloads can be added if the frontend should not load all levels at once:

```text
data/regions/current/cities/{province_code}.json
data/regions/current/districts/{city_code}.json
data/regions/current/villages/{district_code}.json
```

## Planned API Shape

The intended selection flow is:

```text
GET provinces
GET cities/regencies by province code
GET districts/kecamatan by city/regency code
GET villages/kelurahan/desa by district code
```

Update/regeneration routes must be protected with an admin token or API key from environment variables.

## Security

- Do not commit secrets.
- Do not expose third-party API keys in frontend code or static JSON.
- Use environment variables for credentials.
- Third-party API calls should happen server-side or in local update scripts only.
- Avoid logging raw API keys or credential-bearing URLs.

## Data Quality

Generated data should be validated for:

- Required fields.
- Codes stored as strings.
- Duplicate codes.
- Missing parent records.
- Province -> city/regency links.
- City/regency -> district links.
- District -> village links.

## Agent Guidance

See [AGENTS.md](./AGENTS.md) for coding-agent instructions, project caveats, and region-data workflow details.
