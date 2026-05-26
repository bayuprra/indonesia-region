# API Documentation

Base URL for local development:

```text
http://localhost:3001
```

The default runtime port is `3000`. This workspace currently runs the local server on `3001`.

All responses are JSON. Region codes are strings and must be treated as strings by clients.

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
      "urlConfigured": true,
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

## Provinces

### `GET /api/regions/provinces`

Alias:

```text
GET /api/provinces
```

Returns all generated provinces.

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

## Static JSON

The current generated files are also served as static JSON:

```text
/regions/current/metadata.json
/regions/current/provinces.json
/regions/current/cities.json
/regions/current/districts.json
/regions/current/villages.json
```

These files are useful for CDN/static access, including Cloudflare assets.

## Errors

### Missing Query Parameter

Status: `400`

Example:

```json
{
  "error": "province_code is required"
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
