# Network Selfpay Directory

Interactive national self-pay pricing registry for Occu-Med.

## Current focus

Dental posted-price intelligence for the five operational CDT targets:

- D0150 — Comprehensive evaluation
- D0180 — Comprehensive periodontal evaluation
- D0210 — Full-mouth series
- D0274 — 4 bitewings
- D0330 — Panoramic radiograph

## Stack

- Node / Express web service
- Apple-inspired scrollytelling front end
- MapTiler for the interactive clinic map
- D3 + U.S. county TopoJSON for the choropleth heat map
- Neon Postgres for persistent registry data
- Render for hosting

## Neon

Neon is the production source of truth for clinic and price records. The browser requests live registry data through `GET /api/clinics`; the server connects to Neon using `DATABASE_URL`. The original embedded seed remains only as an automatic front-end fallback if the database/API is temporarily unavailable.

Current production seed:

- 8 verified clinic locations
- 26 verified target-code price points
- 5 CDT target codes

Database schema is maintained in `db/schema.sql`.

## Environment variables

Copy `.env.example` and configure these values in Render:

- `MAPTILER_KEY`
- `DATABASE_URL`
- `PORT` (Render supplies this automatically)

`DATABASE_URL` stays server-side. The MapTiler browser key is delivered through `/api/config`, so users do not have to paste it into the interface.

## Local run

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## API

- `GET /api/health`
- `GET /api/config`
- `GET /api/clinics`
