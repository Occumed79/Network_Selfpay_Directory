-- Verified pricing wave — 2026-08-30
-- Sources are provider-owned/current. This seed is idempotent.

INSERT INTO clinics (registry_id,state,city,zip,clinic_name,physical_address,clinic_type,county_fips,source_year,freshness,evidence_grade,price_basis,pricing_source_url,location_url,integrity_note,verified)
VALUES
('NY-BMS-ASHFORD','NY','Brooklyn','11207','BMS@ASHFORD – Dental','650 Ashford Street, Brooklyn, NY 11207','FQHC / Community Health Center','36047',2026,'CURRENT','A','2026 BMS full fee (0% discount / 201%+ FPL)','https://bmsfamilyhealth.org/sliding-fee-schedule-2/','https://bmsfamilyhealth.org/locations/','BMS 2026 sliding-fee table states patients above 200% FPL or without documentation are charged full fee. D0150 appears in a combined D0120/D0150 oral-evaluation row; same full-fee amount applies to both listed codes.',true),
('NY-BMS-BRISTOL','NY','Brooklyn','11212','BMS@BRISTOL – Dental','259 Bristol Street, 1st and 3rd Floor, Brooklyn, NY 11212','FQHC / Community Health Center','36047',2026,'CURRENT','A','2026 BMS full fee (0% discount / 201%+ FPL)','https://bmsfamilyhealth.org/sliding-fee-schedule-2/','https://bmsfamilyhealth.org/locations/','BMS 2026 sliding-fee table states patients above 200% FPL or without documentation are charged full fee. D0150 appears in a combined D0120/D0150 oral-evaluation row; same full-fee amount applies to both listed codes.',true),
('NJ-EIC-JERSEY-CITY','NJ','Jersey City','07306','Eastern International College Dental Hygiene Clinic','684 Newark Avenue, Jersey City, NJ 07306','Dental Hygiene Teaching Clinic','34017',2026,'CURRENT','A','2025–2026 clinic fee schedule; direct-pay patient fees','https://eicollege.edu/wp-content/uploads/2026/01/BSDH-CLINIC-MANUAL-FALL-2025-2026-compressed-1.pdf','https://eicollege.edu/dental-clinic/','Clinic does not accept insurance; patients pay directly. Manual lists Exam $0.00 with D0150 among mapped diagnostic codes and Radiographs $25.00 with D0210, D0274 and D0330 among mapped codes. D0150 description in manual is nonstandard (Adolescent Periodic Exam), preserved as source integrity note.',true)
ON CONFLICT (registry_id) DO UPDATE SET
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
('NY-BMS-ASHFORD','D0150','Comprehensive oral evaluation – source full-fee row D0120/D0150',78),
('NY-BMS-ASHFORD','D0180','Comprehensive periodontal evaluation – new or established patient',63),
('NY-BMS-BRISTOL','D0150','Comprehensive oral evaluation – source full-fee row D0120/D0150',78),
('NY-BMS-BRISTOL','D0180','Comprehensive periodontal evaluation – new or established patient',63),
('NJ-EIC-JERSEY-CITY','D0150','D0150 – source maps under Exam',0),
('NJ-EIC-JERSEY-CITY','D0210','Intraoral comprehensive series – source maps under Radiographs',25),
('NJ-EIC-JERSEY-CITY','D0274','Bitewings four images – source maps under Radiographs',25),
('NJ-EIC-JERSEY-CITY','D0330','Panoramic radiograph – source maps under Radiographs',25)
ON CONFLICT (clinic_id,cdt_code) DO UPDATE SET
  service_name=EXCLUDED.service_name,
  price=EXCLUDED.price;
