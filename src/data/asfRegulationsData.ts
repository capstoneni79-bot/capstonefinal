import { ASFRegulatoryDocument } from '../types';

export const MUNICIPAL_ORDINANCE_2025_59: ASFRegulatoryDocument = {
  id: 'mo-hinunangan-2025-59',
  type: 'municipal_ordinance',
  category: 'ordinance',
  title:
    'AN ORDINANCE REGULATING THE OPERATIONS OF COMMERCIAL AND BACKYARD PIGGERY, POULTRY, AND OTHER LIVESTOCK OR ANIMAL FARMS IN HINUNANGAN, SOUTHERN LEYTE REVISING FOR THE PURPOSE MUNICIPAL ORDINANCE NO. 2000-02 OTHERWISE KNOWN AS "AN ORDINANCE REGULATING THE HOG RAISING IN THIS MUNICIPALITY"',
  knownAs: 'Piggery and Poultry Regulation Ordinance',
  officialNumber: 'Municipal Ordinance No. 2025-59',
  seriesYear: 'Series of 2025',
  jurisdiction: 'Municipality of Hinunangan, Southern Leyte',
  issuingAuthority: 'Sangguniang Bayan of Hinunangan, Southern Leyte',
  author: 'Hon. Gezar S. Ngoho',
  signatory: 'Hon. Reynaldo C. Fontenilla',
  signatoryTitle: 'Municipal Mayor (Presiding Officer: Hon. Tito T. Burlaza, Municipal Vice Mayor)',
  dateEnacted: 'March 3, 2025',
  effectiveDate: 'March 18, 2025 (15 days after municipal posting)',
  status: 'active',
  shortSummary:
    'Comprehensive municipal statute regulating commercial and backyard piggery, poultry, and livestock operations across Hinunangan; mandates "Baboyang Walang Amoy" odorless pen systems, establishes minimum 25m groundwater, 25m-1,000m built-up setbacks, 100m tourist destination buffers, creates the Municipal Livestock Task Force (MLTF), and sets penalties up to ₱2,500.00 and farm closure.',
  description:
    'Revises Municipal Ordinance No. 2000-02 to modernize sanitation, biosecurity, and locational zoning standards for all piggery and poultry farms in Hinunangan.',
  legalBasis: [
    'Republic Act No. 7160 (Local Government Code of 1991, Section 16 - General Welfare Clause & Section 447 - Regulatory Powers of Sangguniang Bayan)',
    'Presidential Decree No. 856 (Code on Sanitation of the Philippines)',
    'Republic Act No. 8485 as amended by RA 10631 (Animal Welfare Act of the Philippines)',
    'Republic Act No. 9003 (Ecological Solid Waste Management Act of 2000)',
    'Republic Act No. 9275 (Philippine Clean Water Act of 2004)',
    'Republic Act No. 10611 (Food Safety Act of 2013)',
    'Municipal Ordinance No. 2000-02 (Revised and Superseded)',
  ],
  tags: ['piggery', 'poultry', 'livestock', 'backyard', 'commercial', 'odorless pigpen', 'MLTF', '100 meters', 'setbacks', 'penalties'],
  relatedDocumentIds: ['mo-hinunangan-2000-02', 'res-hinunangan-376-2026', 'po-southern-leyte-2023-144'],
  relatedDocuments: [
    {
      id: 'mo-hinunangan-2000-02',
      targetDocNumber: 'Municipal Ordinance No. 2000-02',
      targetDocTitle: 'An Ordinance Regulating the Hog Raising in this Municipality',
      relationshipType: 'revises',
    },
    {
      id: 'res-hinunangan-376-2026',
      targetDocNumber: 'Resolution No. 376 Series of 2026',
      targetDocTitle: 'Resolution Requesting Local Breeders & Backyard Raisers to Register with OMAS',
      relationshipType: 'related',
    },
    {
      id: 'po-southern-leyte-2023-144',
      targetDocNumber: 'Provincial Ordinance No. 2023-144',
      targetDocTitle: 'Southern Leyte Provincial Bantay ASF Ordinance',
      relationshipType: 'implements',
    },
  ],
  mltfMembers: [
    { role: 'Chairman', title: 'Municipal Mayor', office: 'Office of the Municipal Mayor' },
    { role: 'Vice Chairman', title: 'Municipal Vice Mayor', office: 'Office of the Sangguniang Bayan' },
    { role: 'Member', title: 'SB Chairman, Committee on Health', office: 'Sangguniang Bayan' },
    { role: 'Member', title: 'SB Chairman, Committee on Agriculture', office: 'Sangguniang Bayan' },
    { role: 'Member', title: 'Municipal Sanitary Inspector', office: 'Municipal Health Office' },
    { role: 'Member', title: 'Municipal Health Officer', office: 'Municipal Health Office' },
    { role: 'Member', title: 'Municipal Environmental and Natural Resources Officer (MENRO)', office: 'MENRO Hinunangan' },
    { role: 'Member', title: 'Municipal Agriculturist', office: 'Office of the Municipal Agricultural Services (OMAS)' },
    { role: 'Member', title: 'Municipal Planning and Development Coordinator (MPDC)', office: 'MPDC Office' },
    { role: 'Member', title: 'Business Processing and Licensing Officer (BPLO)', office: 'BPLO Hinunangan' },
    { role: 'Member', title: 'Chief of Police', office: 'Hinunangan Municipal Police Station (PNP)' },
    { role: 'Member', title: 'Liga ng mga Barangay President', office: 'Liga ng mga Barangay' },
  ],
  locationalStandards: [
    {
      id: 'loc-poultry-backyard',
      category: 'poultry',
      classification: 'Backyard',
      headsRange: 'Maximum of 500 heads',
      eccRequired: 'Not Applicable / Certificate of Non-Coverage',
      zone: 'Agricultural',
      distanceGroundwater: 25,
      distanceBuiltUp: '25 m',
      distanceMajorRoads: 'Not Applicable',
      distanceBetweenFarms: 'Not Applicable',
      notes: 'Must maintain standard sanitation and fly control.',
    },
    {
      id: 'loc-poultry-small',
      category: 'poultry',
      classification: 'Commercial – Small',
      headsRange: '501–5,000 heads',
      eccRequired: 'Required (DENR-EMB ECC / CNC)',
      zone: 'Agricultural',
      distanceGroundwater: 25,
      distanceBuiltUp: '500 m',
      distanceMajorRoads: '200 m',
      distanceBetweenFarms: '500 m',
      notes: 'Environmental Compliance Certificate required from DENR-EMB.',
    },
    {
      id: 'loc-poultry-medium',
      category: 'poultry',
      classification: 'Commercial – Medium',
      headsRange: 'Over 5,000 to less than 10,000 heads',
      eccRequired: 'Required (DENR-EMB ECC)',
      zone: 'Agricultural',
      distanceGroundwater: 25,
      distanceBuiltUp: '1,000 m',
      distanceMajorRoads: '200 m',
      distanceBetweenFarms: '1,000 m',
      notes: 'Must secure full DENR Environmental Compliance Certificate.',
    },
    {
      id: 'loc-poultry-large',
      category: 'poultry',
      classification: 'Commercial – Large',
      headsRange: '10,000 heads and above',
      eccRequired: 'Required (DENR-EMB ECC)',
      zone: 'Agricultural',
      distanceGroundwater: 25,
      distanceBuiltUp: '1,000 m',
      distanceMajorRoads: '200 m',
      distanceBetweenFarms: '1,000 m',
      notes: 'Requires comprehensive Environmental Impact Assessment and full waste management lagoon.',
    },
    {
      id: 'loc-piggery-backyard',
      category: 'piggery',
      classification: 'Backyard',
      headsRange: '1 sow and 10 heads and below',
      eccRequired: 'Not Applicable',
      zone: 'Agricultural',
      distanceGroundwater: 25,
      distanceBuiltUp: '25 m with septic',
      distanceMajorRoads: 'Not Applicable',
      distanceBetweenFarms: 'Not Applicable',
      notes: 'Heads include weanlings, growers, fatteners and boars. Must observe Baboyang Walang Amoy or septic system.',
    },
    {
      id: 'loc-piggery-medium',
      category: 'piggery',
      classification: 'Commercial – Medium',
      headsRange: '2 sows & 11–20 heads',
      eccRequired: 'Required (DENR-EMB ECC / CNC)',
      zone: 'Agricultural',
      distanceGroundwater: 25,
      distanceBuiltUp: '1,000 m',
      distanceMajorRoads: '500 m',
      distanceBetweenFarms: '1,000 m',
      notes: 'Heads include weanlings, growers, fatteners and boars.',
    },
    {
      id: 'loc-piggery-large',
      category: 'piggery',
      classification: 'Commercial – Large',
      headsRange: 'More than 2 sows & more than 20 heads',
      eccRequired: 'Required (DENR-EMB ECC)',
      zone: 'Agricultural',
      distanceGroundwater: 25,
      distanceBuiltUp: '1,000 m',
      distanceMajorRoads: '500 m',
      distanceBetweenFarms: '1,000 m',
      notes: 'Heads include weanlings, growers, fatteners and boars. Must have biogas digester or certified wastewater facility.',
    },
  ],
  proximityRegulations: {
    touristDestinationMinDistance: 100,
    touristDestinationTypes: [
      'Beaches',
      'Resorts',
      'Public Parks',
      'Cultural Landmarks',
      'Eco-tourism areas',
      'Tourism zones officially designated by the Municipal Tourism Office',
    ],
    environmentalMeasures: [
      'Proper waste disposal and containment',
      'Continuous odor control and masking bio-sprays',
      'Rigorous sanitation measures and routine disinfection',
      'Water pollution prevention',
      'Mitigation of adverse effects on neighboring communities and tourist areas',
    ],
    inspectionOffices: [
      'Municipal Environment and Natural Resources Office (MENRO)',
      'Office of the Municipal Agricultural Services (OMAS)',
      'Municipal Tourism Office',
      'Municipal Health Office (MHO)',
    ],
    exemptionAuthority: 'Approval by the Sangguniang Bayan with required Environmental Impact Assessment and official endorsements',
  },
  articles: [
    {
      id: 'art-1',
      articleNumber: 'ARTICLE I',
      articleTitle: 'TITLE AND OBJECTIVES',
      sections: [
        {
          id: 'sec-1',
          sectionNumber: 'SECTION 1',
          sectionTitle: 'TITLE',
          content:
            'This Ordinance shall be known as the "Piggery and Poultry Regulation Ordinance" in the Municipality of Hinunangan.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-2',
          sectionNumber: 'SECTION 2',
          sectionTitle: 'OBJECTIVES',
          content:
            'The objectives of this Ordinance are: (a) To ensure the compliance of commercial and backyard piggery, poultry, and other livestock activities with all applicable environmental, health, and zoning laws, rules, and regulations; (b) To protect public health, safety, and general welfare; (c) To minimize and eliminate obnoxious odor, fly and mosquito infestation, and water pollution caused by animal waste; (d) To support the sustainable growth of piggery, poultry, and livestock businesses through systematic regulation, guidance, and administration; (e) To establish a clear legal and policy framework for the proper management and operation of piggery and poultry farms in Hinunangan.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'art-2',
      articleNumber: 'ARTICLE II',
      articleTitle: 'SCOPE, COVERAGE, APPLICATION AND DEFINITION OF TERMS',
      sections: [
        {
          id: 'sec-3',
          sectionNumber: 'SECTION 3',
          sectionTitle: 'SCOPE',
          content:
            'This Ordinance shall apply within the entire territorial jurisdiction of the Municipality of Hinunangan, Southern Leyte.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-4',
          sectionNumber: 'SECTION 4',
          sectionTitle: 'APPLICATION',
          content:
            'This Ordinance shall apply to all applications to establish, put up, construct, and operate: (a) Commercial piggery; (b) Backyard piggery; (c) Commercial poultry; (d) Backyard poultry; and (e) Any expansion or modification of existing farms. All existing piggery and poultry farms are likewise mandated to comply with the standards and provisions set forth herein.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-5',
          sectionNumber: 'SECTION 5',
          sectionTitle: 'EXISTING FARMS',
          content:
            'If an existing piggery or poultry farm ceases operation for more than one (1) year, its revival, reopening, or re-establishment shall be treated as a new application and shall be subject to all the requirements and clearances of this Ordinance.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-6',
          sectionNumber: 'SECTION 6',
          sectionTitle: 'DEFINITION OF TERMS',
          content:
            'For the purpose of this Ordinance, the following terms are defined: (a) Backyard Piggery – Any piggery farm with one (1) sow and ten (10) heads and below. Heads include weanlings, growers, fatteners, and boars; (b) Backyard Poultry – Any poultry farm with a maximum of five hundred (500) heads of fowls; (c) Built-up Areas – A contiguous grouping of ten (10) or more structures utilized for residential, commercial, institutional, or religious purposes; (d) Commercial Piggery – Any piggery farm with two (2) or more sows and eleven (11) heads and above, classified into Medium (2 sows & 11-20 heads) and Large (more than 2 sows & more than 20 heads); (e) Commercial Poultry – Any poultry farm with five hundred one (501) heads of fowls and above, classified into Small (501–5,000), Medium (over 5,000 to less than 10,000), and Large (10,000 and above); (f) Farrowing – The process of a sow giving birth to a litter of piglets; (g) Fattening – The process of feeding and rearing swine until they reach market slaughter weight; (h) Nearest Groundwater – The shortest distance from the farm structure or waste containment to any potable water source, spring, communal deepwell, or riverbank; (i) Locational Clearance – Written authorization issued by the MPDC confirming site zoning compliance; (j) Major Roads/Highways – National, provincial, and primary municipal roads; (k) Municipal Permit – The official business permit issued by the Office of the Municipal Mayor; (l) Poultry – Domestic fowls including chickens, ducks, turkeys, and geese; (m) Standard Septic Tank – A watertight multi-chamber containment system for settling and decomposing animal waste effluent; (n) Urban Area – Densely populated central district where residential proximity prohibits livestock housing.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'art-3',
      articleNumber: 'ARTICLE III',
      articleTitle: 'ADMINISTRATIVE AND ENFORCEMENT PROVISIONS',
      sections: [
        {
          id: 'sec-7',
          sectionNumber: 'SECTION 7',
          sectionTitle: 'MUNICIPAL LIVESTOCK TASK FORCE',
          content:
            'There is hereby created the Municipal Livestock Task Force (MLTF) composed of: (a) Municipal Mayor – Chairman; (b) Municipal Vice Mayor – Vice Chairman; (c) SB Chairman, Committee on Health – Member; (d) SB Chairman, Committee on Agriculture – Member; (e) Municipal Sanitary Inspector – Member; (f) Municipal Health Officer – Member; (g) Municipal Environmental and Natural Resources Officer (MENRO) – Member; (h) Municipal Agriculturist – Member; (i) Municipal Planning and Development Coordinator (MPDC) – Member; (j) Business Processing and Licensing Officer (BPLO) – Member; (k) Chief of Police, Hinunangan MPS – Member; and (l) Liga ng mga Barangay President – Member.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-8',
          sectionNumber: 'SECTION 8',
          sectionTitle: 'DUTIES AND FUNCTIONS OF THE MLTF',
          content:
            'The MLTF shall have the following duties and functions: (a) Formulate the Implementing Rules and Regulations (IRR) of this Ordinance; (b) Conduct regular and unannounced inspections of all commercial and backyard piggery and poultry farms; (c) Receive, verify, and investigate public complaints regarding odor, flies, waste discharge, or zoning non-compliance; (d) Issue formal Notices of Violation and orders for corrective action; (e) Recommend to the Municipal Mayor the suspension, revocation, or non-renewal of Municipal Permits and closure of non-compliant farms; (f) Enforce closure orders and dismantling of unauthorized structures; (g) Coordinate with the PNP and Barangay Tanods for peaceful enforcement of this Ordinance.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'art-4',
      articleNumber: 'ARTICLE IV',
      articleTitle: 'LOCATIONAL DESIGN STANDARDS',
      sections: [
        {
          id: 'sec-9',
          sectionNumber: 'SECTION 9',
          sectionTitle: 'LOCATIONAL DESIGN STANDARDS',
          content:
            'All piggery and poultry farms must strictly adhere to the locational setback standards outlined in the official schedule: Poultry Backyard (max 500 heads: 25m groundwater, 25m built-up); Poultry Commercial Small (501-5,000 heads: 25m groundwater, 500m built-up, 200m major road, 500m farm distance, ECC required); Poultry Commercial Medium (5,001-9,999 heads: 25m groundwater, 1,000m built-up, 200m major road, 1,000m farm distance, ECC required); Poultry Commercial Large (10,000+ heads: 25m groundwater, 1,000m built-up, 200m major road, 1,000m farm distance, ECC required); Piggery Backyard (1 sow & <=10 heads: 25m groundwater, 25m with septic); Piggery Commercial Medium (2 sows & 11-20 heads: 25m groundwater, 1,000m built-up, 500m major road, 1,000m farm distance, ECC required); Piggery Commercial Large (>2 sows & >20 heads: 25m groundwater, 1,000m built-up, 500m major road, 1,000m farm distance, ECC required). Note: Heads include weanlings, growers, fatteners and boars.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-10',
          sectionNumber: 'SECTION 10',
          sectionTitle: 'PROXIMITY REGULATIONS FOR PIGGERY, POULTRY, AND OTHER LIVESTOCK FARMS NEAR TOURIST DESTINATIONS',
          content:
            'Minimum Distance Requirement: Commercial and backyard piggery, poultry, and other livestock farms must be located at least one hundred (100) meters away from officially designated tourist destinations, including beaches, resorts, parks, cultural landmarks, eco-tourism areas, and other areas identified by the Municipal Tourism Office. Environmental and Sanitation Compliance: Farms must implement strict waste containment, bio-spray odor control, zero runoff into tourist zones, and routine sanitation. Inspection and Monitoring: Conducted jointly by MENRO, OMAS, and the Municipal Tourism Office. Exemptions: Any exemption requires prior legislative approval by the Sangguniang Bayan supported by an Environmental Impact Assessment.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'art-5',
      articleNumber: 'ARTICLE V',
      articleTitle: 'GENERAL AND STANDARD PROVISIONS',
      sections: [
        {
          id: 'sec-11',
          sectionNumber: 'SECTION 11',
          sectionTitle: 'FARM CENSUS AND DATABASE',
          content:
            'The Office of the Municipal Agricultural Services (OMAS) shall establish and maintain a comprehensive, centralized census and digital database of all piggery and poultry farms in Hinunangan. The database shall record: facility owner/operator name, contract grower arrangement, land title or lease agreement, farm location coordinates, total land area, number of fowls and swine heads inventory, municipal permits, registration certificates, and annual renewal records. This system shall integrate seamlessly with the Municipal Swine Registry.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-12',
          sectionNumber: 'SECTION 12',
          sectionTitle: 'BARANGAY REGISTRATION',
          content:
            'All piggery and poultry farms, whether commercial or backyard, must be registered and officially recorded in the barangay where they are located prior to commencing operations.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-13',
          sectionNumber: 'SECTION 13',
          sectionTitle: 'FARM REQUIREMENTS',
          content:
            'All farms must comply with the following minimum engineering and biosecurity requirements: (a) Absolute prohibition of poultry and piggery operations within designated urban/poblacion zones; (b) Installation of adequate fly and insect control devices and biolarvicide treatments; (c) Construction of concrete drainage canals leading to septic systems; (d) Site selection on appropriate, elevated terrain; (e) Prohibition of construction within flood-prone, landslide-susceptible, or environmentally critical areas; (f) Adequate soil permeability and stability; (g) Minimum five (5) meter vegetated buffer zone along property boundaries; (h) Environmentally sound disposal of animal litter, dead animals, and manure.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-14',
          sectionNumber: 'SECTION 14',
          sectionTitle: 'SLAUGHTER AREA PROHIBITION',
          content:
            'The use of any piggery or poultry farm structure as a slaughterhouse or slaughter area is strictly prohibited, regardless of the number of heads. All slaughtering must be conducted at the Hinunangan Municipal Abattoir.',
          mandateCategory: 'prohibitive',
        },
      ],
    },
    {
      id: 'art-6',
      articleNumber: 'ARTICLE VI',
      articleTitle: 'REGULATORY REQUIREMENTS FOR COMMERCIAL PIGGERY AND POULTRY',
      sections: [
        {
          id: 'sec-15',
          sectionNumber: 'SECTION 15',
          sectionTitle: 'MUNICIPAL PERMIT',
          content:
            'All commercial piggery and commercial poultry operations must secure a Municipal Business Permit before commencing construction or operations. Requirements include: (a) Locational / Zoning Clearance from the MPDC; (b) Farm architectural and engineering plans reviewed and endorsed by OMAS; (c) Environmental Compliance Certificate (ECC) or CNC issued by DENR-EMB; (d) Building and Sanitary Permits. For applications requiring a Sangguniang Bayan Resolution of No Objection, the applicant must submit: (i) Barangay Resolution of No Objection; (ii) Certification of Public Hearing; (iii) Minutes of the Public Hearing; (iv) Signed Attendance Sheet of affected neighbors; and (v) Locational Clearance.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-16',
          sectionNumber: 'SECTION 16',
          sectionTitle: 'FEES',
          content:
            'Fees for new applications, renewals of municipal permits, inspection clearances, and farm registrations shall be assessed in accordance with the approved Municipal Revenue Code and existing tax ordinances.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'art-7',
      articleNumber: 'ARTICLE VII',
      articleTitle: 'BACKYARD PIGGERY AND POULTRY',
      sections: [
        {
          id: 'sec-17',
          sectionNumber: 'SECTION 17',
          sectionTitle: 'BACKYARD REGULATION BY CONCERNED BARANGAY',
          content:
            'Backyard piggery (1 sow & <=10 heads) and backyard poultry (<=500 heads) operations are subject to direct regulation, routine inspection, and monitoring by the concerned Barangay Council and Barangay Biosecurity Officer (BBO). The Barangay shall enforce sanitary waste containment, prevent odor nuisance to neighbors, and ensure compliance with municipal standards.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'art-8',
      articleNumber: 'ARTICLE VIII',
      articleTitle: 'MISCELLANEOUS PROVISIONS',
      sections: [
        {
          id: 'sec-18',
          sectionNumber: 'SECTION 18',
          sectionTitle: '"BABOYANG WALANG AMOY" (ODORLESS PIGPEN) STANDARD',
          content:
            'All existing and intended commercial and backyard piggeries are required to adopt the prescribed waste-management method known as "Baboyang Walang Amoy" (Odorless Pigpen) utilizing organic deep-bedding litter systems with beneficial indigenous microorganisms (IMO), or in the alternative, construct a certified multi-chamber septic tank system with zero effluent discharge into public waterways.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-19',
          sectionNumber: 'SECTION 19',
          sectionTitle: 'TRANSITION AND COMPLIANCE PERIOD',
          content:
            'A transition and compliance period of one (1) year from the effectivity of this Ordinance is granted to all existing piggery and poultry farms to upgrade their facilities and comply with all setback, waste containment, and permit standards. The OMAS shall organize and conduct regular technical training seminars for all farm owners.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-20',
          sectionNumber: 'SECTION 20',
          sectionTitle: 'ENFORCEMENT AND COORDINATION DUTIES',
          content:
            'The Municipal Sanitary Inspector, Office of the Municipal Agricultural Services (OMAS), and the Hinunangan Municipal Police Station (PNP) are tasked with joint enforcement, conducting Information, Education, and Communication (IEC) campaigns, serving inspection notices, and executing lawful closure and dismantling orders against recalcitrant non-compliant farms.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'art-9',
      articleNumber: 'ARTICLE IX',
      articleTitle: 'PENAL CLAUSE',
      sections: [
        {
          id: 'sec-21',
          sectionNumber: 'SECTION 21',
          sectionTitle: 'PENALTIES AND ADMINISTRATIVE SANCTIONS',
          content:
            'Any person, owner, operator, or entity found violating any provision of this Ordinance shall be penalized as follows: (a) First Offense – Administrative fine of One Thousand Pesos (₱1,000.00) and written notice of violation with seven (7) days corrective period; (b) Second Offense – Administrative fine of One Thousand Five Hundred Pesos (₱1,500.00) and temporary suspension of barangay/municipal clearance; (c) Third and Subsequent Offenses – Administrative fine of Two Thousand Five Hundred Pesos (₱2,500.00), or imprisonment of not less than one (1) month nor more than six (6) months, or both, at the discretion of the court. In addition, the Municipal Sanitary Inspector and/or OMAS shall recommend to the Municipal Mayor the revocation of the business permit, condemnation of the farm structure, and permanent physical closure and dismantling of non-compliant pens.',
          mandateCategory: 'penal',
        },
      ],
    },
    {
      id: 'art-10',
      articleNumber: 'ARTICLE X',
      articleTitle: 'FINAL PROVISIONS',
      sections: [
        {
          id: 'sec-22',
          sectionNumber: 'SECTION 22',
          sectionTitle: 'SEPARABILITY CLAUSE',
          content:
            'If any section, subsection, clause, or provision of this Ordinance is held unconstitutional or invalid by a court of competent jurisdiction, the remaining sections or provisions shall remain in full force and effect.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-23',
          sectionNumber: 'SECTION 23',
          sectionTitle: 'REPEALING CLAUSE',
          content:
            'Municipal Ordinance No. 2000-02 and all other local ordinances, executive orders, rules, and regulations inconsistent with this Ordinance are hereby repealed, amended, or modified accordingly.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-24',
          sectionNumber: 'SECTION 24',
          sectionTitle: 'AMENDMENTS',
          content:
            'Amendments to this Ordinance may be introduced and adopted during any regular session of the Sangguniang Bayan by a majority vote of all members, subject to the statutory notice and hearing requirements.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'sec-25',
          sectionNumber: 'SECTION 25',
          sectionTitle: 'EFFECTIVITY CLAUSE',
          content:
            'This Ordinance shall take effect fifteen (15) days after its publication and posting in at least three (3) conspicuous public places in the Municipality of Hinunangan, Southern Leyte. ENACTED this 3rd day of March, 2025.',
          mandateCategory: 'mandatory',
        },
      ],
    },
  ],
  keyArticles: [
    {
      number: 'Section 1',
      heading: 'Title: Piggery and Poultry Regulation Ordinance',
      text: 'Regulates all commercial and backyard piggery, poultry, and livestock operations across the Municipality of Hinunangan.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 6',
      heading: 'Definitions: Backyard vs Commercial Classifications',
      text: 'Backyard piggery is 1 sow & <=10 heads. Commercial Small/Medium/Large categories have specific heads thresholds including weanlings, growers, fatteners and boars.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 7',
      heading: 'Municipal Livestock Task Force (MLTF)',
      text: 'Chaired by the Municipal Mayor with Vice Mayor as Vice Chair, Health Officer, Agriculturist, MENRO, MPDC, BPLO, and Police Chief.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 9',
      heading: 'Locational Design Standards Table',
      text: 'Mandatory distances: 25m groundwater, 25m-1,000m built-up, 200m-500m major roads, 500m-1,000m between farms.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 10',
      heading: '100m Minimum Distance from Tourist Destinations',
      text: 'Piggeries, poultry, and livestock farms must be located at least 100 meters away from beaches, resorts, parks, eco-tourism areas.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 18',
      heading: 'Mandatory "Baboyang Walang Amoy" (Odorless Pigpen)',
      text: 'Existing and intended piggeries must implement deep-bedding organic waste systems or certified multi-chamber septic systems.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 21',
      heading: 'Penal Clause & Fines',
      text: '1st Offense: ₱1,000.00; 2nd Offense: ₱1,500.00; 3rd Offense: ₱2,500.00 or imprisonment 1-6 months, or both, plus permit revocation & pen dismantling.',
      mandateCategory: 'mandatory',
    },
  ],
  setbackRules: [
    {
      target: 'Nearest Groundwater / Spring / Potable Well / Riverbank',
      minimumDistance: 25,
      statutoryBasis: 'Section 9, Municipal Ordinance No. 2025-59 & Clean Water Act',
      rationale: 'Prevents leachate seepage and coliform contamination of municipal drinking sources.',
    },
    {
      target: 'Officially Designated Tourist Destinations / Beaches / Resorts / Eco-Parks',
      minimumDistance: 100,
      statutoryBasis: 'Section 10, Municipal Ordinance No. 2025-59',
      rationale: 'Protects pristine tourism zones and coastal ecotourism from offensive odor, flies, and runoff.',
    },
    {
      target: 'Built-up Area (Backyard Piggery with Septic)',
      minimumDistance: 25,
      statutoryBasis: 'Section 9, Municipal Ordinance No. 2025-59',
      rationale: 'Minimum setback for small backyard pens with approved septic tank.',
    },
    {
      target: 'Built-up Area (Commercial Piggery Medium & Large)',
      minimumDistance: 1000,
      statutoryBasis: 'Section 9, Municipal Ordinance No. 2025-59',
      rationale: '1,000 meters buffer for commercial farms to ensure residential odor and biosecurity isolation.',
    },
    {
      target: 'Major Roads / National & Provincial Highways',
      minimumDistance: 500,
      statutoryBasis: 'Section 9, Municipal Ordinance No. 2025-59',
      rationale: 'Prevents traffic odor nuisances and maintains public roadway biosecurity corridors.',
    },
  ],
  penalties: [
    {
      offenseTier: 'First Offense',
      finePhp: 1000,
      punitiveActions: 'Administrative fine of ₱1,000.00 and written notice of violation with seven (7) days corrective action grace period.',
    },
    {
      offenseTier: 'Second Offense',
      finePhp: 1500,
      punitiveActions: 'Administrative fine of ₱1,500.00 and temporary suspension of barangay/municipal operating clearances.',
    },
    {
      offenseTier: 'Third & Succeeding Offenses',
      finePhp: 2500,
      imprisonment: '1 month to 6 months imprisonment or both at court discretion',
      punitiveActions:
        'Maximum fine of ₱2,500.00, imprisonment of 1-6 months, revocation of Municipal Business Permit, and physical closure and dismantling of structures.',
    },
  ],
  sourceDocuments: [
    {
      id: 'doc-scan-2025-59-p1',
      name: 'Ordinance 2025-59 Official Enacted Scan - Pages 1-4',
      pageNumber: 1,
      url: '/icon.svg',
      uploadedAt: '2025-03-03',
      fileSize: '4.2 MB PDF',
    },
  ],
  versionHistory: [
    {
      version: 1,
      updatedAt: '2025-03-03T10:00:00Z',
      updatedBy: 'Sangguniang Bayan Secretariat',
      changeSummary: 'Enacted Municipal Ordinance No. 2025-59 revising MO 2000-02.',
    },
  ],
  auditLogs: [
    {
      id: 'log-1',
      action: 'created',
      timestamp: '2025-03-03T10:00:00Z',
      performedBy: 'Hon. Gezar S. Ngoho (Author)',
      details: 'Digitized official enacted copy of Municipal Ordinance No. 2025-59 into Hinunangan Swine Registry System.',
    },
  ],
};

export const MUNICIPAL_RESOLUTION_376_2026: ASFRegulatoryDocument = {
  id: 'res-hinunangan-376-2026',
  type: 'resolution',
  category: 'resolution',
  title:
    'A RESOLUTION REQUESTING LOCAL BREEDERS/BACKYARD HOG RAISERS IN THE MUNICIPALITY OF HINUNANGAN TO REGISTER THEIR LIVESTOCK AND OTHER RUMINANTS IN THEIR RESPECTIVE BARANGAYS FOR CONSOLIDATION AND RECORDING PURPOSES WITH THE OFFICE OF THE MUNICIPAL AGRICULTURAL SERVICES (OMAS) TO ASSIST THEM IN ESTABLISHING A SUITABLE MARKET',
  knownAs: 'Livestock & Backyard Hog Registration & Market Assistance Resolution',
  officialNumber: 'Resolution No. 376 Series of 2026',
  seriesYear: 'Series of 2026',
  jurisdiction: 'Municipality of Hinunangan, Southern Leyte',
  issuingAuthority: 'Sangguniang Bayan of Hinunangan, Southern Leyte',
  author: 'Hon. Aida T. Bulingit',
  signatory: 'Hon. Tito T. Burlaza',
  signatoryTitle: 'Municipal Vice Mayor & Presiding Officer',
  sessionInfo: '47th Regular Session',
  dateEnacted: 'June 1, 2026',
  effectiveDate: 'June 1, 2026 (Adopted & Enforced)',
  status: 'active',
  shortSummary:
    'Legislative resolution directing all local breeders, backyard hog raisers, livestock and ruminants owners in all 40 barangays of Hinunangan to register their animals in their respective barangays for consolidation with OMAS, enabling market-matching assistance, inventory tracking, disease-control support, and production planning.',
  description:
    'Official resolution institutionalizing the barangay-level profiling and centralized OMAS registration workflow to assist local swine raisers with fair market linkage and livestock census.',
  legalBasis: [
    'Republic Act No. 7160 (Local Government Code of 1991, Section 17 - Basic Services and Facilities in Agriculture)',
    'Department of Agriculture Administrative Order No. 06, Series of 2021 (BABay ASF)',
    'Municipal Ordinance No. 2025-59 (Piggery and Poultry Regulation Ordinance)',
  ],
  tags: ['resolution', 'registration', 'backyard raisers', 'breeders', 'ruminants', 'OMAS', 'market assistance', 'census', 'disease control'],
  relatedDocumentIds: ['mo-hinunangan-2025-59', 'po-southern-leyte-2023-144'],
  relatedDocuments: [
    {
      id: 'mo-hinunangan-2025-59',
      targetDocNumber: 'Municipal Ordinance No. 2025-59',
      targetDocTitle: 'Piggery and Poultry Regulation Ordinance',
      relationshipType: 'implements',
    },
  ],
  articles: [
    {
      id: 'res-art-1',
      articleNumber: 'RESOLVING CLAUSES',
      articleTitle: 'BARANGAY LIVESTOCK REGISTRATION & OMAS CONSOLIDATION MANDATE',
      sections: [
        {
          id: 'res-sec-1',
          sectionNumber: 'RESOLVED CLAUSE 1',
          sectionTitle: 'REQUEST FOR BARANGAY LIVESTOCK REGISTRATION',
          content:
            'RESOLVED, by the Sangguniang Bayan of Hinunangan, Southern Leyte in session assembled, to respectfully request all local breeders, backyard hog raisers, livestock owners, and raisers of other ruminants within the Municipality of Hinunangan to register their animals in their respective barangays.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'res-sec-2',
          sectionNumber: 'RESOLVED CLAUSE 2',
          sectionTitle: 'CONSOLIDATION AND CENTRAL RECORDING WITH OMAS',
          content:
            'RESOLVED FURTHER, that all Punong Barangays and Barangay Focal Persons shall consolidate, profile, and submit comprehensive records of registered livestock to the Office of the Municipal Agricultural Services (OMAS) for centralized recording, head inventory verification, and production monitoring.',
          mandateCategory: 'mandatory',
        },
        {
          id: 'res-sec-3',
          sectionNumber: 'RESOLVED CLAUSE 3',
          sectionTitle: 'MARKET ASSISTANCE AND MATCHMAKING LINKAGES',
          content:
            'RESOLVED FURTHER, that OMAS shall utilize the consolidated registry to assist local breeders and backyard raisers in establishing a suitable, stable, and profitable market, linking market-ready swine and livestock directly with accredited institutional buyers, meat processors, and licensed abattoir traders.',
          mandateCategory: 'advisory',
        },
        {
          id: 'res-sec-4',
          sectionNumber: 'RESOLVED CLAUSE 4',
          sectionTitle: 'DISEASE CONTROL AND PRODUCTION PLANNING SUPPORT',
          content:
            'RESOLVED FINALLY, that copies of this Resolution be furnished to the Municipal Mayor, the Municipal Agriculturist, all forty (40) Punong Barangays of Hinunangan, and other concerned agencies for their information, immediate guidance, and strict implementation.',
          mandateCategory: 'mandatory',
        },
      ],
    },
  ],
  keyArticles: [
    {
      number: 'Clause 1',
      heading: 'Barangay Registration of Local Breeders & Backyard Raisers',
      text: 'Mandates registration of all hogs, breeding sows, and ruminants at the barangay level.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Clause 2',
      heading: 'OMAS Consolidation & Central Database',
      text: 'Synchronizes barangay profiling data into the central OMAS Swine Registry database for real-time tracking.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Clause 3',
      heading: 'Market Assistance & Direct Buyer Linkage',
      text: 'Guarantees marketing support and fair farmgate pricing for registered swine raisers.',
      mandateCategory: 'advisory',
    },
  ],
  setbackRules: [
    {
      target: 'Registered Backyard Holdings',
      minimumDistance: 25,
      statutoryBasis: 'Resolution No. 376 & MO 2025-59',
      rationale: 'Ensures registered farms comply with municipal sanitation while listed in the OMAS marketing directory.',
    },
  ],
  penalties: [
    {
      offenseTier: 'Non-Registration Advisory',
      finePhp: 0,
      punitiveActions:
        'Unregistered raisers will be excluded from municipal marketing matching, subsidized feeds distribution, veterinary medicine assistance, and expedited transport gate passes.',
    },
  ],
  sourceDocuments: [
    {
      id: 'doc-scan-376-2026',
      name: 'Resolution No. 376 Series of 2026 - Official Sangguniang Bayan Copy',
      pageNumber: 1,
      url: '/icon.svg',
      uploadedAt: '2026-06-01',
      fileSize: '1.8 MB PDF',
    },
  ],
  versionHistory: [
    {
      version: 1,
      updatedAt: '2026-06-01T14:00:00Z',
      updatedBy: 'Sangguniang Bayan Secretariat',
      changeSummary: 'Adopted during the 47th Regular Session.',
    },
  ],
  auditLogs: [
    {
      id: 'log-res-1',
      action: 'created',
      timestamp: '2026-06-01T14:00:00Z',
      performedBy: 'Hon. Aida T. Bulingit (Author)',
      details: 'Recorded official Resolution No. 376 Series of 2026 into the Swine Registry System.',
    },
  ],
};

export const PROVINCIAL_ORDINANCE_2023_144: ASFRegulatoryDocument = {
  id: 'po-southern-leyte-2023-144',
  type: 'provincial_ordinance',
  category: 'ordinance',
  title:
    'AN ORDINANCE ADOPTING APPLICABLE PROVISIONS OF THE "BANTAY ASF SA BARANGAY" (BABAY ASF) PROGRAM AND PRESCRIBING AFRICAN SWINE FEVER (ASF) PREVENTION AND CONTROL MEASURES IN THE PROVINCE OF SOUTHERN LEYTE, AND PROVIDING PENALTIES AND SANCTIONS FOR VIOLATIONS THEREOF',
  knownAs: 'Southern Leyte Provincial Bantay ASF Ordinance',
  officialNumber: 'Provincial Ordinance No. 2023-144 / SP Res. No. 1348-s.2023',
  seriesYear: 'Series of 2023',
  jurisdiction: 'Province of Southern Leyte',
  issuingAuthority: 'Sangguniang Panlalawigan of Southern Leyte, Provincial Capitol, Maasin City',
  author: 'Committee on Agriculture & Food Security',
  signatory: 'Hon. Damian G. Mercado',
  signatoryTitle: 'Provincial Governor (Presiding Officer: Hon. Rosa Emilia G. Mercado, Vice Governor)',
  dateEnacted: 'December 18, 2023',
  effectiveDate: 'January 2, 2024 (Provincial Law)',
  status: 'active',
  shortSummary:
    'Provincial statute institutionalizing the Bantay ASF sa Barangay (BABay ASF) program across all 18 municipalities and 1 city in Southern Leyte; establishes 24/7 quarantine border gates, mandatory veterinary transport permits, absolute swill feeding ban, sentinel pig surveillance, and penalties up to ₱5,000.00 and vehicle impoundment.',
  legalBasis: [
    'Republic Act No. 7160 (Section 468 - Powers and Duties of the Sangguniang Panlalawigan)',
    'Republic Act No. 8485 (Animal Welfare Act of 1998, as amended by RA 10631)',
    'Republic Act No. 10611 (Food Safety Act of 2013)',
    'DA Administrative Circular No. 02, Series of 2022 (National Zoning and Movement Plan for ASF)',
    'DA Department Administrative Order No. 06, Series of 2021 (BABay ASF Program Framework)',
  ],
  tags: ['ASF', 'Bantay ASF', 'provincial', 'biosecurity', 'quarantine', 'checkpoints', 'swill ban', 'penalties'],
  relatedDocumentIds: ['mo-hinunangan-2025-59', 'da-ao-06-2021'],
  articles: [
    {
      id: 'po-art-1',
      articleNumber: 'ARTICLE I',
      articleTitle: 'PROVINCIAL ZONING DEMARCATION & MOVEMENT RESTRICTIONS',
      sections: [
        {
          id: 'po-sec-1',
          sectionNumber: 'SECTION 1',
          sectionTitle: 'ASF ZONING COLOR TIERS',
          content:
            'The entire province of Southern Leyte is mapped under DA-BAI ASF Risk Color Tiers: Dark Green (Free Zone), Light Green (Protected Zone), Yellow (Surveillance Zone), Pink (Buffer Zone), and Red (Infected Zone). Any movement of live swine, semen, pork cuts, and processed pork between zones requires valid NVQC, Veterinary Health Certificates, and Provincial Shipping Permits.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'po-art-2',
      articleNumber: 'ARTICLE II',
      articleTitle: 'SEAPORT & BORDER CHECKPOINT INTERDICTION',
      sections: [
        {
          id: 'po-sec-2',
          sectionNumber: 'SECTION 2',
          sectionTitle: '24/7 BORDER QUARANTINE INSPECTION GATES',
          content:
            'Mandatory 24/7 quarantine inspection gates are deployed at San Ricardo, Liloan Ferry Terminal, Maasin Port, Sogod Corridor, and Agas-Agas Bridge. All livestock hauling trucks must present DA-accredited transport certificates and undergo automated wheel-dip and chemical disinfection.',
          mandateCategory: 'mandatory',
        },
      ],
    },
    {
      id: 'po-art-3',
      articleNumber: 'ARTICLE III',
      articleTitle: 'BAN ON UNPROCESSED SWILL AND CONTRABAND PORK',
      sections: [
        {
          id: 'po-sec-3',
          sectionNumber: 'SECTION 3',
          sectionTitle: 'ABSOLUTE BAN ON SWILL FEEDING',
          content:
            'Total interdiction against bringing in uncertified frozen pork, catering leftovers, and kitchen scraps from Red/Pink zones without NMIS Certificates of Meat Inspection (COMI).',
          mandateCategory: 'prohibitive',
        },
      ],
    },
  ],
  keyArticles: [
    {
      number: 'Article I',
      heading: 'Provincial Zoning Demarcation & Movement Restrictions',
      text: 'Zoning maps determine live hog, semen, and pork product transit clearances across provincial borders.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Article II',
      heading: 'Seaport & Border Checkpoint Interdiction',
      text: 'Mandatory 24/7 quarantine gates at ferry ports and municipal borders with automated vehicle disinfection.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Article III',
      heading: 'Absolute Ban on Unprocessed Swill and Contraband Pork',
      text: 'Total prohibition on feeding kitchen scraps and uncertified meat to prevent virus transmission.',
      mandateCategory: 'prohibitive',
    },
  ],
  setbackRules: [
    {
      target: 'Natural Waterways, Rivers & Surface Aquifers',
      minimumDistance: 25,
      statutoryBasis: 'Article V, Section 3 - Provincial Environmental Code',
      rationale: 'Prevents virus dissemination through regional river basins and coastal estuaries.',
    },
    {
      target: 'Residential Settlements & Commercial Centers',
      minimumDistance: 50,
      statutoryBasis: 'Article V, Section 4 - Provincial Public Health Standards',
      rationale: 'Creates an aerodynamic dilution barrier against airborne virus particles.',
    },
    {
      target: 'Institutions, Schools, Hospitals & Ecotourism Parks',
      minimumDistance: 200,
      statutoryBasis: 'Article V, Section 5 - Provincial Tourism Safeguards',
      rationale: 'Preserves the pristine environment of protected tourism and education zones in Southern Leyte.',
    },
  ],
  penalties: [
    {
      offenseTier: 'First Offense',
      finePhp: 2500,
      punitiveActions: 'Immediate impoundment of carrier vehicle for 24 hours and mandatory return to origin or humane destruction of contraband meat.',
    },
    {
      offenseTier: 'Second Offense',
      finePhp: 3500,
      punitiveActions: 'Suspension of business permit, impoundment of carrier vehicle for 72 hours, and condemnation of undocumented hogs.',
    },
    {
      offenseTier: 'Third & Habitual Offense',
      finePhp: 5000,
      punitiveActions: 'Maximum fine of ₱5,000.00 per violation, permanent revocation of hauler accreditation, and criminal indictment with imprisonment up to 6 months.',
    },
  ],
};

export const DA_ADMIN_ORDER_06_2021: ASFRegulatoryDocument = {
  id: 'da-ao-06-2021',
  type: 'administrative_order',
  category: 'national_reference',
  title:
    'GUIDELINES ON THE IMPLEMENTATION OF THE "BANTAY ASF SA BARANGAY" (BABAY ASF) PROGRAM TO PREVENT AND CONTROL AFRICAN SWINE FEVER IN THE PHILIPPINES',
  knownAs: 'National BABay ASF Program Guidelines',
  officialNumber: 'DA Administrative Order No. 06, Series of 2021',
  seriesYear: 'Series of 2021',
  jurisdiction: 'Republic of the Philippines (National)',
  issuingAuthority: 'Department of Agriculture (DA) & Bureau of Animal Industry (BAI)',
  author: 'Department of Agriculture - National African Swine Fever Task Force',
  signatory: 'Secretary of Agriculture',
  signatoryTitle: 'Secretary, Department of Agriculture',
  dateEnacted: 'February 10, 2021',
  effectiveDate: 'February 10, 2021 (National Regulatory Standard)',
  status: 'active',
  shortSummary:
    'National policy framework establishing the Bantay ASF sa Barangay (BABay ASF) community biosecurity surveillance protocol, risk zoning standards, sentinel animal repopulation guidelines, and laboratory testing benchmarks for all local government units.',
  legalBasis: [
    'Republic Act No. 8485 (Animal Welfare Act)',
    'Republic Act No. 10611 (Food Safety Act of 2013)',
    'Executive Order No. 105, s. 2020 (Creating the National Task Force on Animal Diseases)',
  ],
  tags: ['DA', 'BAI', 'national reference', 'BABay ASF', 'biosecurity standards', 'sentinel repopulation', 'surveillance'],
  relatedDocumentIds: ['mo-hinunangan-2025-59', 'po-southern-leyte-2023-144'],
  keyArticles: [
    {
      number: 'Section 1',
      heading: 'Community-Based ASF Biosecurity & BBO Institutionalization',
      text: 'Empowers LGUs to designate Barangay Biosecurity Officers for syndromic disease surveillance.',
      mandateCategory: 'mandatory',
    },
    {
      number: 'Section 2',
      heading: 'Zoning Movement Protocols & Biosecurity Level 1-3 Certification',
      text: 'Sets the technical requirements for farm biosecurity upgrading from backyard to semi-commercial and commercial levels.',
      mandateCategory: 'mandatory',
    },
  ],
  setbackRules: [
    {
      target: 'Communal Water Resources',
      minimumDistance: 25,
      statutoryBasis: 'DA AO 06-2021 Biosecurity Standard',
      rationale: 'Prevents waterborne transmission of ASF virus between adjacent farms.',
    },
  ],
  penalties: [
    {
      offenseTier: 'Administrative Non-Compliance',
      finePhp: 0,
      punitiveActions: 'Revocation of farm biosecurity clearance and cancellation of livestock transport authority.',
    },
  ],
};

export const ALL_ASF_REGULATIONS: ASFRegulatoryDocument[] = [
  MUNICIPAL_ORDINANCE_2025_59,
  MUNICIPAL_RESOLUTION_376_2026,
  PROVINCIAL_ORDINANCE_2023_144,
  DA_ADMIN_ORDER_06_2021,
];
