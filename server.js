import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;
const indexPath = fileURLToPath(new URL('./public/index.html', import.meta.url));

app.disable('x-powered-by');
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public', { maxAge: '1h' }));

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

app.get('/api/health', async (_req, res) => {
  let database = 'not-configured';
  if (pool) {
    try {
      await pool.query('select 1');
      database = 'ok';
    } catch {
      database = 'error';
    }
  }
  res.json({ ok: true, database });
});

app.get('/api/config', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ maptilerKey: process.env.MAPTILER_KEY || '' });
});

app.get('/api/clinics', async (_req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  }

  try {
    const { rows } = await pool.query(`
      select
        c.registry_id as id,
        c.state,
        c.city,
        c.zip,
        c.clinic_name as clinic,
        c.physical_address as address,
        c.clinic_type as type,
        c.county_fips,
        c.longitude,
        c.latitude,
        c.source_year as "sourceYear",
        c.freshness,
        c.evidence_grade as grade,
        c.price_basis as basis,
        c.pricing_source_url as source,
        c.location_url as "locationUrl",
        c.integrity_note as note,
        coalesce(jsonb_object_agg(p.cdt_code, p.price) filter (where p.cdt_code is not null), '{}'::jsonb) as prices
      from clinics c
      left join clinic_prices p on p.clinic_id = c.registry_id
      where c.verified = true
      group by c.registry_id
      order by c.state, c.city, c.clinic_name
    `);

    const clinics = rows.map((row) => {
      const prices = {
        D0150: row.prices.D0150 == null ? null : Number(row.prices.D0150),
        D0180: row.prices.D0180 == null ? null : Number(row.prices.D0180),
        D0210: row.prices.D0210 == null ? null : Number(row.prices.D0210),
        D0274: row.prices.D0274 == null ? null : Number(row.prices.D0274),
        D0330: row.prices.D0330 == null ? null : Number(row.prices.D0330),
      };
      const pricePoints = Object.values(prices).filter((v) => v != null).length;
      return {
        ...row,
        prices,
        pricePoints,
        coverage: Math.round((pricePoints / 5) * 100),
        lnglat: row.longitude == null || row.latitude == null ? null : [Number(row.longitude), Number(row.latitude)],
      };
    });

    res.json({ clinics });
  } catch (error) {
    console.error('Clinic API error:', error);
    res.status(500).json({ error: 'Unable to load clinic registry' });
  }
});

app.get('/{*splat}', (_req, res) => {
  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`Network Selfpay Directory listening on port ${port}`);
});
