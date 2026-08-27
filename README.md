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

## Environment variables

Copy `.env.example` and configure these values in Render:

- `MAPTILER_KEY`
- `DATABASE_URL`
- `PORT` (Render supplies this automatically)

The MapTiler key is delivered to the browser through `/api/config`, so users do not have to paste it into the interface.

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

The current front end ships with the verified seed registry embedded so the interface remains usable while the Neon-backed live data layer is being activated.
