# API Documentation

Base URL for local development:

```text
http://localhost:3001
```

The default runtime port is `3000`. This workspace currently runs the local server on `3001`.

All responses are JSON. Region codes are strings and must be treated as strings by clients.

Region data endpoints require a Supabase user access token. Use `POST /api/auth/login` to obtain one.
Users must exist in Supabase Auth before they can sign in.
Direct region `.json` file access is blocked. Use authenticated API routes instead.

## Health

### `GET /api/health`

Returns service status, uptime, Supabase configuration status, and generated region data status.

Example:

```sh
curl http://localhost:3001/api/health
```

Response:

```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-05-26T04:45:45.275Z",
  "services": {
    "supabase": {
      "configured": true,
      "authConfigured": true,
      "urlConfigured": true,
      "publishableKeyConfigured": true,
      "serviceRoleKeyConfigured": true
    },
    "regions": {
      "ready": true,
      "presentFiles": [
        "metadata.json",
        "provinces.json",
        "cities.json",
        "districts.json",
        "villages.json"
      ],
      "missingFiles": [],
      "metadata": {
        "generated_at": "2026-05-26T04:44:32.281Z",
        "counts": {
          "provinces": 1,
          "cities": 6,
          "districts": 44,
          "villages": 267
        }
      }
    }
  }
}
```

## Region Metadata

### `GET /api/regions/status`

Returns whether generated region files are present, plus metadata when available.

### `GET /api/regions/metadata`

Returns source, generation, scope, and count metadata.

Authentication:

```http
Authorization: Bearer <access_token>
```

Example response:

```json
{
  "generated_at": "2026-05-26T04:44:32.281Z",
  "source": {
    "name": "Wilayah.id public mirror",
    "url": "https://wilayah.id",
    "api_base_url": "https://wilayah.id/api",
    "version": "2025-07-04",
    "retrieved_at": "2026-05-26T04:44:32.281Z",
    "note": "Non-authoritative fallback mirror. It documents data derived from Kepmendagri and cahyadsn/wilayah."
  },
  "scope": {
    "complete": false,
    "province_codes": ["31"]
  },
  "counts": {
    "provinces": 1,
    "cities": 6,
    "districts": 44,
    "villages": 267
  }
}
```

## Authentication

### `POST /api/auth/login`

Signs in with Supabase email/password auth and returns a user access token.

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "user": {
    "id": "00000000-0000-0000-0000-000000000000",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "<jwt>",
    "refresh_token": "<refresh-token>",
    "expires_at": 1770000000,
    "token_type": "bearer"
  }
}
```

### `GET /api/auth/me`

Returns the authenticated user for the provided bearer token.

### `POST /api/auth/logout`

Returns `{"status":"ok"}`. The browser clears the local session token.

## Provinces

### `GET /api/regions/provinces`

Alias:

```text
GET /api/provinces
```

Returns all generated provinces.

Authentication:

```http
Authorization: Bearer <access_token>
```

Example:

```sh
curl http://localhost:3001/api/regions/provinces
```

Response:

```json
{
  "data": [
    {
      "code": "31",
      "name": "DKI JAKARTA"
    }
  ]
}
```

## Cities And Regencies

### `GET /api/regions/cities?province_code={province_code}`

Alias:

```text
GET /api/cities?province_code={province_code}
```

Returns kabupaten/kota records for a province.

Authentication:

```http
Authorization: Bearer <access_token>
```

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `province_code` | Yes | Province code, for example `31`. |

Example:

```sh
curl "http://localhost:3001/api/regions/cities?province_code=31"
```

Response:

```json
{
  "data": [
    {
      "code": "3174",
      "name": "KOTA ADMINISTRASI JAKARTA SELATAN",
      "province_code": "31"
    }
  ]
}
```

## Districts

### `GET /api/regions/districts?city_code={city_code}`

Alias:

```text
GET /api/districts?city_code={city_code}
```

Returns kecamatan records for a city/regency.

Authentication:

```http
Authorization: Bearer <access_token>
```

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `city_code` | Yes | City/regency code, for example `3174`. |

Example:

```sh
curl "http://localhost:3001/api/regions/districts?city_code=3174"
```

Response:

```json
{
  "data": [
    {
      "code": "317409",
      "name": "JAGAKARSA",
      "city_code": "3174"
    }
  ]
}
```

## Villages

### `GET /api/regions/villages?district_code={district_code}`

Alias:

```text
GET /api/villages?district_code={district_code}
```

Returns kelurahan/desa records for a district.

Authentication:

```http
Authorization: Bearer <access_token>
```

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `district_code` | Yes | District code, for example `317409`. |

Example:

```sh
curl "http://localhost:3001/api/regions/villages?district_code=317409"
```

Response:

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

## Admin Regeneration

### `POST /api/admin/regions/regenerate`

Regenerates region JSON server-side, writes the current dataset, creates a timestamped version, and validates the generated output.

This endpoint requires `ADMIN_API_TOKEN` to be configured on the server.

Authentication headers, choose one:

```http
Authorization: Bearer <ADMIN_API_TOKEN>
```

```http
x-admin-token: <ADMIN_API_TOKEN>
```

Regenerate selected provinces:

```sh
curl -X POST http://localhost:3001/api/admin/regions/regenerate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -d '{"province_codes":["31"],"concurrency":8}'
```

Regenerate all provinces:

```sh
curl -X POST http://localhost:3001/api/admin/regions/regenerate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -d '{"all":true,"concurrency":8}'
```

Request body:

| Name | Required | Description |
| --- | --- | --- |
| `province_codes` | Required unless `all=true` | Array of province codes, or a comma-separated string. |
| `all` | Required unless `province_codes` is set | Boolean. When `true`, regenerates all provinces and children. |
| `concurrency` | No | Fetch concurrency from `1` to `16`. Defaults to `8`. |

Success response:

```json
{
  "status": "ok",
  "metadata": {
    "generated_at": "2026-05-26T04:44:32.281Z",
    "scope": {
      "complete": false,
      "province_codes": ["31"]
    },
    "counts": {
      "provinces": 1,
      "cities": 6,
      "districts": 44,
      "villages": 267
    }
  },
  "version_dir": "/path/to/data/regions/versions/2026-05-26T04-44-35Z"
}
```

## Errors

### Authentication Required

Status: `401`

Example:

```json
{
  "error": "Authentication required"
}
```

### Admin Token Not Configured

Status: `503`

Example:

```json
{
  "error": "Admin API token is not configured"
}
```

### Unauthorized

Status: `401`

Example:

```json
{
  "error": "Unauthorized"
}
```

### Missing Query Parameter

Status: `400`

Example:

```json
{
  "error": "province_code is required"
}
```

### Invalid Regeneration Request

Status: `400`

Examples:

```json
{
  "error": "Choose all=true or provide province_codes"
}
```

```json
{
  "error": "concurrency must be an integer from 1 to 16"
}
```

### Data Not Generated

Status: `503`

Example:

```json
{
  "error": "Regions data is not generated",
  "message": "Regions dataset not found: provinces.json"
}
```

### Not Found

Status: `404`

Example:

```json
{
  "error": "Not Found"
}
```

### Direct JSON Access Not Allowed

Status: `403`

Example:

```json
{
  "error": "Direct region JSON access is not allowed"
}
```

## Current Dataset Scope

The committed dataset currently contains DKI Jakarta only:

```json
{
  "complete": false,
  "province_codes": ["31"]
}
```

Generate more data with:

```sh
npm run generate:regions -- --province-code 32
npm run generate:regions -- --all --concurrency 8
```

Validate generated data with:

```sh
npm run validate:regions
```
