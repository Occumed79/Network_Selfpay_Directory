CREATE TABLE IF NOT EXISTS clinics (
  registry_id text PRIMARY KEY,
  state text NOT NULL,
  city text NOT NULL,
  zip text NOT NULL,
  clinic_name text NOT NULL,
  physical_address text,
  clinic_type text,
  county_fips text,
  longitude double precision,
  latitude double precision,
  source_year integer,
  freshness text,
  evidence_grade text,
  price_basis text,
  pricing_source_url text,
  location_url text,
  integrity_note text,
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_prices (
  id bigserial PRIMARY KEY,
  clinic_id text NOT NULL REFERENCES clinics(registry_id) ON DELETE CASCADE,
  cdt_code text NOT NULL CHECK (cdt_code IN ('D0150','D0180','D0210','D0274','D0330')),
  service_name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  UNIQUE (clinic_id, cdt_code)
);

CREATE TABLE IF NOT EXISTS clinic_contacts (
  clinic_id text PRIMARY KEY REFERENCES clinics(registry_id) ON DELETE CASCADE,
  phone text,
  fax text,
  email text,
  phone_scope text,
  fax_scope text,
  email_scope text,
  contact_source_url text,
  contact_status text,
  verified_on date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clinics_state_city_idx ON clinics(state, city);
CREATE INDEX IF NOT EXISTS clinics_county_fips_idx ON clinics(county_fips);
CREATE INDEX IF NOT EXISTS clinic_prices_code_idx ON clinic_prices(cdt_code);
CREATE INDEX IF NOT EXISTS clinic_contacts_email_idx ON clinic_contacts(email);
