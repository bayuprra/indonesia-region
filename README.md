# Indonesian Region API

Express.js service for Indonesian administrative region data.

The goal is to provide reliable, auditable region data for:

- Provinces
- Cities/regencies: kabupaten/kota
- Districts: kecamatan
- Villages: kelurahan/desa

The project should prefer generated, versioned JSON data over live frontend calls to third-party APIs. API routes should read local generated data, validate it, and support protected update/regeneration workflows.

## Current Status

This is an Express app with generated Indonesian administrative region JSON and API routes.

Implemented:

- `GET /api/health`
- Static file serving from `public/`
- Server-side Supabase client wiring
- Cloudflare Workers deployment configuration
- Region API routes for provinces, cities/regencies, districts, and villages
- Region data generator and validator
- Versioned generated JSON under `data/regions/`
- Protected server-side region regeneration route
- Login-gated browser UI with an admin regeneration panel

Not yet implemented:

- Automated tests, linting, formatting, or build scripts

## Requirements

- Node.js
- npm

## Setup

```sh
npm install
```

Copy the example environment files before setting credentials:

```sh
cp .env.example .env
cp .dev.vars.example .dev.vars
```

Use `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only on the server side. Do not place the service role key in frontend code or static files.

Set `SUPABASE_PUBLISHABLE_KEY` for the server-side login route.
Set `ADMIN_API_TOKEN` before using protected regeneration routes.

## Run

```sh
npm start
```

The app runs on `http://localhost:3000` by default. Set `PORT` to use another port.

For development with automatic restart on file changes:

```sh
npm run dev
```

To run through Cloudflare Workers locally:

```sh
npm run cloudflare:dev
```

## Available Commands

Only commands currently defined in `package.json` are listed here.

```sh
npm install
npm start
npm run dev
npm run generate:regions
npm run validate:regions
npm run cloudflare:dev
npm run deploy
```

- `npm start`: runs `node src/server.js`
- `npm run dev`: runs `node --watch src/server.js`
- `npm run generate:regions`: generates versioned region JSON from the configured server-side source
- `npm run validate:regions`: validates generated region JSON shape and parent-child links
- `npm run cloudflare:dev`: runs the Cloudflare Worker locally with Wrangler
- `npm run deploy`: deploys the Worker with Wrangler
- Build: Not yet defined
- Test: Not yet defined
- Lint: Not yet defined
- Format: Not yet defined

## Current API

Full API documentation is available in [docs/API.md](./docs/API.md).
The app also serves a Swagger-like documentation UI at `/docs` and the OpenAPI spec at `/api/openapi.json`.

### Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-05-26T00:00:00.000Z",
  "services": {
    "supabase": {
      "configured": false,
      "authConfigured": false,
      "urlConfigured": false,
      "publishableKeyConfigured": false,
      "serviceRoleKeyConfigured": false
    }
  }
}
```

### Region Status

```http
GET /api/regions/status
```

Returns generated data readiness, present/missing files, and metadata.

### Metadata

```http
GET /api/regions/metadata
```

### Provinces

```http
GET /api/regions/provinces
GET /api/provinces
```

Region data routes require a Supabase user access token:

```http
Authorization: Bearer <access_token>
```

Direct region `.json` file access is blocked. Clients must use authenticated API routes.

### Cities/Regencies

```http
GET /api/regions/cities?province_code=31
GET /api/cities?province_code=31
```

### Districts/Kecamatan

```http
GET /api/regions/districts?city_code=3174
GET /api/districts?city_code=3174
```

### Villages/Kelurahan/Desa

```http
GET /api/regions/villages?district_code=317409
GET /api/villages?district_code=317409
```

Responses use the expected string-code shape:

```json
{
  "data": [
    {
      "code": "3174091001",
      "name": "JAGAKARSA",
      "district_code": "317409"
    }
  ]
}
```

## Cloudflare Deployment

Cloudflare Workers is configured in `wrangler.jsonc`.

Before deploying, authenticate Wrangler and set server-side secrets:

```sh
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_API_TOKEN
npm run deploy
```

## Planned Region Data Design

Preferred data source order:

1. Official Kemendagri / Ditjen Bina Administrasi Kewilayahan data, if accessible in a reliable machine-readable format or as a local import file.
2. API.co.id Indonesia Regional API as a fallback source.
3. Other public mirrors only when documented as non-authoritative fallback sources.

Generated records keep codes as strings and keep code/name separate:

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

## Region Data

The current committed dataset is intentionally scoped to DKI Jakarta (`province_code=31`) so the API is functional while keeping the initial checkpoint small. Metadata marks this as a partial dataset:

```json
{
  "scope": {
    "complete": false,
    "province_codes": ["31"]
  }
}
```

Generate another province:

```sh
npm run generate:regions -- --province-code 32
```

Generate the full Indonesia dataset:

```sh
npm run generate:regions -- --all --concurrency 8
```

Validate generated data:

```sh
npm run validate:regions
```

Generated data uses this versioned layout:

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

The API selection flow is:

```text
GET provinces
GET cities/regencies by province code
GET districts/kecamatan by city/regency code
GET villages/kelurahan/desa by district code
```

Update/regeneration routes must be protected with an admin token or API key from environment variables.

Regenerate through the protected server route:

```sh
curl -X POST http://localhost:3001/api/admin/regions/regenerate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -d '{"province_codes":["31"],"concurrency":8}'
```

Generate all provinces:

```sh
curl -X POST http://localhost:3001/api/admin/regions/regenerate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -d '{"all":true,"concurrency":8}'
```

The route runs server-side, writes `data/regions/current`, creates a timestamped version, and validates the output.

The logged-in browser UI also includes an admin panel for regeneration. Enter `ADMIN_API_TOKEN`, choose province codes or all provinces, then use the regeneration button. The UI shows loading and result notifications with at most three visible at once.

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
