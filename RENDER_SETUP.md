# Render deployment

Create one **Web Service** from this repository.

## Service settings

- Repository: `Occumed79/Network_Selfpay_Directory`
- Branch: `main`
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

## Environment variables

Add these in Render before the first production deploy:

- `MAPTILER_KEY` — the MapTiler browser key restricted to the Render domain
- `DATABASE_URL` — pooled connection string from the dedicated Neon project
- `NODE_ENV=production`

Render supplies `PORT` automatically.

## MapTiler behavior

The browser does not ask the user for a key. The app requests `/api/config`, and the Express service returns the configured MapTiler key to the client. Restrict the MapTiler key to the deployed Render origin.

## Database

The application is prepared for the `clinics` and `clinic_prices` tables defined in `db/schema.sql`. The current visual build also includes the eight verified seed clinics in the front-end so the interface can render before the live database migration is completed.
