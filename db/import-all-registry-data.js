import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not configured');
  process.exit(1);
}

const TARGET_CODES = new Set(['D0150','D0180','D0210','D0274','D0330']);
const serviceNames = {
  D0150:'Comprehensive oral evaluation',
  D0180:'Comprehensive periodontal evaluation',
  D0210:'Intraoral comprehensive series',
  D0274:'Bitewings four images',
  D0330:'Panoramic radiographic image'
};

const extraRecords = [
  {
    registry_id:'NY-HHHN-TUCKER', state:'NY', city:'Warrensburg', zip:'12885',
    clinic_name:'Hudson Headwaters – Albert R. Tucker Dental Services Center',
    address:'3761 Main Street, Warrensburg, NY 12885', clinic_type:'FQHC Dental Center',
    source_year:2024, freshness:'REFRESH', evidence_grade:'A-', price_basis:'Master Dental Fee Schedule',
    pricing_source_url:'https://www.hhhn.org/wp-content/uploads/2024/04/2024-Fee-Schedules_01.8.24.pdf',
    location_url:'https://www.hhhn.org/locations/albert-r-tucker-dental-services-center/',
    note:'Current dental center confirmed on provider-owned site. Exact CDT prices from provider-owned master fee schedule; source year 2024, so refresh priority.',
    prices:{D0150:126,D0180:137,D0210:204,D0274:90,D0330:148}
  },
  {
    registry_id:'SC-ROSA-CLARK-DENTAL', state:'SC', city:'Seneca', zip:'29678',
    clinic_name:'Rosa Clark Medical Clinic Dental Clinic',
    address:'210 S Oak St, Seneca, SC 29678', clinic_type:'FQHC Dental Clinic',
    source_year:2022, freshness:'LEGACY', evidence_grade:'A-', price_basis:'Above 200% FPL No Discount / prevailing local rate',
    pricing_source_url:'https://rosaclarkclinic.org/wp-content/uploads/2022/02/Dental-Sliding-Fee-Scale-2022.pdf',
    location_url:'https://rosaclarkclinic.org/',
    note:'Dental service remains active on provider-owned site. Exact CDT values are the undiscounted Above-200%-FPL column. D0180 is intentionally not mapped from the source typo.',
    prices:{D0150:97,D0210:152,D0274:69,D0330:122}
  },
  {
    registry_id:'IL-WILL-CHC-DENTAL', state:'IL', city:'Joliet', zip:'60433',
    clinic_name:'Will County Community Health Center Dental Clinic',
    address:'1106 Neal Avenue, Joliet, IL 60433', clinic_type:'County Community Health Center Dental Clinic',
    source_year:2024, freshness:'REFRESH', evidence_grade:'A-', price_basis:'Full Fee',
    pricing_source_url:'https://willcountyhealth.org/wp-content/uploads/2024/05/BOH-PACKET-L-6.pdf',
    location_url:'https://willcountyhealth.org/community-health-center/dental-services/',
    note:'Active full-service dental clinic for adults and children confirmed on county health department site.',
    prices:{D0150:110,D0210:175,D0274:82,D0330:150}
  },
  {
    registry_id:'AZ-YAVAPAI-PRESCOTT-VALLEY-DENTAL', state:'AZ', city:'Prescott Valley', zip:'86314',
    clinic_name:'Community Health Center of Yavapai – Prescott Valley Dental',
    address:'3212 North Windsong Drive, Suite 200, Prescott Valley, AZ 86314', clinic_type:'County FQHC Dental Clinic',
    source_year:2026, freshness:'CURRENT', evidence_grade:'A', price_basis:'Full Fee / >200% FPL Full Fee',
    pricing_source_url:'https://www.yavapaiaz.gov/files/sharedassets/public/v/1/resident-services/community-health/documents/fee-schedule-dental-1.pdf',
    location_url:'https://www.yavapaiaz.gov/Resident-Services/Health-Services/Community-Health-Center-of-Yavapai',
    note:'Official county 2026 dental fee schedule effective 8/1/2025.',
    prices:{D0150:132,D0180:139,D0210:185,D0274:90}
  },
  {
    registry_id:'AZ-YAVAPAI-COTTONWOOD-DENTAL', state:'AZ', city:'Cottonwood', zip:'86326',
    clinic_name:'Community Health Center of Yavapai – Cottonwood Dental',
    address:'51 South Brian Mickelsen Parkway, Cottonwood, AZ 86326', clinic_type:'County FQHC Dental Clinic',
    source_year:2026, freshness:'CURRENT', evidence_grade:'A', price_basis:'Full Fee / >200% FPL Full Fee',
    pricing_source_url:'https://www.yavapaiaz.gov/files/sharedassets/public/v/1/resident-services/community-health/documents/fee-schedule-dental-1.pdf',
    location_url:'https://www.yavapaiaz.gov/Resident-Services/Health-Services/Community-Health-Center-of-Yavapai',
    note:'Official county 2026 dental fee schedule effective 8/1/2025.',
    prices:{D0150:132,D0180:139,D0210:185,D0274:90}
  },
  {
    registry_id:'NY-BMS-ASHFORD', state:'NY', city:'Brooklyn', zip:'11207',
    clinic_name:'BMS@ASHFORD – Dental', address:'650 Ashford Street, Brooklyn, NY 11207',
    clinic_type:'FQHC / Community Health Center', county_fips:'36047', source_year:2026,
    freshness:'CURRENT', evidence_grade:'A', price_basis:'2026 BMS full fee (0% discount / 201%+ FPL)',
    pricing_source_url:'https://bmsfamilyhealth.org/sliding-fee-schedule-2/',
    location_url:'https://bmsfamilyhealth.org/locations/',
    note:'BMS 2026 sliding-fee table states patients above 200% FPL or without documentation are charged full fee.',
    prices:{D0150:78,D0180:63}
  },
  {
    registry_id:'NY-BMS-BRISTOL', state:'NY', city:'Brooklyn', zip:'11212',
    clinic_name:'BMS@BRISTOL – Dental', address:'259 Bristol Street, 1st and 3rd Floor, Brooklyn, NY 11212',
    clinic_type:'FQHC / Community Health Center', county_fips:'36047', source_year:2026,
    freshness:'CURRENT', evidence_grade:'A', price_basis:'2026 BMS full fee (0% discount / 201%+ FPL)',
    pricing_source_url:'https://bmsfamilyhealth.org/sliding-fee-schedule-2/',
    location_url:'https://bmsfamilyhealth.org/locations/',
    note:'BMS 2026 sliding-fee table states patients above 200% FPL or without documentation are charged full fee.',
    prices:{D0150:78,D0180:63}
  },
  {
    registry_id:'NJ-EIC-JERSEY-CITY', state:'NJ', city:'Jersey City', zip:'07306',
    clinic_name:'Eastern International College Dental Hygiene Clinic', address:'684 Newark Avenue, Jersey City, NJ 07306',
    clinic_type:'Dental Hygiene Teaching Clinic', county_fips:'34017', source_year:2026,
    freshness:'CURRENT', evidence_grade:'A', price_basis:'2025–2026 clinic fee schedule; direct-pay patient fees',
    pricing_source_url:'https://eicollege.edu/wp-content/uploads/2026/01/BSDH-CLINIC-MANUAL-FALL-2025-2026-compressed-1.pdf',
    location_url:'https://eicollege.edu/dental-clinic/',
    note:'Clinic does not accept insurance; patients pay directly.',
    prices:{D0150:0,D0210:25,D0274:25,D0330:25}
  },
  {
    registry_id:'CA-MONTEREY-LAPAZ-SALINAS', state:'CA', city:'Salinas', zip:'93905',
    clinic_name:'Monterey County Clinic Services – La Paz Dental Care',
    address:'559 E Alisal St, Suite 101, Salinas, CA 93905',
    clinic_type:'County FQHC / Family Dental Practice', county_fips:'06053', source_year:2026,
    freshness:'CURRENT', evidence_grade:'A-', price_basis:'Monterey County Health Department full charge (>200% FPL), effective 7/1/2026',
    pricing_source_url:'https://monterey.legistar.com/View.ashx?GUID=8EEA5BA0-845D-4321-B3D8-79829D66DAAA&ID=15485596&M=F',
    location_url:'https://www.lapazdental.com/',
    note:'County Board approved purchase of La Paz Dental Care assets and premises for Clinic Services to operate a family dental practice.',
    prices:{D0150:153,D0180:163,D0210:217,D0274:104,D0330:191}
  }
];

function normalizeText(v='') {
  return String(v || '').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]/g,'');
}
function normalizeAddress(v='') {
  return normalizeText(String(v || '').replace(/\b(suite|ste|unit|floor|fl)\b/gi,''));
}
function normalizeRecord(raw) {
  const r = {
    registry_id: raw.registry_id || raw.id,
    state: raw.state,
    city: raw.city,
    zip: String(raw.zip || ''),
    clinic_name: raw.clinic_name || raw.clinic || raw.name,
    address: raw.address || raw.physical_address || '',
    clinic_type: raw.clinic_type || raw.type || '',
    county_fips: raw.county_fips || '',
    longitude: raw.longitude ?? null,
    latitude: raw.latitude ?? null,
    source_year: raw.source_year ?? raw.sourceYear ?? null,
    freshness: raw.freshness || null,
    evidence_grade: raw.evidence_grade || raw.grade || null,
    price_basis: raw.price_basis || raw.basis || null,
    pricing_source_url: raw.pricing_source_url || raw.source || null,
    location_url: raw.location_url || raw.locationUrl || raw.location || null,
    note: raw.note || raw.integrity_note || null,
    phone: raw.phone || null,
    fax: raw.fax || null,
    email: raw.email || null,
    prices: {}
  };
  for (const [code, value] of Object.entries(raw.prices || {})) {
    if (TARGET_CODES.has(code) && value !== null && value !== undefined && value !== '') {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) r.prices[code] = n;
    }
  }
  if (!r.registry_id || !r.state || !r.city || !r.clinic_name) return null;
  return r;
}

function candidateKey(r) {
  const addr = normalizeAddress(r.address);
  if (addr) return 'a:' + addr;
  return 'n:' + normalizeText(r.clinic_name) + '|' + normalizeText(r.city) + '|' + normalizeText(r.state);
}

async function verifyApiKey() {
  if (!process.env.NEON_API_KEY) return;
  try {
    const resp = await fetch('https://console.neon.tech/api/v2/projects?limit=1', {
      headers: { Authorization: 'Bearer ' + process.env.NEON_API_KEY }
    });
    if (resp.ok) console.log('Neon API key authentication verified');
    else console.log('Neon API key check returned HTTP ' + resp.status + '; continuing with DATABASE_URL');
  } catch (e) {
    console.log('Neon API key check unavailable; continuing with DATABASE_URL');
  }
}

const candidates = [];
for (const x of extraRecords) {
  const n = normalizeRecord(x);
  if (n) candidates.push(n);
}

const seedPath = path.join(root, 'db', 'seed-clinics.json');
if (fs.existsSync(seedPath)) {
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  for (const x of seed) {
    const n = normalizeRecord(x);
    if (n) candidates.push(n);
  }
}

const dataDir = path.join(root, 'data');
if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json')).sort();
  for (const file of files) {
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      const records = Array.isArray(doc) ? doc : (doc.status === 'VERIFIED_PENDING_NEON' && Array.isArray(doc.records) ? doc.records : []);
      for (const x of records) {
        const n = normalizeRecord(x);
        if (n) candidates.push(n);
      }
    } catch (e) {
      console.log('Skipping unreadable JSON file:', file);
    }
  }
}

// Later files override older duplicates inside the import set.
const unique = new Map();
const idAlias = new Map();
for (const r of candidates) {
  const k = candidateKey(r);
  if (unique.has(k)) {
    const previous = unique.get(k);
    idAlias.set(r.registry_id, previous.registry_id);
    // Prefer the later record's metadata and prices; preserve canonical registry_id from the first record.
    unique.set(k, { ...r, registry_id: previous.registry_id });
  } else {
    unique.set(k, r);
  }
}
const records = [...unique.values()];

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const client = await pool.connect();

let insertedClinics = 0;
let skippedClinics = 0;
let insertedPrices = 0;
let skippedPrices = 0;
let insertedContacts = 0;

try {
  await verifyApiKey();
  const schema = fs.readFileSync(path.join(root, 'db', 'schema.sql'), 'utf8');
  await client.query(schema);

  const existing = (await client.query(`
    SELECT registry_id, clinic_name, city, state, physical_address
    FROM clinics
  `)).rows;

  const byId = new Map();
  const byAddr = new Map();
  const byNameCity = new Map();
  for (const row of existing) {
    byId.set(row.registry_id, row.registry_id);
    const a = normalizeAddress(row.physical_address);
    if (a) byAddr.set(a, row.registry_id);
    byNameCity.set(normalizeText(row.clinic_name)+'|'+normalizeText(row.city)+'|'+normalizeText(row.state), row.registry_id);
  }

  await client.query('BEGIN');

  for (const r of records) {
    const nameKey = normalizeText(r.clinic_name)+'|'+normalizeText(r.city)+'|'+normalizeText(r.state);
    const addrKey = normalizeAddress(r.address);
    let targetId = byId.get(r.registry_id) || (addrKey ? byAddr.get(addrKey) : null) || byNameCity.get(nameKey);

    if (!targetId) {
      await client.query(`
        INSERT INTO clinics (
          registry_id,state,city,zip,clinic_name,physical_address,clinic_type,county_fips,
          longitude,latitude,source_year,freshness,evidence_grade,price_basis,
          pricing_source_url,location_url,integrity_note,verified
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true
        )
        ON CONFLICT (registry_id) DO NOTHING
      `,[
        r.registry_id,r.state,r.city,r.zip || '',r.clinic_name,r.address || null,r.clinic_type || null,r.county_fips || null,
        r.longitude,r.latitude,r.source_year,r.freshness,r.evidence_grade,r.price_basis,
        r.pricing_source_url,r.location_url,r.note
      ]);
      targetId = r.registry_id;
      insertedClinics++;
      byId.set(targetId,targetId);
      if (addrKey) byAddr.set(addrKey,targetId);
      byNameCity.set(nameKey,targetId);
    } else {
      skippedClinics++;
    }

    const existingCodes = new Set((await client.query(
      'SELECT cdt_code FROM clinic_prices WHERE clinic_id=$1',
      [targetId]
    )).rows.map(x => x.cdt_code));

    for (const [code, price] of Object.entries(r.prices)) {
      if (existingCodes.has(code)) {
        skippedPrices++;
        continue;
      }
      await client.query(`
        INSERT INTO clinic_prices (clinic_id,cdt_code,service_name,price)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (clinic_id,cdt_code) DO NOTHING
      `,[targetId,code,serviceNames[code] || code,price]);
      insertedPrices++;
      existingCodes.add(code);
    }

    if (r.phone || r.fax || r.email) {
      const existsContact = await client.query('SELECT 1 FROM clinic_contacts WHERE clinic_id=$1',[targetId]);
      if (existsContact.rowCount === 0) {
        await client.query(`
          INSERT INTO clinic_contacts (clinic_id,phone,fax,email,contact_source_url,contact_status,verified_on)
          VALUES ($1,$2,$3,$4,$5,'VERIFIED',CURRENT_DATE)
          ON CONFLICT (clinic_id) DO NOTHING
        `,[targetId,r.phone,r.fax,r.email,r.location_url || r.pricing_source_url]);
        insertedContacts++;
      }
    }
  }

  await client.query('COMMIT');

  const totals = await client.query(`
    SELECT
      (SELECT count(*)::int FROM clinics) AS clinics,
      (SELECT count(*)::int FROM clinic_prices) AS prices,
      (SELECT count(DISTINCT state)::int FROM clinics) AS states,
      (SELECT count(*)::int FROM clinic_prices WHERE cdt_code='D0180') AS d0180
  `);

  console.log(JSON.stringify({
    candidates:candidates.length,
    uniqueCandidates:records.length,
    insertedClinics,
    skippedClinics,
    insertedPrices,
    skippedPrices,
    insertedContacts,
    totals:totals.rows[0]
  }));
} catch (error) {
  try { await client.query('ROLLBACK'); } catch {}
  console.error('Registry import failed:', error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
