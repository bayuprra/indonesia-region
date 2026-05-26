# AGENTS.md

## Project Overview

This folder contains a minimal Express.js application.

- Runtime: Node.js
- Framework: Express
- Entry point: `src/server.js`
- Static assets: `public/`
- Current API endpoint: `GET /api/health`

This app is expected to support Indonesian administrative region data:

- Provinces
- Cities/regencies: kabupaten/kota
- Districts: kecamatan
- Villages: kelurahan/desa

The preferred direction is to fetch or generate region data periodically, store versioned static JSON, and expose it through API routes. Do not call third-party region APIs from the frontend at runtime.

## Development Commands

Only document commands that exist in `package.json`.

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

## Coding Style And Architecture

- Use CommonJS modules, matching the current `src/server.js` style.
- Keep server code under `src/`.
- Keep browser-served static files under `public/`.
- Add focused routes and middleware; avoid unrelated framework churn.
- Keep JSON responses explicit and predictable.
- Prefer small, readable modules once server logic grows beyond a single file.

## Indonesian Administrative Region Data

Future agents should treat region data as production data, not throwaway seed data.

- Prefer static generated JSON plus local API routes over live frontend API calls.
- API routes should read generated data, validate generated data, and support controlled updates/regeneration.
- Protect update/regeneration routes with an admin token or API key from environment variables.
- Avoid repeated runtime calls to third-party APIs for mostly-static administrative data.
- Do not expose third-party API keys in frontend or static files.
- Third-party API calls must happen server-side or in a local update script only.
- Preserve Indonesian region codes as strings. Do not coerce codes to numbers.
- Keep code and name as separate fields. Do not add a combined `code-name` value field to generated JSON; client code may build that format itself.
- Validate parent-child relationships:
  - Province -> city/regency
  - City/regency -> district
  - District -> village
- Include source metadata in generated data:
  - Source name
  - Source URL
  - Generation date
  - Source version or retrieval timestamp
- Keep flat and/or nested JSON formats if useful for the app.
- Add or maintain validation scripts/tests where possible.

Preferred source order:

1. Official Kemendagri / Ditjen Bina Administrasi Kewilayahan data, if accessible in a reliable machine-readable format or as a local import file.
2. API.co.id Indonesia Regional API as a fallback source.
3. Other public mirrors only when clearly documented as non-authoritative fallback sources.

One possible fallback source is API.co.id Indonesia Regional API:

https://docs.api.co.id/products/indonesia-regional#/Provinces/get_regional_indonesia_provinces

API.co.id may have request limits unless using a premium subscription, so do not design the app around live client-side calls to that API.

The intended selection flow is:

```text
GET provinces
GET cities/regencies by province code
GET districts/kecamatan by city/regency code
GET villages/kelurahan/desa by district code
```

Use clear naming so `kabupaten/kota` is not confused with `kecamatan`.

Expected record shape:

```json
{
  "code": "31",
  "name": "DKI JAKARTA"
}
```

Child records should include the parent code:

```json
{
  "code": "3172",
  "name": "KOTA JAKARTA TIMUR",
  "province_code": "31"
}
```

```json
{
  "code": "3172010",
  "name": "MATRAMAN",
  "city_code": "3172"
}
```

```json
{
  "code": "3172010001",
  "name": "PISANGAN BARU",
  "district_code": "3172010"
}
```

## Suggested Data Location

No region data generator exists yet.

When adding one, prefer a clear structure such as:

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

If the app only needs scoped payloads, split files by parent code, for example:

```text
data/regions/current/cities/{province_code}.json
data/regions/current/districts/{city_code}.json
data/regions/current/villages/{district_code}.json
```

Do not manually edit generated region JSON if a generator exists. Update the generator or source mapping instead, then regenerate.

## Data Update Workflow

Until scripts are added, this workflow is not yet automated.

When implementing the workflow:

1. Fetch region data from the selected source using a local script, protected server-side route, or controlled server-side job.
2. Normalize records while preserving codes as strings.
3. Generate static JSON files under `data/regions/current/` and a timestamped `data/regions/versions/` directory, or another documented versioned static-data directory.
4. Write metadata with source, generation date, and retrieval/version information.
5. Validate uniqueness, required fields, and parent-child relationships.
6. Run available checks before committing.

Current checks:

```sh
npm start
```

Test, lint, format, and build commands are not yet defined. Add scripts before documenting or requiring them.

## Security Notes

- Do not commit secrets.
- Do not commit API keys in static JSON.
- Do not put third-party API keys in frontend/client code.
- Use environment variables for credentials if a data-generation script needs API access.
- Use an environment-provided admin token or API key to protect update/regeneration API routes.
- Avoid logging secrets, raw API keys, or full credential-bearing URLs.
- Keep generated metadata auditable without exposing credentials.

## Performance Notes

- Serve mostly-static administrative data from generated JSON.
- Use browser/CDN caching where appropriate.
- Keep payloads scoped if the app does not need all levels at once.
- Avoid loading all provinces, cities, districts, and villages in one frontend request unless the UX requires it.
- Prefer deterministic generated files so deployments and rollbacks are reproducible.

## Testing Expectations

No automated tests are defined yet.

When adding region data handling, add validation scripts or tests for:

- Required fields and string codes.
- Duplicate codes.
- Missing parent records.
- Invalid province -> city/regency links.
- Invalid city/regency -> district links.
- Invalid district -> village links.
- JSON shape expected by frontend consumers.

## Git Hygiene

- Keep changes focused.
- Do not rewrite unrelated files.
- Do not touch nested projects unless the task explicitly requires it.
- Do not change generated region data manually if a generator exists.
- Commit generated data and generator changes together when generated JSON is required at runtime.

## Repo-Specific Caveats

- This Express app currently has no build, test, lint, or format scripts.
- `npm install` has generated `package-lock.json`; keep it in sync with `package.json`.
- The parent repository contains other application directories, but this guide is for this Express app folder only.
