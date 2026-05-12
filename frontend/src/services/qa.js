export const STATUS = {
  PASS: 'PASS',
  WARNING: 'WARNING',
  FAIL: 'FAIL',
};

export function isFinitePositive(n) {
  return Number.isFinite(n) && n > 0;
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function computeFireLoad(materials = []) {
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
  if (Q < 50) warnings.push('Extremely low fire load — confirm input');
  return { Q, warnings };
}

export function computeFireLoadDensity(Q, area) {
  if (!isFinitePositive(Q)) throw new Error('Q must be > 0');
  if (!isFinitePositive(area)) throw new Error('area must be > 0');
  const q = round2(Q / area);
  const warnings = [];
  if (q > 1200) warnings.push('High hazard: fire load density > 1200 MJ/m²');
  return { q, warnings };
}

export function computeExtinguisherCount(area, coveragePerExt) {
  if (!isFinitePositive(coveragePerExt)) throw new Error('coveragePerExt must be > 0');
  if (!isFinitePositive(area) && area !== 0) throw new Error('area must be >= 0');
  const raw = area / coveragePerExt;
  const N = Math.max(1, Math.ceil(raw || 0));
  return { N };
}

// Add more UI-side helpers as needed to mirror backend validation
