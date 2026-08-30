-- Monterey County Health Department / Clinic Services dental pricing — effective 2026-07-01
-- Provider-owned county source; full-charge column only.
-- Physical dental practice mapping is supported by the County's passed acquisition of La Paz Dental Care for Clinic Services family dental operations.

INSERT INTO clinics (
  registry_id,state,city,zip,clinic_name,physical_address,clinic_type,county_fips,
  source_year,freshness,evidence_grade,price_basis,pricing_source_url,location_url,integrity_note,verified
)
VALUES (
  'CA-MONTEREY-LAPAZ-SALINAS','CA','Salinas','93905',
  'Monterey County Clinic Services – La Paz Dental Care',
  '559 E Alisal St, Suite 101, Salinas, CA 93905',
  'County FQHC / Family Dental Practice','06053',
  2026,'CURRENT','A-','Monterey County Health Department full charge (>200% FPL), effective 7/1/2026',
  'https://monterey.legistar.com/View.ashx?GUID=8EEA5BA0-845D-4321-B3D8-79829D66DAAA&ID=15485596&M=F',
  'https://www.lapazdental.com/',
  'County Board approved purchase of the La Paz Dental Care assets and premises for Clinic Services to operate a family dental practice; a 2026 amendment concerns the lease at the same 559 E Alisal location. Fee values are the Monterey County Health Department dental Full Charge column effective 7/1/2026.',
  true
)
ON CONFLICT (registry_id) DO UPDATE SET
  clinic_name=EXCLUDED.clinic_name,
  physical_address=EXCLUDED.physical_address,
  source_year=EXCLUDED.source_year,
  freshness=EXCLUDED.freshness,
  evidence_grade=EXCLUDED.evidence_grade,
  price_basis=EXCLUDED.price_basis,
  pricing_source_url=EXCLUDED.pricing_source_url,
  location_url=EXCLUDED.location_url,
  integrity_note=EXCLUDED.integrity_note,
  verified=true;

INSERT INTO clinic_prices (clinic_id,cdt_code,service_name,price)
VALUES
('CA-MONTEREY-LAPAZ-SALINAS','D0150','Comprehensive oral evaluation – new or established patient',153.00),
('CA-MONTEREY-LAPAZ-SALINAS','D0180','Comprehensive periodontal evaluation – new or established patient',163.00),
('CA-MONTEREY-LAPAZ-SALINAS','D0210','Intraoral comprehensive series of radiographic images',217.00),
('CA-MONTEREY-LAPAZ-SALINAS','D0274','Bitewings – four radiographic images',104.00),
('CA-MONTEREY-LAPAZ-SALINAS','D0330','Panoramic radiographic image',191.00)
ON CONFLICT (clinic_id,cdt_code) DO UPDATE SET
  service_name=EXCLUDED.service_name,
  price=EXCLUDED.price;
