import pg from 'pg';
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL not configured; skipping registry seed');
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const clinics = [
  {
    id:'NY-HHHN-TUCKER', state:'NY', city:'Warrensburg', zip:'12885',
    name:'Hudson Headwaters – Albert R. Tucker Dental Services Center',
    address:'3761 Main Street, Warrensburg, NY 12885', type:'FQHC Dental Center',
    sourceYear:2024, freshness:'REFRESH', grade:'A-', basis:'Master Dental Fee Schedule',
    source:'https://www.hhhn.org/wp-content/uploads/2024/04/2024-Fee-Schedules_01.8.24.pdf',
    location:'https://www.hhhn.org/locations/albert-r-tucker-dental-services-center/',
    note:'Current dental center confirmed on provider-owned site. Exact CDT prices from provider-owned master fee schedule; source year 2024, so refresh priority.',
    prices:{D0150:126,D0180:137,D0210:204,D0274:90,D0330:148}
  },
  {
    id:'SC-ROSA-CLARK-DENTAL', state:'SC', city:'Seneca', zip:'29678',
    name:'Rosa Clark Medical Clinic Dental Clinic',
    address:'210 S Oak St, Seneca, SC 29678', type:'FQHC Dental Clinic',
    sourceYear:2022, freshness:'LEGACY', grade:'A-', basis:'Above 200% FPL No Discount / prevailing local rate',
    source:'https://rosaclarkclinic.org/wp-content/uploads/2022/02/Dental-Sliding-Fee-Scale-2022.pdf',
    location:'https://rosaclarkclinic.org/',
    note:'Dental service remains active on provider-owned site. Exact CDT values are the undiscounted Above-200%-FPL column; older fee schedule retained as refresh-priority legacy evidence.',
    prices:{D0150:97,D0180:130,D0210:152,D0274:69,D0330:122}
  }
];

const serviceNames={
  D0150:'Comprehensive oral evaluation',
  D0180:'Comprehensive periodontal evaluation',
  D0210:'Intraoral comprehensive series',
  D0274:'Bitewings four images',
  D0330:'Panoramic radiographic image'
};

const client=await pool.connect();
try {
  await client.query('BEGIN');
  for (const c of clinics) {
    await client.query(`
      INSERT INTO clinics (
        registry_id,state,city,zip,clinic_name,physical_address,clinic_type,
        source_year,freshness,evidence_grade,price_basis,pricing_source_url,
        location_url,integrity_note,verified
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)
      ON CONFLICT (registry_id) DO UPDATE SET
        state=EXCLUDED.state, city=EXCLUDED.city, zip=EXCLUDED.zip,
        clinic_name=EXCLUDED.clinic_name, physical_address=EXCLUDED.physical_address,
        clinic_type=EXCLUDED.clinic_type, source_year=EXCLUDED.source_year,
        freshness=EXCLUDED.freshness, evidence_grade=EXCLUDED.evidence_grade,
        price_basis=EXCLUDED.price_basis, pricing_source_url=EXCLUDED.pricing_source_url,
        location_url=EXCLUDED.location_url, integrity_note=EXCLUDED.integrity_note,
        verified=true, updated_at=now()
    `,[c.id,c.state,c.city,c.zip,c.name,c.address,c.type,c.sourceYear,c.freshness,c.grade,c.basis,c.source,c.location,c.note]);

    for (const [code,price] of Object.entries(c.prices)) {
      await client.query(`
        INSERT INTO clinic_prices (clinic_id,cdt_code,service_name,price)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (clinic_id,cdt_code) DO UPDATE SET
          service_name=EXCLUDED.service_name, price=EXCLUDED.price
      `,[c.id,code,serviceNames[code],price]);
    }
  }
  await client.query('COMMIT');
  console.log(`Seeded ${clinics.length} clinics and ${clinics.reduce((n,c)=>n+Object.keys(c.prices).length,0)} target prices`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Registry seed failed:', error);
  process.exitCode=1;
} finally {
  client.release();
  await pool.end();
}
