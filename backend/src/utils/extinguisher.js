const STATUS = {
  PASS: 'PASS',
  WARNING: 'WARNING',
  FAIL: 'FAIL',
};

const TYPES = {
  WATER: 'Water',
  FOAM: 'Foam',
  ABC: 'ABC Powder',
  CO2: 'CO2',
  WET: 'Wet Chemical',
  CLEAN_AGENT: 'Clean Agent',
};

const EXTINGUISHER_INFO = {
  [TYPES.WATER]: { usedFor: 'Wood, paper, cloth', fireClass: 'A', colorCode: 'Red' },
  [TYPES.FOAM]: { usedFor: 'Liquid fires + solids', fireClass: 'A, B', colorCode: 'Cream' },
  [TYPES.ABC]: { usedFor: 'General purpose', fireClass: 'A, B, C, Electrical', colorCode: 'Blue' },
  [TYPES.CO2]: { usedFor: 'Electrical equipment', fireClass: 'B, Electrical', colorCode: 'Black' },
  [TYPES.WET]: { usedFor: 'Cooking oils', fireClass: 'F', colorCode: 'Yellow' },
  [TYPES.CLEAN_AGENT]: { usedFor: 'Electronics, servers', fireClass: 'Electrical', colorCode: 'Green' },
};

const CAPACITIES_BY_TYPE = {
  [TYPES.WATER]: ['6L', '9L'],
  [TYPES.FOAM]: ['6L', '9L'],
  [TYPES.CO2]: ['2kg', '5kg'],
  [TYPES.ABC]: ['1kg', '2kg', '4kg', '6kg', '9kg'],
  [TYPES.WET]: ['3L', '6L'],
  [TYPES.CLEAN_AGENT]: ['2kg', '4kg', '6kg'],
};

// Coverage values (m2) by type+capacity (typical values used by calculator)
const COVERAGE = {
  'ABC:1kg': 25,
  'ABC:2kg': 50,
  'ABC:4kg': 60,
  'ABC:6kg': 150,
  'ABC:9kg': 200,
  'CO2:2kg': 10,
  'CO2:5kg': 25,
  'Foam:6L': 100,
  'Foam:9L': 120,
  'Water:6L': 100,
  'Water:9L': 200,
  'Wet:3L': 50,
  'Wet:6L': 100,
  'CleanAgent:2kg': 40,
  'CleanAgent:4kg': 80,
  'CleanAgent:6kg': 120,
};

const HAZARD_RECOMMEND = {
  OFFICE: [TYPES.ABC, TYPES.CO2],
  SERVER_ROOM: [TYPES.CO2],
  ELECTRICAL_ROOM: [TYPES.CO2, TYPES.CLEAN_AGENT],
  WAREHOUSE: [TYPES.ABC],
  KITCHEN: [TYPES.WET],
  FUEL_STORAGE: [TYPES.FOAM],
};

const DEFAULT_TRAVEL_DISTANCE_LIMIT = 23;
const TRAVEL_DISTANCE_LIMITS = {
  OFFICE: 23,
  WAREHOUSE: 23,
  KITCHEN: 15,
  FUEL_STORAGE: 15,
  SERVER_ROOM: 15,
  ELECTRICAL_ROOM: 15,
};

const ENTITY_REFERENCES = [
  'ABC Dry Powder Fire Extinguisher',
  'CO2 Fire Extinguisher',
  'Foam AFFF Fire Extinguisher',
];

function keyFor(type, capacity) {
  if (!type || !capacity) return null;
  // normalize
  const t = (type || '').toString().toLowerCase();
  if (t.includes('abc')) return `ABC:${capacity}`;
  if (t.includes('co')) return `CO2:${capacity}`;
  if (t.includes('foam')) return `Foam:${capacity}`;
  if (t.includes('water')) return `Water:${capacity}`;
  if (t.includes('wet')) return `Wet:${capacity}`;
  if (t.includes('clean')) return `CleanAgent:${capacity}`;
  return `${type}:${capacity}`;
}

function getCoverage(type, capacity) {
  const k = keyFor(type, capacity);
  return COVERAGE[k] || null;
}

function normalizeType(type) {
  const t = (type || '').toString().toLowerCase();
  if (t.includes('abc')) return TYPES.ABC;
  if (t.includes('co')) return TYPES.CO2;
  if (t.includes('foam')) return TYPES.FOAM;
  if (t.includes('water')) return TYPES.WATER;
  if (t.includes('wet')) return TYPES.WET;
  if (t.includes('clean')) return TYPES.CLEAN_AGENT;
  return type;
}

function normalizeHazard(hazard) {
  return (hazard || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
}

function validateInputs({ area, type, capacity, hazard }) {
  if (typeof area !== 'number' || !isFinite(area) || area <= 0) {
    throw new Error('Area must be a positive number (m²)');
  }
  if (!type) throw new Error('Extinguisher type required');
  if (!capacity) throw new Error('Extinguisher capacity required');

  const normalizedType = normalizeType(type);
  if (!Object.values(TYPES).includes(normalizedType)) {
    throw new Error('Unknown extinguisher type');
  }

  const allowedCaps = CAPACITIES_BY_TYPE[normalizedType] || [];
  if (!allowedCaps.includes(capacity)) {
    throw new Error(`Unsupported capacity ${capacity} for ${normalizedType}`);
  }
}

function computeQuantity({ area, type, capacity, hazard = '', travelDistance = null }) {
  validateInputs({ area, type, capacity, hazard });
  const normalizedType = normalizeType(type);
  const hazardKey = normalizeHazard(hazard);
  const coverage = getCoverage(normalizedType, capacity);
  if (!coverage || coverage <= 0) throw new Error('Unknown coverage for given type/capacity');

  // N = A / C
  const raw = area / coverage;
  let N = Math.ceil(raw);
  if (N < 1) N = 1;

  // QA status logic
  let status = STATUS.PASS;
  const messages = [];

  const hazardLower = (hazard || '').toString().toLowerCase();
  const typeLower = normalizedType.toLowerCase();
  const recommendedTypes = HAZARD_RECOMMEND[hazardKey] || [TYPES.ABC];
  const travelDistanceLimit = TRAVEL_DISTANCE_LIMITS[hazardKey] || DEFAULT_TRAVEL_DISTANCE_LIMIT;

  // Electrical room + Water => FAIL
  if (hazardLower.includes('electrical') && typeLower.includes('water')) {
    status = STATUS.FAIL;
    messages.push('Water extinguishers are not suitable for electrical rooms');
  }

  // Kitchen + CO2 => WARNING (CO2 less recommended for cooking oil fires)
  if (hazardLower.includes('kitchen') && typeLower.includes('co2')) {
    if (status !== STATUS.FAIL) status = STATUS.WARNING;
    messages.push('CO2 is not recommended as sole extinguisher in kitchens');
  }

  if (!recommendedTypes.includes(normalizedType)) {
    if (status !== STATUS.FAIL) status = STATUS.WARNING;
    messages.push(`Recommended type for ${hazard || 'this hazard'}: ${recommendedTypes.join(' + ')}`);
  }

  // Example: very large area -> Warning
  if (area > 1000) {
    if (status === STATUS.PASS) status = STATUS.WARNING;
    messages.push('Large area — consider distributed placement and multiple types');
  }

  if (Number.isFinite(travelDistance) && travelDistance > 0) {
    if (travelDistance > travelDistanceLimit * 1.5) {
      status = STATUS.FAIL;
      messages.push(`Travel distance (${travelDistance} m) exceeds limit (${travelDistanceLimit} m) by >50%`);
    } else if (travelDistance > travelDistanceLimit) {
      if (status !== STATUS.FAIL) status = STATUS.WARNING;
      messages.push(`Travel distance (${travelDistance} m) exceeds recommended limit (${travelDistanceLimit} m)`);
    }
  }

  return {
    area,
    type: normalizedType,
    capacity,
    coverage,
    quantity: N,
    status,
    messages,
    travelDistanceLimit,
    recommendation: {
      hazard: hazard || null,
      recommendedTypes,
    },
    extinguisherInfo: EXTINGUISHER_INFO[normalizedType],
    entityReferences: ENTITY_REFERENCES,
  };
}

function recommendByHazard(hazard, area) {
  const h = normalizeHazard(hazard);
  const recommended = HAZARD_RECOMMEND[h] || [TYPES.ABC];
  // choose first recommended and a sensible capacity
  const type = recommended[0];
  const defaultCapacity = type === TYPES.ABC
    ? '6kg'
    : type === TYPES.CO2
      ? '5kg'
      : type === TYPES.FOAM
        ? '6L'
        : type === TYPES.WET
          ? '6L'
          : type === TYPES.CLEAN_AGENT
            ? '4kg'
            : '6L';
  return computeQuantity({ area, type, capacity: defaultCapacity, hazard });
}

module.exports = {
  STATUS,
  TYPES,
  EXTINGUISHER_INFO,
  CAPACITIES_BY_TYPE,
  COVERAGE,
  computeQuantity,
  recommendByHazard,
  getCoverage,
  TRAVEL_DISTANCE_LIMITS,
  ENTITY_REFERENCES,
};
