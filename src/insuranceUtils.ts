/**
 * Master Insurance Registry and Normalization Engine
 * Handles canonical provider deduplication, alias resolution, and master list persistence.
 */

export interface MasterInsurance {
  id: string;
  name: string;
  category: 'Government / National' | 'Private Insurance' | 'Corporate / Staff' | 'Micro-Insurance / NGO';
  aliases: string[];
  isCustom?: boolean;
}

export const DEFAULT_MASTER_INSURANCE_LIST: MasterInsurance[] = [
  {
    id: 'nhif-sha',
    name: 'NHIF / SHA',
    category: 'Government / National',
    aliases: ['nhif', 'sha', 'nhif/sha', 'nhif / sha', 'social health authority', 'national hospital insurance fund', 'sha/nhif', 'sha / nhif']
  },
  {
    id: 'britam',
    name: 'Britam Insurance',
    category: 'Private Insurance',
    aliases: ['britam', 'britam corporate', 'british american', 'british american insurance', 'british-american', 'britam insurance', 'british american corporate']
  },
  {
    id: 'first-assurance',
    name: 'First Assurance',
    category: 'Private Insurance',
    aliases: ['first assurance', 'first insurance', 'first assurannce', 'first assurance company', 'first assurance corporate']
  },
  {
    id: 'tumutumu-staff',
    name: 'Tumutumu Staff & Dependants',
    category: 'Corporate / Staff',
    aliases: ['staff', 'tumutumu staff', 'tumutumu staff dependant', 'tumutumu staff / dependant', 'tumutumu staff dependent', 'staff scheme', 'hospital staff', 'tumutumu staff scheme', 'staff dependant', 'staff dependent']
  },
  {
    id: 'm-tiba',
    name: 'M-TIBA',
    category: 'Micro-Insurance / NGO',
    aliases: ['mtiba', 'm-tiba', 'm tiba', 'carepay mtiba', 'carepay']
  },
  {
    id: 'cic-insurance',
    name: 'CIC Insurance',
    category: 'Private Insurance',
    aliases: ['cic', 'cic insurance', 'cic general', 'cic group', 'cic corporate']
  },
  {
    id: 'aar-insurance',
    name: 'AAR Insurance',
    category: 'Private Insurance',
    aliases: ['aar', 'aar insurance', 'aar healthcare', 'aar insurance kenya']
  },
  {
    id: 'apa-insurance',
    name: 'APA Insurance',
    category: 'Private Insurance',
    aliases: ['apa', 'apa insurance', 'apollo apa', 'apa life', 'apollo insurance']
  },
  {
    id: 'jubilee-insurance',
    name: 'Jubilee Insurance',
    category: 'Private Insurance',
    aliases: ['jubilee', 'jubilee insurance', 'jubilee health', 'jubilee allianz']
  },
  {
    id: 'uap-old-mutual',
    name: 'UAP Old Mutual',
    category: 'Private Insurance',
    aliases: ['oldmutual', 'old mutual', 'uap', 'uap old mutual', 'uap-old mutual', 'old mutual kenya', 'uap insurance', 'oldmutual insurance']
  },
  {
    id: 'minet-kenya',
    name: 'Minet Kenya',
    category: 'Corporate / Staff',
    aliases: ['minet', 'minet corporate', 'minet kenya', 'minet insurance', 'minet tsc', 'minet scheme']
  },
  {
    id: 'pacis-insurance',
    name: 'Pacis Insurance',
    category: 'Private Insurance',
    aliases: ['pacis', 'pacis insurance', 'pacis insurance company']
  },
  {
    id: 'madison-insurance',
    name: 'Madison Insurance',
    category: 'Private Insurance',
    aliases: ['madison', 'madison insurance', 'madison general', 'madison life']
  },
  {
    id: 'kebs-scheme',
    name: 'KEBS Corporate Scheme',
    category: 'Corporate / Staff',
    aliases: ['kebs', 'kebs corporate', 'kebs corporate scheme', 'kenya bureau of standards', 'kebs scheme']
  },
  {
    id: 'first-aid-scheme',
    name: 'First Aid / Emergency Scheme',
    category: 'Corporate / Staff',
    aliases: ['first aid', 'first aid / emergency', 'first aid / emergency scheme', 'emergency aid', 'first-aid']
  },
  {
    id: 'ga-insurance',
    name: 'GA Insurance',
    category: 'Private Insurance',
    aliases: ['ga', 'ga insurance', 'general accident', 'ga life']
  },
  {
    id: 'heritage-insurance',
    name: 'Heritage Insurance',
    category: 'Private Insurance',
    aliases: ['heritage', 'heritage insurance', 'heritage insurance company']
  },
  {
    id: 'kcb-scheme',
    name: 'KCB Corporate Scheme',
    category: 'Corporate / Staff',
    aliases: ['kcb', 'kcb scheme', 'kcb bank', 'kcb corporate']
  },
  {
    id: 'kenindia-assurance',
    name: 'Kenindia Assurance',
    category: 'Private Insurance',
    aliases: ['kenindia', 'kenindia assurance', 'kenindia insurance']
  },
  {
    id: 'corporate-scheme',
    name: 'Corporate / Employer Scheme',
    category: 'Corporate / Staff',
    aliases: ['corporate', 'corporate scheme', 'employer scheme', 'corporate / employer scheme', 'company corporate']
  },
  {
    id: 'other-insurance',
    name: 'Other Private Insurance',
    category: 'Private Insurance',
    aliases: ['other', 'other insurance', 'other private insurance', 'private', 'self private']
  }
];

const LOCAL_STORAGE_CUSTOM_INSURANCE_KEY = 'tumutumu_master_insurance_custom_v1';

/**
 * Get all stored custom insurance provider names
 */
export function getStoredCustomInsurances(): MasterInsurance[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_INSURANCE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save a custom insurance provider to the local registry
 */
export function saveCustomInsuranceProvider(name: string, category: MasterInsurance['category'] = 'Private Insurance'): MasterInsurance {
  const cleanName = name.trim();
  const id = `ins-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  const customItem: MasterInsurance = {
    id,
    name: cleanName,
    category,
    aliases: [cleanName.toLowerCase()],
    isCustom: true
  };

  const existing = getStoredCustomInsurances();
  const alreadyPresent = existing.some(item => item.name.toLowerCase() === cleanName.toLowerCase());
  if (!alreadyPresent) {
    existing.push(customItem);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_INSURANCE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not persist custom insurance to localStorage', e);
    }
  }

  return customItem;
}

/**
 * Returns full combined master insurance list (default + custom)
 */
export function getFullMasterInsuranceList(additionalCustom: MasterInsurance[] = []): MasterInsurance[] {
  const localCustom = getStoredCustomInsurances();
  const map = new Map<string, MasterInsurance>();

  DEFAULT_MASTER_INSURANCE_LIST.forEach(item => {
    map.set(item.name.toLowerCase(), item);
  });

  localCustom.forEach(item => {
    map.set(item.name.toLowerCase(), item);
  });

  additionalCustom.forEach(item => {
    map.set(item.name.toLowerCase(), item);
  });

  return Array.from(map.values());
}

/**
 * Normalizes any variations, typos, or casing of an insurance company into a canonical Master Name.
 * e.g. "MTIBA" -> "M-TIBA"
 * "BRITAM CORPORATE" -> "Britam Insurance"
 * "FIRST INSURANCE" / "FIRST ASSURANNCE" -> "First Assurance"
 * "STAFF" / "TUMUTUMU STAFF DEPENDANT" -> "Tumutumu Staff & Dependants"
 * "aar" -> "AAR Insurance", "apa" -> "APA Insurance"
 */
export function normalizeInsuranceCompany(rawName?: string, customInsurances: MasterInsurance[] = []): string {
  if (!rawName || !rawName.trim()) {
    return 'NHIF / SHA';
  }

  const clean = rawName.trim();
  const lower = clean.toLowerCase();

  // 1. Direct alias search in Default Master List
  for (const master of DEFAULT_MASTER_INSURANCE_LIST) {
    if (master.name.toLowerCase() === lower) {
      return master.name;
    }
    if (master.aliases.some(alias => alias.toLowerCase() === lower)) {
      return master.name;
    }
  }

  // 2. Direct alias search in Custom Insurances
  const fullList = getFullMasterInsuranceList(customInsurances);
  for (const custom of fullList) {
    if (custom.name.toLowerCase() === lower) {
      return custom.name;
    }
    if (custom.aliases && custom.aliases.some(alias => alias.toLowerCase() === lower)) {
      return custom.name;
    }
  }

  // 3. Rule-based heuristic pattern matching for common Kenyan hospital insurance duplicates

  // First Assurance variations (e.g. FIRST INSURANCE, FIRST ASSURANNCE, FIRST ASSURANCE)
  if (
    lower.includes('first assur') ||
    lower.includes('first ins') ||
    lower.includes('first assu') ||
    lower.includes('firstassurance')
  ) {
    return 'First Assurance';
  }

  // Britam / British American variations (BRITAM, BRITAM CORPORATE, BRITISH AMERICAN, BRITISH AMERICAN INSURANCE)
  if (
    lower.includes('britam') ||
    lower.includes('british american') ||
    lower.includes('british-american') ||
    lower.includes('britishamerican')
  ) {
    return 'Britam Insurance';
  }

  // Tumutumu Staff & Dependants (STAFF, staff, TUMUTUMU STAFF, TUMUTUMU STAFF DEPENDANT)
  if (
    lower === 'staff' ||
    lower.includes('tumutumu staff') ||
    lower.includes('staff dependant') ||
    lower.includes('staff dependent') ||
    lower.includes('hospital staff') ||
    lower.startsWith('staff ') ||
    lower.endsWith(' staff')
  ) {
    return 'Tumutumu Staff & Dependants';
  }

  // M-TIBA / MTIBA
  if (
    lower === 'mtiba' ||
    lower === 'm-tiba' ||
    lower === 'm tiba' ||
    lower.includes('mtiba') ||
    lower.includes('m-tiba')
  ) {
    return 'M-TIBA';
  }

  // AAR vs APA distinction (Critical: They are two distinct insurance firms)
  if (lower === 'aar' || lower === 'aar insurance' || lower.startsWith('aar ') || lower.endsWith(' aar')) {
    return 'AAR Insurance';
  }

  if (lower === 'apa' || lower === 'apa insurance' || lower.startsWith('apa ') || lower.endsWith(' apa') || lower.includes('apollo apa')) {
    return 'APA Insurance';
  }

  // CIC Insurance
  if (lower === 'cic' || lower === 'cic insurance' || lower.startsWith('cic ') || lower.endsWith(' cic')) {
    return 'CIC Insurance';
  }

  // Jubilee Insurance
  if (lower.includes('jubilee')) {
    return 'Jubilee Insurance';
  }

  // UAP Old Mutual
  if (lower.includes('oldmutual') || lower.includes('old mutual') || lower === 'uap' || lower.includes('uap old mutual') || lower.includes('uap-old mutual')) {
    return 'UAP Old Mutual';
  }

  // Minet Kenya (MINET, MINET CORPORATE, MINET KENYA)
  if (lower.includes('minet')) {
    return 'Minet Kenya';
  }

  // Pacis Insurance
  if (lower.includes('pacis')) {
    return 'Pacis Insurance';
  }

  // Madison Insurance
  if (lower.includes('madison')) {
    return 'Madison Insurance';
  }

  // KEBS Scheme
  if (lower.includes('kebs')) {
    return 'KEBS Corporate Scheme';
  }

  // First Aid Scheme
  if (lower.includes('first aid') || lower.includes('first-aid')) {
    return 'First Aid / Emergency Scheme';
  }

  // NHIF / SHA
  if (lower.includes('nhif') || lower.includes('sha') || lower.includes('social health')) {
    return 'NHIF / SHA';
  }

  // GA Insurance
  if (lower === 'ga' || lower === 'ga insurance' || lower.startsWith('ga ') || lower.endsWith(' ga')) {
    return 'GA Insurance';
  }

  // Heritage Insurance
  if (lower.includes('heritage')) {
    return 'Heritage Insurance';
  }

  // KCB Scheme
  if (lower === 'kcb' || lower.includes('kcb scheme') || lower.includes('kcb corporate') || lower.includes('kcb bank')) {
    return 'KCB Corporate Scheme';
  }

  // Kenindia
  if (lower.includes('kenindia')) {
    return 'Kenindia Assurance';
  }

  // Corporate fallback
  if (lower.includes('corporate') || lower.includes('employer')) {
    return 'Corporate / Employer Scheme';
  }

  // Clean and Title-Case formatted fallback for any unrecognized provider
  return clean
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
