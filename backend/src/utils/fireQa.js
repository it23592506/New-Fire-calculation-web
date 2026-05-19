const STATUS = {
  PASS: 'PASS',
  WARNING: 'WARNING',
  FAIL: 'FAIL',
};

function isFinitePositive(n) {
  return Number.isFinite(n) && n > 0;
}

function isNonNegative(n) {
  return Number.isFinite(n) && n >= 0;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function computeFireLoad(materials = []) {
  if (!Array.isArray(materials) || materials.length === 0) {
    throw new Error('materials must be a non-empty array');
  }

  let Q = 0;
  const warnings = [];

  for (const m of materials) {
    if (m == null || typeof m.mass !== 'number' || typeof m.calorific !== 'number') {
      throw new Error('each material must have numeric mass and calorific');
    }
    if (!isFinitePositive(m.mass) || !isFinitePositive(m.calorific)) {
      throw new Error('mass and calorific must be > 0');
    }
    Q += m.mass * m.calorific;
  }

  Q = round2(Q);

  // warnings
  if (Q < 50) warnings.push('Extremely low fire load — confirm input');

  return { Q, warnings };
}

function computeFireLoadDensity(Q, area) {
  if (!isFinitePositive(Q)) throw new Error('Q must be > 0');
  if (!isFinitePositive(area)) throw new Error('area must be > 0');
  const q = round2(Q / area);
  const warnings = [];
  if (q > 1200) warnings.push('High hazard: fire load density > 1200 MJ/m²');
  return { q, warnings };
}

function computeHRR(mdot, deltaHc) {
  if (!isFinitePositive(mdot)) throw new Error('mass loss rate must be > 0 (kg/s)');
  if (!isFinitePositive(deltaHc)) throw new Error('heat of combustion must be > 0 (kJ/kg)');
  // HRR in kW (kJ/s == kW)
  const HRR = round2(mdot * deltaHc);
  return { HRR };
}

function computeArea(L, W) {
  if (!isFinitePositive(L) || !isFinitePositive(W)) throw new Error('L and W must be > 0 (m)');
  return round2(L * W);
}

function computeVolume(L, W, H) {
  if (!isFinitePositive(L) || !isFinitePositive(W) || !isFinitePositive(H)) throw new Error('L, W, H must be > 0 (m)');
  const V = round2(L * W * H);
  const warnings = [];
  if (H < 2) warnings.push('Low ceiling height (< 2 m)');
  if (V > 100000) warnings.push('Very large volume (>100000 m³)');
  return { V, warnings };
}

function computeOccupantLoad(area, occupantFactor) {
  if (!isFinitePositive(occupantFactor)) throw new Error('occupantFactor must be > 0');
  if (!isFinitePositive(area) && area !== 0) throw new Error('area must be >= 0');
  const raw = area / occupantFactor;
  const occupants = Math.ceil(raw || 0);
  return { occupants };
}

function computeExtinguisherCount(area, coveragePerExt) {
  if (!isFinitePositive(coveragePerExt)) throw new Error('coveragePerExt must be > 0');
  if (!isFinitePositive(area) && area !== 0) throw new Error('area must be >= 0');
  const raw = area / coveragePerExt;
  const N = Math.max(1, Math.ceil(raw || 0));
  return { N };
}

function computeBatteryAH(I, tHours, derate = 0.8) {
  if (!isFinitePositive(I) || !isFinitePositive(tHours)) throw new Error('I and t must be > 0');
  const AH = round2(derate * I * tHours);
  return { AH };
}

module.exports = {
  STATUS,
  isFinitePositive,
  isNonNegative,
  round2,
  computeFireLoad,
  computeFireLoadDensity,
  computeHRR,
  computeArea,
  computeVolume,
  computeOccupantLoad,
  computeExtinguisherCount,
  computeBatteryAH,
};
