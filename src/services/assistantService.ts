import { Barangay, SwineRecord, UserAccount, UserRole } from '../types';
import { storageService } from './storageService';
import { HINUNANGAN_BARANGAYS } from '../data/barangays';
import { ALL_ASF_REGULATIONS } from '../data/asfRegulationsData';
import { interpretSuperAdminConfigCommand } from '../utils/configCommandInterpreter';
import { masterConfigService } from './masterConfigService';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: {
    type: 'navigate' | 'confirm_action' | 'confirm_config_change' | 'filter_gis' | 'open_login';
    tab?: string;
    label?: string;
    actionId?: string;
    payload?: any;
    confirmed?: boolean;
  };
  suggestions?: string[];
}

export interface AssistantResponse {
  reply: string;
  action?: ChatMessage['action'];
  suggestions?: string[];
}

/**
 * Filter swine records strictly by role and barangay assignment
 */
export function getAuthorizedRecords(
  records: SwineRecord[],
  currentUser: UserAccount | null,
  currentRole: UserRole | 'landing'
): SwineRecord[] {
  if (!currentUser || currentRole === 'landing') return [];
  const role = currentUser.role || currentRole;

  if (role === 'super_admin' || role === 'admin') {
    return records;
  }

  if (role === 'focal') {
    const assignedBg = (currentUser.assignedBarangay || '').toLowerCase().trim();
    if (!assignedBg) return [];
    return records.filter(
      r =>
        (r.barangay || '').toLowerCase().trim() === assignedBg ||
        (r.barangay_id && r.barangay_id.toLowerCase().includes(assignedBg))
    );
  }

  if (role === 'agent') {
    // Agents only see records ready to sell/takeoff and active
    return records.filter(
      r => !r.isArchived && (r.readyToSell || (r.weightKg && r.weightKg >= 75)) &&
      r.status !== 'sold' && r.status !== 'deceased'
    );
  }

  return [];
}

export const PUBLIC_ASSISTANT_SUGGESTIONS = [
  'What is the Swine Registry?',
  'How do I register my swine?',
  'What are the requirements?',
  'What are the official contact details?',
  'What barangays are covered?',
  'What should I do if my pigs are sick?',
];

/**
 * Public assistant response generator with strictly sanitized, published knowledge only.
 * NEVER accesses swine records, personal farmer details, exact GIS coordinates, or internal settings.
 */
export function generateLocalPublicAssistantResponse(query: string): AssistantResponse {
  const lower = query.toLowerCase().trim();

  // 1. REFUSAL: Secrets / Passwords / API Keys / Database Credential requests
  if (
    lower.includes('password') ||
    lower.includes('api key') ||
    lower.includes('apikey') ||
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('database password') ||
    lower.includes('sql') ||
    lower.includes('credentials')
  ) {
    return {
      reply: `🔒 **Security Notice**: System credentials, internal database settings, API keys, and administrative secrets are restricted and cannot be disclosed under any circumstances.`,
      suggestions: [
        'What is the Swine Registry?',
        'How do I register my swine?',
        'What are the official contact details?',
      ],
    };
  }

  // 2. REFUSAL: Personal records inquiry ("Show my records", "Show my swine records", etc.)
  if (
    lower.includes('my record') ||
    lower.includes('my swine') ||
    lower.includes('my pig') ||
    lower.includes('my farm') ||
    lower.includes('show my') ||
    lower.includes('view my') ||
    lower.includes('check my') ||
    lower.includes('my registration')
  ) {
    return {
      reply: `Registry records are available through the authorized portal. Please sign in using your official account.`,
      action: {
        type: 'open_login',
        label: 'Official Login',
      },
      suggestions: [
        'What are the requirements?',
        'How do I register my swine?',
        'What are the official contact details?',
      ],
    };
  }

  // 3. REFUSAL: "Where" queries regarding individual swine, farmers, internal GIS locations, pins, coordinates
  const isWhereLocationOfFarmerOrSwine =
    (lower.includes('where is') || lower.includes('where are') || lower.includes('where can i find') || lower.includes('coordinates') || lower.includes('location of') || lower.includes('pin') || lower.includes('gps')) &&
    (lower.includes('farmer') || lower.includes('pig') || lower.includes('swine') || lower.includes('pen') || lower.includes('juan') || lower.includes('infected') || lower.includes('raiser') || lower.includes('map coordinates') || lower.includes('gis coordinates'));

  if (isWhereLocationOfFarmerOrSwine) {
    return {
      reply: `I can provide publicly available information about the Hinunangan Swine Registry, but individual swine, farmer, surveillance, and internal GIS locations are restricted to authorized system users.`,
      suggestions: [
        'Where is Hinunangan?',
        'What barangays are covered?',
        'What are the official contact details?',
        'What is the Swine Registry?',
      ],
    };
  }

  // 4. REFUSAL: "Who" queries regarding ownership of specific swine or raiser identities
  const isWhoQuery =
    (lower.includes('who owns') || lower.includes('who is the owner') || lower.includes('who registered') || lower.includes('owner of') || (lower.startsWith('who') && (lower.includes('swine') || lower.includes('pig') || lower.includes('hin-') || lower.includes('ear tag'))));

  if (isWhoQuery) {
    return {
      reply: `I can't provide private farmer, raiser, or registry information. That information is available only to authorized personnel.`,
      suggestions: [
        'What is the Swine Registry?',
        'What are the requirements?',
        'What are the official contact details?',
      ],
    };
  }

  // 5. General "Where is Hinunangan?"
  if (
    lower.includes('where is hinunangan') ||
    lower.includes('location of hinunangan') ||
    (lower.includes('where') && lower.includes('hinunangan') && !lower.includes('pig') && !lower.includes('farmer'))
  ) {
    return {
      reply: `📍 **Municipality of Hinunangan, Southern Leyte**:
Hinunangan is a coastal municipality in the eastern part of Southern Leyte, Eastern Visayas (Region VIII), Philippines. It spans 40 official barangays, bordered by Silago to the north, Hinundayan and Anahawan to the south, and Leyte Gulf to the east.

The Municipal Agriculture Office (MAO) is located at the **Town Hall Compound, Poblacion, Hinunangan, Southern Leyte 6601**.`,
      suggestions: [
        'What barangays are covered?',
        'What are the official contact details?',
        'What is the Swine Registry?',
      ],
    };
  }

  // 6. "What is the Swine Registry?" / Purpose of the system
  if (
    lower.includes('what is the swine registry') ||
    lower.includes('what is this system') ||
    lower.includes('purpose') ||
    lower.includes('about the registry') ||
    lower.includes('about the system')
  ) {
    return {
      reply: `📋 **DA Hinunangan Swine Registry & Biosurveillance System**:
The system is an official municipal platform managed by the **Department of Agriculture** and the **Municipal Agriculture Office (MAO) of Hinunangan**, in collaboration with the **Southern Leyte State University (SLSU) Extension Center**.

**Key Purposes**:
1. **Livestock Traceability**: Digitize pig populations, unique ear-tag identifiers, and health histories across all 40 barangays.
2. **ASF Defense**: Safeguard the municipality's African Swine Fever **Green Zone (Free)** status through strict biosecurity standards.
3. **Farmer Support**: Assist RSBSA-registered raisers with veterinary outreach, vaccination, and official transport clearances.
4. **Market Transparency**: Connect accredited local hog raisers with meat buyers through certified Ready-to-Sell listings.`,
      suggestions: [
        'How do I register my swine?',
        'What are the requirements?',
        'What barangays are covered?',
      ],
    };
  }

  // 7. "How do I register my swine?" / "How can I register a swine?"
  if (
    lower.includes('how can i register') ||
    lower.includes('how do i register') ||
    lower.includes('how to register') ||
    lower.includes('register my swine') ||
    lower.includes('register a swine') ||
    lower.includes('registration process')
  ) {
    return {
      reply: `📝 **How to Register Your Swine in Hinunangan**:

1. **Check Eligibility**: Ensure you are an RSBSA-registered hog raiser or resident of any of the 40 barangays in Hinunangan.
2. **Prepare Swine Details**: Have your swine ready for physical tagging (breed, approximate age/DOB, and current liveweight).
3. **Comply with Basic Biosecurity**: Ensure your pen has perimeter barrier fencing, an active disinfectant footbath, potable water, and **zero swill feeding (kanin-baboy)**.
4. **Contact Your Focal Person**: Notify your **Barangay Agricultural Focal Person** during designated inspection schedules at your Barangay Hall, or visit the **Municipal Agriculture Office (MAO)** at the Town Hall Compound.
5. **Issuance**: Once verified and tagged, your swine will be entered into the official registry and issued a tracking clearance.`,
      suggestions: [
        'What are the requirements?',
        'What are the official contact details?',
        'What should I do if my pigs are sick?',
      ],
    };
  }

  // 8. "What are the requirements?"
  if (
    lower.includes('requirement') ||
    lower.includes('qualifications') ||
    lower.includes('what do i need') ||
    lower.includes('needed to register')
  ) {
    return {
      reply: `📑 **Official Requirements for Swine Registration**:

• **Raiser Credentials**: Valid Government ID and Proof of Residency in Hinunangan (or RSBSA Farmer Reference Number).
• **Facility Standards**: Basic pen biosecurity compliance:
  - Secure pen enclosure/fence.
  - Footbath installed at pen entrance.
  - Deepwell or potable drinking water source.
  - Strictly **NO swill feeding** (food scraps/bahog).
• **Swine Information**: Breed classification (Landrace, Large White, Duroc, Native, or crossbreed), birth date/age, and current weight estimate.
• **Inspection & Ear Tagging**: Permitting the authorized Barangay Focal Person or MAO technician to attach the official ear tag and record pen georeference.`,
      suggestions: [
        'How do I register my swine?',
        'What are the official contact details?',
        'What is ASF?',
      ],
    };
  }

  // 9. "What is ASF?" / African Swine Fever info
  if (
    lower.includes('what is asf') ||
    lower.includes('african swine fever') ||
    lower.includes('asf virus') ||
    lower.includes('asf disease')
  ) {
    return {
      reply: `🛡️ **About African Swine Fever (ASF)**:
African Swine Fever is a severe, highly contagious viral disease affecting domestic and wild pigs. It causes high fever, respiratory distress, internal bleeding, and near 100% mortality in infected swine.

• **Human Health**: ASF is **NOT** a public health threat and **cannot infect humans**. However, humans and vehicles can easily spread the virus on shoes, tires, clothes, and uncooked pork products.
• **Hinunangan Status**: Hinunangan strictly maintains **Green Zone (Free)** status through checkpoint vehicle disinfection and municipal monitoring.
• **Golden Rule**: **Never feed swill (kanin-baboy/food scraps)** to pigs, as swill is the #1 vector of ASF transmission.`,
      suggestions: [
        'What should I do if my pigs are sick?',
        'What are the requirements?',
        'What are the official contact details?',
      ],
    };
  }

  // 10. "What should I do if my pigs are sick?"
  if (
    lower.includes('sick') ||
    lower.includes('fever') ||
    lower.includes('dying') ||
    lower.includes('symptoms') ||
    lower.includes('emergency') ||
    lower.includes('report sick')
  ) {
    return {
      reply: `🚨 **Emergency Protocol for Sick Swine**:

1. **Immediately Isolate**: Move the sick pig to a separate isolation pen away from other animals.
2. **DO NOT Sell or Transport**: Moving or selling sick pigs is strictly illegal under Municipal Ordinance and spreads disease.
3. **DO NOT Slaughter or Consume**: Do not butcher sick pigs for human or pet consumption.
4. **Disinfect**: Disinfect boots, pens, and equipment with bleach or veterinary disinfectant.
5. **Report Immediately**: Contact your **Barangay Agricultural Focal Person** or call the **Municipal Agriculture Emergency Hotline at (053) 578-2011 / 0917-888-9999** for free veterinary assessment.`,
      suggestions: [
        'What are the official contact details?',
        'What is ASF?',
        'What are the requirements?',
      ],
    };
  }

  // 11. "What programs and services are available?"
  if (
    lower.includes('programs') ||
    lower.includes('services') ||
    lower.includes('assistance') ||
    lower.includes('benefits') ||
    lower.includes('support')
  ) {
    return {
      reply: `🌾 **DA Hinunangan Municipal Agricultural Programs & Services**:

• **Free Swine Ear Tagging & Micro-Profiling**: Official registry identification for livestock security.
• **Biosecurity Assistance & Farm Audits**: Assessment of pen biosecurity to protect against disease incursions.
• **Veterinary Technical Support**: Provided in partnership with Southern Leyte State University (SLSU) Extension Center.
• **Livestock Health Clearances & Transport Certificates**: Veterinary clearances for municipal and provincial livestock movement.
• **Ready-to-Sell Market Catalog**: Assisting verified local raisers in connecting with legitimate buyers.
• **Vaccination & Deworming Campaigns**: Periodic free municipal livestock deworming and immunization drives.`,
      suggestions: [
        'How do I register my swine?',
        'What are the requirements?',
        'What are the official contact details?',
      ],
    };
  }

  // 12. "What barangays are in Hinunangan? / What barangays are covered?"
  if (
    lower.includes('barangay') ||
    lower.includes('covered') ||
    lower.includes('coverage') ||
    lower.includes('list of barangay')
  ) {
    const bgNames = HINUNANGAN_BARANGAYS.map(b => b.name).join(', ');
    return {
      reply: `🗺️ **Municipal Coverage (40 Barangays)**:
The DA Hinunangan Swine Registry covers all **40 official barangays** of Hinunangan, Southern Leyte:

${bgNames}

Every barangay has an assigned **Barangay Agricultural Focal Person** working alongside the Punong Barangay and Municipal Agriculture Office.`,
      suggestions: [
        'What are the official contact details?',
        'How do I register my swine?',
        'What is the Swine Registry?',
      ],
    };
  }

  // 13. "How can I contact the office? / What are the official contact details?"
  if (
    lower.includes('contact') ||
    lower.includes('phone') ||
    lower.includes('email') ||
    lower.includes('hotline') ||
    lower.includes('address') ||
    lower.includes('office') ||
    lower.includes('hours')
  ) {
    return {
      reply: `📞 **Official Contact Information**:

• **Office**: Municipal Agriculture Office (MAO)
• **Location**: Hinunangan Town Hall Compound, Poblacion, Hinunangan, Southern Leyte 6601
• **Telephone**: (053) 578-2011
• **Emergency Hotline**: 0917-888-9999
• **Email**: agri.hinunangan@gmail.com
• **Official Facebook**: [facebook.com/LGUHinunanganOfficial](https://facebook.com/LGUHinunanganOfficial)
• **Office Hours**: Monday to Friday, 8:00 AM – 5:00 PM`,
      suggestions: [
        'What is the Swine Registry?',
        'How do I register my swine?',
        'What are the requirements?',
      ],
    };
  }

  // 14. Public Legal Decrees & Ordinances
  if (
    lower.includes('ordinance') ||
    lower.includes('decree') ||
    lower.includes('law') ||
    lower.includes('legal') ||
    lower.includes('resolution')
  ) {
    return {
      reply: `⚖️ **Public Ordinances & Biosecurity Decrees**:

• **Hinunangan Municipal Ordinance No. 2025-59**: Mandates swine profiling, movement clearances, and the Babay ASF Biosecurity framework throughout Hinunangan.
• **Southern Leyte Provincial Ordinance 2021-018**: Enforces strict border quarantine inspection, mandatory vehicle disinfection at municipal checkpoints, and absolute prohibition of swill feeding.
• **Municipal Executive Order No. 12-2023**: Designates Barangay Agricultural Focal Persons to supervise local biosecurity compliance.`,
      suggestions: [
        'What is ASF?',
        'What are the requirements?',
        'What are the official contact details?',
      ],
    };
  }

  // 15. Default Public Greeting
  return {
    reply: `👋 Hello! I am the **DA Hinunangan Public Information Assistant**.

I can answer publicly available questions regarding:
• **Swine Registry & Guidelines**: How to register your swine and RSBSA requirements.
• **Programs & Services**: Municipal agricultural assistance, veterinary visits, and clearances.
• **African Swine Fever (ASF)**: Prevention measures, swill feeding prohibition, and zoning.
• **Barangays & Office Contacts**: Official phone numbers, office location, and focal person coordination.

*Note: Individual swine records, raiser personal data, and internal GIS coordinates are restricted to authorized personnel. Authorized users may sign in via the portal.*`,
    action: {
      type: 'open_login',
      label: 'Official Login',
    },
    suggestions: PUBLIC_ASSISTANT_SUGGESTIONS,
  };
}

/**
 * Client-side assistant response generator with deterministic queries
 * that operate on live in-memory / local storage records for AUTHENTICATED users.
 */
export function generateLocalAssistantResponse(
  query: string,
  currentUser: UserAccount | null,
  currentRole: UserRole | 'landing'
): AssistantResponse {
  // If user is unauthenticated or on landing, route strictly to public assistant
  if (currentRole === 'landing' || !currentUser) {
    return generateLocalPublicAssistantResponse(query);
  }

  const allRecords = storageService.getSwineRecords();
  const authorizedRecords = getAuthorizedRecords(allRecords, currentUser, currentRole);
  const lower = query.toLowerCase().trim();
  const role = currentUser?.role || currentRole;

  // 0. Security check: Refuse secrets/passwords/API keys
  if (
    lower.includes('password') ||
    lower.includes('api key') ||
    lower.includes('apikey') ||
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('database password') ||
    lower.includes('sql') ||
    lower.includes('credentials')
  ) {
    return {
      reply: `🔒 **Security Notice**: System credentials, internal database settings, API keys, and administrative secrets are restricted and cannot be disclosed under any circumstances.`,
      suggestions: [
        'Show today\'s registry status',
        'How many swine are registered?',
        'Open GIS Swine Map',
      ],
    };
  }

  // 0.1 Super Admin Master Configuration natural language command handling
  if (role === 'super_admin') {
    const configResult = interpretSuperAdminConfigCommand(query, masterConfigService.getConfig());
    if (configResult.isConfigCommand) {
      if (configResult.isSecurityViolation) {
        return {
          reply: configResult.securityMessage || 'Security modification restricted.',
          suggestions: [
            'Change Admin sidebar to blue',
            'Set Focal Person font to Poppins',
            'Show today\'s registry status',
          ],
        };
      }

      if (configResult.proposedChange) {
        return {
          reply: configResult.previewMessage || 'Proposed configuration change ready for review.',
          action: {
            type: 'confirm_config_change',
            actionId: 'apply_proposed_config',
            label: 'Apply Configuration Change',
            payload: configResult.proposedChange,
          },
          suggestions: [
            'Cancel',
            'Reset Admin appearance',
            'Show today\'s registry status',
          ],
        };
      }
    }
  }

  // 1. Role-based cross-barangay restrictions for Focal Persons
  if (role === 'focal' && currentUser?.assignedBarangay) {
    const userBarangay = currentUser.assignedBarangay.toLowerCase();
    const matchedBg = HINUNANGAN_BARANGAYS.find(
      b => lower.includes(b.name.toLowerCase()) && b.name.toLowerCase() !== userBarangay
    );

    if (matchedBg) {
      return {
        reply: `I can only provide registry and GIS information for your assigned barangay/areas.`,
        suggestions: [
          `Show records for ${currentUser.assignedBarangay}`,
          `How many ready to sell in ${currentUser.assignedBarangay}?`,
          'Register a new swine',
        ],
      };
    }
  }

  // 2. Agent restrictions: Restricted to takeoff catalog
  if (role === 'agent') {
    const isConfidentialQuery =
      lower.includes('farmer list') ||
      lower.includes('all farmers') ||
      lower.includes('audit') ||
      lower.includes('inspection record') ||
      lower.includes('sick pig') ||
      lower.includes('quarantined');

    if (isConfidentialQuery) {
      return {
        reply: `As an accredited Agent / Buyer, your access is focused on the Ready for Take-Off market catalog, verified commercial hog availability, and transport clearance requirements.`,
        action: {
          type: 'navigate',
          tab: 'takeoff',
          label: 'View Ready for Take-Off Catalog',
        },
        suggestions: [
          'How many swine are ready to sell?',
          'What are the transport requirements?',
          'Show takeoff catalog',
        ],
      };
    }
  }

  // 2. Swine Registration & Data Input Guidance ("asa mo input", "unsaon pag-register")
  if (
    lower.includes('register') ||
    lower.includes('registration') ||
    lower.includes('input') ||
    lower.includes('asa mo input') ||
    lower.includes('asa i-input') ||
    lower.includes('unsaon pag') ||
    lower.includes('add swine') ||
    lower.includes('new pig') ||
    lower.includes('how to register') ||
    lower.includes('where to enter')
  ) {
    return {
      reply: `📋 **DA Hinunangan Swine Registration & Data Input Guide**:

**Asa Mo-Input (Where to Input)**:
1. **Adto sa "Swine Records" Tab** sa sidebar navigation (o i-click ang green button sa ubos).
2. I-click ang **[+ Register Swine]** button (o i-click ang **Swine Farm Registration** sa Dashboard).

**Data nga I-Input (Fields to Enter)**:
• **Impormasyon sa Mag-uuma / Raiser**: Full Name, Contact Number, Barangay / Purok address, ug RSBSA ID.
• **Swine Biometric Details**: Ear Tag No., Pig ID Tag (\`HIN-YYYY-XXXX\`), Date of Birth (awtomatikong kwentahon ang edad sa adlaw/bulan/tuig), Sex (Male / Female / Castrated), Breed, ug Estimated Weight (kg).
• **Biosecurity Protocol**: Perimeter fence, footbath, no swill feeding.
• **GIS GPS Pinning**: I-click ang **"Pin GPS on Map"** aron mabutang ang exact coordinates sa GIS Biosurveillance Map.

*Pahibalo: Bisan walay internet signal sa bukid, pwede gihapon mag-input gamit ang Offline Mode!*`,
      action: {
        type: 'navigate',
        tab: 'records',
        label: 'Adto sa Swine Records aron Mo-Input',
      },
      suggestions: [
        'How many swine are registered?',
        'How does offline mode work?',
        'Open GIS Swine Map',
      ],
    };
  }

  // 2.1 User Accounts Management Guidance (Admin & Super Admin)
  if (
    lower.includes('user account') ||
    lower.includes('manage account') ||
    lower.includes('add user') ||
    lower.includes('create account') ||
    lower.includes('focal person account')
  ) {
    if (role === 'super_admin' || role === 'admin') {
      return {
        reply: `👥 **User Accounts Management**:

Both Super Admin and Admin can manage system accounts:
• Create, edit, and deactivate accounts for Barangay Agricultural Focal Persons, Meat Agents/Traders, and Administrators.
• Assign focal persons to their designated Hinunangan barangay.
• Click the button below to navigate directly to the User Accounts console.`,
        action: {
          type: 'navigate',
          tab: 'accounts',
          label: 'Go to User Accounts',
        },
        suggestions: [
          'Show today\'s registry status',
          'How many swine are registered?',
          'Open GIS Swine Map',
        ],
      };
    }
  }

  // 3. Ready for Take-Off / Market Inquiries
  if (
    lower.includes('ready to sell') ||
    lower.includes('take off') ||
    lower.includes('take-off') ||
    lower.includes('market') ||
    lower.includes('commercial') ||
    lower.includes('buyer')
  ) {
    const readyHogs = authorizedRecords.filter(
      r => !r.isArchived && (r.readyToSell || (r.weightKg && r.weightKg >= 75)) && r.status !== 'sold' && r.status !== 'deceased'
    );
    const avgWeight =
      readyHogs.length > 0
        ? Math.round(readyHogs.reduce((acc, h) => acc + (h.weightKg || 0), 0) / readyHogs.length)
        : 0;

    const scopeLabel =
      role === 'focal' && currentUser?.assignedBarangay
        ? `in Barangay ${currentUser.assignedBarangay}`
        : 'municipal-wide across Hinunangan';

    return {
      reply: `🚀 **Ready for Take-Off Status (${scopeLabel})**:

• **Eligible Market Hogs**: **${readyHogs.length} head** currently qualified for commercial sale.
• **Average Market Weight**: **${avgWeight} kg**
• **Criteria**: Swine tagged as ready-to-sell or weighing 75kg and above with valid health status.
• **Clearance Requirement**: Must possess a valid DA Veterinary Health Certificate and Barangay Transport Clearance before dispatch.`,
      action: {
        type: 'navigate',
        tab: 'takeoff',
        label: 'View Ready for Take-Off Catalog',
      },
      suggestions: [
        'How many swine are registered in total?',
        'How do I print a transport clearance?',
        'Show biosecurity status',
      ],
    };
  }

  // 4. Live Statistics & Summary Inquiries
  if (
    lower.includes('how many') ||
    lower.includes('count') ||
    lower.includes('total') ||
    lower.includes('status') ||
    lower.includes('summary') ||
    lower.includes('dashboard')
  ) {
    const total = authorizedRecords.length;
    const activeRaisers = new Set(
      authorizedRecords.map(r => (r.ownerName || '').trim().toLowerCase()).filter(Boolean)
    ).size;
    const readyHogs = authorizedRecords.filter(
      r => !r.isArchived && (r.readyToSell || (r.weightKg && r.weightKg >= 75)) && r.status !== 'sold' && r.status !== 'deceased'
    );
    const healthyCount = authorizedRecords.filter(
      r => (r.healthStatus || 'healthy').toLowerCase() === 'healthy'
    ).length;
    const underObservationCount = authorizedRecords.filter(
      r => (r.healthStatus || '').toLowerCase() === 'under observation'
    ).length;
    const avgWeight =
      total > 0
        ? Math.round(authorizedRecords.reduce((acc, r) => acc + (r.weightKg || 0), 0) / total)
        : 0;

    const scopeLabel =
      role === 'focal' && currentUser?.assignedBarangay
        ? `Barangay ${currentUser.assignedBarangay}`
        : 'Municipality of Hinunangan';

    return {
      reply: `📊 **Live Registry & Biosurveillance Summary (${scopeLabel})**:

• **Total Swine Registered**: **${total.toLocaleString()} head**
• **Registered Raisers**: **${activeRaisers.toLocaleString()} farmers**
• **Ready for Take-Off**: **${readyHogs.length} head**
• **Biosecurity Health**: **${healthyCount} healthy**, **${underObservationCount} under observation**
• **Average Weight**: **${avgWeight} kg**

All metrics reflect live, real-time records from the database.`,
      action: {
        type: 'navigate',
        tab: 'dashboard',
        label: 'View Full Dashboard Metrics',
      },
      suggestions: [
        'How many are ready to sell?',
        'Open GIS Swine Map',
        'How do I register a swine?',
      ],
    };
  }

  // 5. GIS & Spatial Mapping Inquiries
  if (
    lower.includes('gis') ||
    lower.includes('map') ||
    lower.includes('gps') ||
    lower.includes('coordinates') ||
    lower.includes('location') ||
    lower.includes('pin')
  ) {
    return {
      reply: `🗺️ **GIS Swine Biosurveillance Map**:

The interactive GIS mapping module provides spatial visualization for all registered pens and swine populations in Hinunangan:
• **Barangay Boundaries**: GeoJSON polygons outline each barangay's biosecurity zones.
• **Spatial Pins**: Color-coded pins indicate farm locations, health statuses (Green = Healthy, Yellow = Observation, Red = Quarantine/Infected).
• **Clustering & Heatmap**: High-density swine zones are automatically clustered for outbreak risk assessment.
• **GPS Pinning**: Field focal persons can click or tap anywhere on the map to automatically pin coordinates during registration.`,
      action: {
        type: 'navigate',
        tab: 'gis',
        label: 'Open GIS Swine Map',
      },
      suggestions: [
        'How does ASF biosecurity work?',
        'Show total swine records',
        'How to print reports?',
      ],
    };
  }

  // 6. ASF & Biosecurity Regulations Inquiries
  if (
    lower.includes('asf') ||
    lower.includes('african swine fever') ||
    lower.includes('biosecurity') ||
    lower.includes('quarantine') ||
    lower.includes('zone') ||
    lower.includes('ordinance') ||
    lower.includes('decree')
  ) {
    return {
      reply: `🛡️ **African Swine Fever (ASF) Biosecurity Protocol**:

Under Municipal Ordinance and National DA Administrative Orders (Babay ASF Program):
1. **Zoning Classification**:
   • **Red Zone (Infected)**: Confirmed outbreak within 1km radius. Strict lockdown on swine and pork movement.
   • **Pink Zone (Buffer)**: 7km containment perimeter with mandatory biosecurity checkpoints.
   • **Yellow Zone (Surveillance)**: Intensive random blood sampling and active surveillance.
   • **Green Zone (Free)**: Disease-free zone with standard biosecurity clearances.
2. **Preventive Farm Measures**:
   • Mandatory footbaths and disinfectant sprays at pen entrances.
   • Strict ban on swill feeding (bahog / kaning-baboy).
   • Restrict farm visitors and animal dealers without DA permits.`,
      action: {
        type: 'navigate',
        tab: 'biosecurity',
        label: 'Go to Barangay Biosecurity Module',
      },
      suggestions: [
        'View ASF Legal Decrees',
        'How to register a swine?',
        'Show today\'s registry status',
      ],
    };
  }

  // 7. Reports & Certificates Inquiries
  if (
    lower.includes('report') ||
    lower.includes('print') ||
    lower.includes('certificate') ||
    lower.includes('export') ||
    lower.includes('pdf')
  ) {
    return {
      reply: `📑 **Official DA Hinunangan Reports & Documentation**:

You can generate and print official livestock documentation directly:
• **Municipal Swine Inventory Summary**: Complete head count by barangay and breed.
• **Barangay Biosecurity Assessment Report**: Zone-level audit with risk indices.
• **Veterinary Health Clearance / Certificate**: Required document for hog transport and market take-off.
• **Export to Excel / PDF**: Instant downloadable tabular spreadsheets and printable letterhead reports.`,
      action: {
        type: 'navigate',
        tab: 'reports',
        label: 'Go to Print Official Reports',
      },
      suggestions: [
        'How many swine ready to sell?',
        'Show registry summary',
        'Open GIS Swine Map',
      ],
    };
  }

  // 8. Offline & PWA Inquiries
  if (
    lower.includes('offline') ||
    lower.includes('pwa') ||
    lower.includes('no internet') ||
    lower.includes('sync') ||
    lower.includes('connection')
  ) {
    return {
      reply: `📱 **Field Offline Mode & Automatic Synchronization**:

The DA Hinunangan Swine Registry is engineered as a Progressive Web App (PWA):
• **Field Operation**: You can register swine, pin GPS coordinates, and inspect farms even in remote puroks without mobile signal.
• **Offline Storage**: Records and photos are saved securely on your device via IndexedDB.
• **Automatic Sync**: When your device reconnects to Wi-Fi or cellular data, all pending records sync seamlessly with the central municipal database.`,
      suggestions: [
        'How to register a swine?',
        'Open GIS Swine Map',
        'Show today\'s registry status',
      ],
    };
  }

  // 9. Sensitive Action Confirmation
  if (lower.includes('delete') || lower.includes('remove record')) {
    if (role !== 'super_admin' && role !== 'admin') {
      return {
        reply: `⛔ **Permission Denied**: Only Administrators and Super Admins are permitted to delete swine records. Focal Persons and Agents have restricted modification access.`,
      };
    }
    return {
      reply: `⚠️ **Action Confirmation Required**: You have requested a record deletion. Deleting records permanently removes them from official biosurveillance statistics. Would you like to proceed to Swine Records to select and confirm the target record?`,
      action: {
        type: 'confirm_action',
        tab: 'records',
        label: 'Navigate to Records & Review Deletion',
        actionId: 'confirm_delete',
      },
      suggestions: ['Cancel', 'Show today\'s registry status'],
    };
  }

  // Default contextual greeting
  const username = currentUser?.name || currentUser?.fullName || 'User';
  return {
    reply: `👋 Hello **${username}**! I am the **DA Hinunangan Biosecurity Assistant**.

I am your agricultural intelligent copilot for:
• **Swine Registry & Farmers**: Real-time population, raiser records, and registration workflows.
• **GIS Map & Biosurveillance**: Farm pinning, barangay boundaries, and disease heatmaps.
• **African Swine Fever (ASF)**: Zoning, quarantine rules, and biosecurity audits.
• **Take-Off & Marketing**: Clearance, market-ready hogs, and health certificates.
• **Offline Mode**: Field syncing and IndexedDB queue management.

You can ask me questions like:
• *"Show today's registry status"*
• *"How many swine are ready to sell?"*
• *"Open the GIS Swine Map"*
• *"How do I register a swine?"*
• *"How does ASF biosecurity work?"*`,
    suggestions: role === 'focal' && currentUser?.assignedBarangay
      ? [
          `Show records for ${currentUser.assignedBarangay}`,
          `How many ready to sell in ${currentUser.assignedBarangay}?`,
          'Register a new swine',
          'Open GIS Swine Map',
        ]
      : role === 'agent'
      ? [
          'How many swine are ready to sell?',
          'View Ready for Take-Off catalog',
          'What are the transport requirements?',
        ]
      : [
          'Show today\'s registry status',
          'How many swine are ready to sell?',
          'How do I register a swine?',
          'Open GIS Swine Map',
        ],
  };
}

/**
 * Service to execute assistant queries against backend /api/public/assistant/chat
 * or /api/assistant/chat, with deterministic offline fallback when disconnected.
 */
export const assistantService = {
  /**
   * Dedicated method for public visitors on the landing page or unauthenticated portal routes.
   * Strictly invokes the public API and sanitized public fallback engine.
   */
  async askPublicAssistant(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; text: string }> = []
  ): Promise<AssistantResponse> {
    try {
      const res = await fetch('/api/public/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: history.map(h => ({
            role: h.role,
            content: h.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          return {
            reply: data.reply,
            action: data.action,
            suggestions: data.suggestions || PUBLIC_ASSISTANT_SUGGESTIONS.slice(0, 4),
          };
        }
      }
    } catch {
      // Offline fallback
    }

    // Fallback to local intelligence engine using sanitized public content
    return generateLocalPublicAssistantResponse(message);
  },

  /**
   * Main assistant query handler. Automatically switches between Public and
   * Authenticated System modes based on user role and authentication status.
   */
  async askAssistant(
    message: string,
    currentUser: UserAccount | null,
    currentRole: UserRole | 'landing',
    history: Array<{ role: 'user' | 'assistant'; text: string }> = []
  ): Promise<AssistantResponse> {
    // Mode A: Public Chatbot
    if (currentRole === 'landing' || !currentUser) {
      return this.askPublicAssistant(message, history);
    }

    // Mode B: Authenticated System Chatbot
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || currentRole,
          'x-user-id': currentUser?.id || '',
          'x-user-name': currentUser?.name || currentUser?.fullName || 'User',
          'x-user-assigned-barangay': currentUser?.assignedBarangay || '',
        },
        body: JSON.stringify({
          message,
          history: history.map(h => ({
            role: h.role,
            content: h.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          return {
            reply: data.reply,
            action: data.action,
            suggestions: data.suggestions,
          };
        }
      }
    } catch {
      // Offline fallback
    }

    // Fallback to local intelligence engine using authorized browser storage
    return generateLocalAssistantResponse(message, currentUser, currentRole);
  },
};

