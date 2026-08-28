const providerContacts = {
  'AK-ANCH-001': {
    phone: '907-743-7202',
    fax: '907-743-7255',
    email: 'dentalxrays@anhc.org',
    phoneScope: 'Dental clinic direct line',
    faxScope: 'Partner / records fax',
    emailScope: 'Dental clinic email',
    contactSource: 'https://www.anhc.org/contact',
    contactStatus: 'Verified from provider website',
    verifiedOn: '2026-08-27'
  },
  'FL-GNV-001': {
    phone: '352-334-8839',
    fax: null,
    email: 'ACHDdentalclinics@flhealth.gov',
    phoneScope: 'Dental scheduling line',
    faxScope: 'Dental fax not publicly listed',
    emailScope: 'Dental program email',
    contactSource: 'https://alachua.floridahealth.gov/programs-services/clinical-and-nutrition-services/dental-health/',
    contactStatus: 'Phone/email verified; fax needs confirmation',
    verifiedOn: '2026-08-27'
  },
  'FL-GNV-002': {
    phone: '352-334-8839',
    fax: null,
    email: 'ACHDdentalclinics@flhealth.gov',
    phoneScope: 'Dental scheduling line',
    faxScope: 'Dental fax not publicly listed',
    emailScope: 'Dental program email',
    contactSource: 'https://alachua.floridahealth.gov/programs-services/clinical-and-nutrition-services/dental-health/',
    contactStatus: 'Phone/email verified; fax needs confirmation',
    verifiedOn: '2026-08-27'
  },
  'OH-AKR-001': {
    phone: '330-812-3816',
    fax: '330-923-7558',
    email: 'info@scph.org',
    phoneScope: 'Dental clinic direct line',
    faxScope: 'SCPH fax published on dental intake materials',
    emailScope: 'Agency general email',
    contactSource: 'https://www.scph.org/dental/contact',
    contactStatus: 'Dental phone verified; agency fax/email',
    verifiedOn: '2026-08-27'
  },
  'PA-PHL-001': {
    phone: '215-684-5349',
    fax: '215-684-5375',
    email: 'dentalfpcc@dvch.org',
    phoneScope: 'Dental office direct line',
    faxScope: 'Dental office fax',
    emailScope: 'Dental office email',
    contactSource: 'https://dvch.org/contact-dvch/',
    contactStatus: 'Dental contact channels verified',
    verifiedOn: '2026-08-27'
  },
  'PA-PHL-002': {
    phone: '215-291-2509',
    fax: '215-291-2580',
    email: 'dentalmdls@dvch.org',
    phoneScope: 'Dental office direct line',
    faxScope: 'Dental office fax',
    emailScope: 'Dental office email',
    contactSource: 'https://dvch.org/contact-dvch/',
    contactStatus: 'Dental contact channels verified',
    verifiedOn: '2026-08-27'
  },
  'PA-NOR-001': {
    phone: '484-322-2449',
    fax: '484-322-2448',
    email: 'dentalnrhc@dvch.org',
    phoneScope: 'Dental office direct line',
    faxScope: 'Dental office fax',
    emailScope: 'Dental appointment email',
    contactSource: 'https://dvch.org/norristown-regional-health/',
    contactStatus: 'Dental contact channels verified',
    verifiedOn: '2026-08-27'
  },
  'NC-BURG-001': {
    phone: '910-259-1503',
    fax: '910-259-1511',
    email: 'Dental@pendercountync.gov',
    phoneScope: 'Dental clinic direct line',
    faxScope: 'Dental clinic fax',
    emailScope: 'Dental program email',
    contactSource: 'https://www.pendercountync.gov/223/Dental-Health-Program',
    contactStatus: 'Dental phone/fax verified; program email',
    verifiedOn: '2026-08-27'
  }
};

clinics.forEach((clinic) => {
  const fallback = providerContacts[clinic.id];
  if (!fallback) return;
  clinic.phone = clinic.phone || clinic.contact_phone || fallback.phone;
  clinic.fax = clinic.fax || clinic.contact_fax || fallback.fax;
  clinic.email = clinic.email || clinic.contact_email || fallback.email;
  clinic.phoneScope = clinic.phoneScope || clinic.phone_scope || fallback.phoneScope;
  clinic.faxScope = clinic.faxScope || clinic.fax_scope || fallback.faxScope;
  clinic.emailScope = clinic.emailScope || clinic.email_scope || fallback.emailScope;
  clinic.contactSource = clinic.contactSource || clinic.contact_source || fallback.contactSource;
  clinic.contactStatus = clinic.contactStatus || clinic.contact_status || fallback.contactStatus;
  clinic.contactVerifiedOn = clinic.contactVerifiedOn || clinic.contact_verified_on || fallback.verifiedOn;
});
