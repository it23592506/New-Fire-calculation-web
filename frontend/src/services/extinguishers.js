export const STATUS = {
  PASS: 'PASS',
  WARNING: 'WARNING',
  FAIL: 'FAIL',
};

export const TYPES = {
  WATER: 'Water',
  FOAM: 'Foam',
  ABC: 'ABC Powder',
  CO2: 'CO2',
  WET: 'Wet Chemical',
  CLEAN_AGENT: 'Clean Agent',
};

export const EXTINGUISHER_INFO = {
  [TYPES.WATER]: { usedFor: 'Wood, paper, cloth', fireClass: 'A', colorCode: 'Red' },
  [TYPES.FOAM]: { usedFor: 'Liquid fires + solids', fireClass: 'A, B', colorCode: 'Cream' },
  [TYPES.ABC]: { usedFor: 'General purpose', fireClass: 'A, B, C, Electrical', colorCode: 'Blue' },
  [TYPES.CO2]: { usedFor: 'Electrical equipment', fireClass: 'B, Electrical', colorCode: 'Black' },
  [TYPES.WET]: { usedFor: 'Cooking oils', fireClass: 'F', colorCode: 'Yellow' },
  [TYPES.CLEAN_AGENT]: { usedFor: 'Electronics, servers', fireClass: 'Electrical', colorCode: 'Green' },
};

export const CAPACITIES_BY_TYPE = {
  [TYPES.WATER]: ['6L', '9L'],
  [TYPES.FOAM]: ['6L', '9L'],
  [TYPES.CO2]: ['2kg', '5kg'],
  [TYPES.ABC]: ['1kg', '2kg', '4kg', '6kg', '9kg'],
  [TYPES.WET]: ['3L', '6L'],
  [TYPES.CLEAN_AGENT]: ['2kg', '4kg', '6kg'],
};

export const COVERAGE = {
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

export const HAZARD_RECOMMEND = {
  OFFICE: [TYPES.ABC, TYPES.CO2],
  SERVER_ROOM: [TYPES.CO2],
  ELECTRICAL_ROOM: [TYPES.CO2, TYPES.CLEAN_AGENT],
  WAREHOUSE: [TYPES.ABC],
  KITCHEN: [TYPES.WET],
  FUEL_STORAGE: [TYPES.FOAM],
};

export const TRAVEL_DISTANCE_LIMITS = {
  OFFICE: 23,
  WAREHOUSE: 23,
  KITCHEN: 15,
  FUEL_STORAGE: 15,
  SERVER_ROOM: 15,
  ELECTRICAL_ROOM: 15,
};

function keyFor(type, capacity) {
  const t = (type || '').toString().toLowerCase();
  if (t.includes('abc')) return `ABC:${capacity}`;
  if (t.includes('co')) return `CO2:${capacity}`;
  if (t.includes('foam')) return `Foam:${capacity}`;
  if (t.includes('water')) return `Water:${capacity}`;
  if (t.includes('wet')) return `Wet:${capacity}`;
  if (t.includes('clean')) return `CleanAgent:${capacity}`;
  return `${type}:${capacity}`;
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

export function getCoverage(type, capacity) {
  return COVERAGE[keyFor(type, capacity)] || null;
}

export function computeQuantity(area, type, capacity, hazard = '', travelDistance = null) {
  if (typeof area !== 'number' || !isFinite(area) || area <= 0) throw new Error('Area must be > 0');
  if (!type || !capacity) throw new Error('Type and capacity required');
  const normalizedType = normalizeType(type);
  if (!Object.values(TYPES).includes(normalizedType)) throw new Error('Unknown extinguisher type');
  const allowedCaps = CAPACITIES_BY_TYPE[normalizedType] || [];
  if (!allowedCaps.includes(capacity)) throw new Error(`Unsupported capacity ${capacity} for ${normalizedType}`);

  const coverage = getCoverage(normalizedType, capacity);
  if (!coverage) throw new Error('Unknown coverage');
  const raw = area / coverage;
  let N = Math.ceil(raw);
  if (N < 1) N = 1;
  let status = STATUS.PASS;
  const messages = [];
  const hazardKey = normalizeHazard(hazard);
  const recommendedTypes = HAZARD_RECOMMEND[hazardKey] || [TYPES.ABC];
  const travelDistanceLimit = TRAVEL_DISTANCE_LIMITS[hazardKey] || 23;
  const hazardLower = (hazard || '').toString().toLowerCase();
  const typeLower = (normalizedType || '').toString().toLowerCase();
  if (hazardLower.includes('electrical') && typeLower.includes('water')) {
    status = STATUS.FAIL;
    messages.push('Water not suitable for electrical rooms');
  }
  if (hazardLower.includes('kitchen') && typeLower.includes('co2')) {
    if (status !== STATUS.FAIL) status = STATUS.WARNING;
    messages.push('CO2 not recommended for kitchens');
  }
  if (!recommendedTypes.includes(normalizedType)) {
    if (status !== STATUS.FAIL) status = STATUS.WARNING;
    messages.push(`Recommended type for ${hazard || 'this hazard'}: ${recommendedTypes.join(' + ')}`);
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
  };
}
