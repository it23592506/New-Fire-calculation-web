const STATUS = {
  PASS: 'PASS',
  WARNING: 'WARNING',
  FAIL: 'FAIL',
};

function toNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  return n;
}

function assertPositive(value, fieldName) {
  const n = toNumber(value, fieldName);
  if (n <= 0) {
    throw new Error(`${fieldName} must be greater than 0`);
  }
  return n;
}

function assertNonNegative(value, fieldName) {
  const n = toNumber(value, fieldName);
  if (n < 0) {
    throw new Error(`${fieldName} must be >= 0`);
  }
  return n;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function response(module, data, warnings = [], recommendations = []) {
  let status = STATUS.PASS;
  if (warnings.length > 0) {
    status = STATUS.WARNING;
  }
  return { module, status, warnings, recommendations, data };
}

function fireLoad(payload) {
  const materials = Array.isArray(payload.materials) ? payload.materials : [];
  if (materials.length === 0) {
    throw new Error('materials is required and cannot be empty');
  }
  let Q = 0;
  for (const item of materials) {
    const mass = assertPositive(item.mass, 'mass');
    const calorific = assertPositive(item.calorific, 'calorific');
    Q += mass * calorific;
  }
  Q = round2(Q);
  const warnings = [];
  if (Q < 50) warnings.push('Extremely low fire load; verify input values.');
  return response('fire_load', { Q, unit: 'MJ' }, warnings);
}

function fireLoadDensityCalc(payload) {
  const Q = assertPositive(payload.Q, 'Q');
  const area = assertPositive(payload.area, 'area');
  const q = round2(Q / area);
  const warnings = [];
  if (q > 1200) warnings.push('High hazard fire load density (>1200 MJ/m2).');
  return response('fire_load_density', { q, unit: 'MJ/m2' }, warnings);
}

function heatReleaseRate(payload) {
  const mdot = assertPositive(payload.massLossRate, 'massLossRate');
  const deltaHc = assertPositive(payload.heatOfCombustion, 'heatOfCombustion');
  const hrr = round2(mdot * deltaHc);
  const warnings = [];
  if (deltaHc < 10000 || deltaHc > 50000) {
    warnings.push('Heat of combustion outside typical range (10000-50000 kJ/kg).');
  }
  return response('hrr', { hrr, unit: 'kW' }, warnings);
}

function floorArea(payload) {
  const length = assertPositive(payload.length, 'length');
  const width = assertPositive(payload.width, 'width');
  return response('floor_area', { area: round2(length * width), unit: 'm2' });
}

function volume(payload) {
  const length = assertPositive(payload.length, 'length');
  const width = assertPositive(payload.width, 'width');
  const height = assertPositive(payload.height, 'height');
  const V = round2(length * width * height);
  const warnings = [];
  if (height < 2) warnings.push('Ceiling height below 2 m.');
  if (V > 100000) warnings.push('Large enclosed volume; verify smoke control strategy.');
  return response('volume', { volume: V, unit: 'm3' }, warnings);
}

function ventilation(payload) {
  const airflow = assertPositive(payload.airflow, 'airflow');
  const roomVolume = assertPositive(payload.roomVolume, 'roomVolume');
  const ach = round2((airflow * 3600) / roomVolume);
  const warnings = [];
  if (ach > 100) warnings.push('ACH appears unrealistic (>100).');
  return response('ventilation', { ach, unit: '1/h' }, warnings);
}

function occupantLoad(payload) {
  const area = assertNonNegative(payload.area, 'area');
  const occupantFactor = assertPositive(payload.occupantFactor, 'occupantFactor');
  const occupants = Math.max(0, Math.ceil(area / occupantFactor));
  return response('occupant_load', { occupants, unit: 'persons' });
}

function exitWidth(payload) {
  const occupants = assertNonNegative(payload.occupants, 'occupants');
  const widthFactorMm = assertPositive(payload.widthFactorMm, 'widthFactorMm');
  const requiredWidthMm = round2(occupants * widthFactorMm);
  const requiredWidthM = round2(requiredWidthMm / 1000);
  const warnings = [];
  if (requiredWidthM < 1) warnings.push('Check local minimum exit width requirements.');
  return response('exit_width', { requiredWidthMm, requiredWidthM, unit: 'm' }, warnings);
}

function evacuation(payload) {
  const detection = assertNonNegative(payload.detection, 'detection');
  const alarm = assertNonNegative(payload.alarm, 'alarm');
  const preMovement = assertNonNegative(payload.preMovement, 'preMovement');
  const travel = assertNonNegative(payload.travel, 'travel');
  const aset = assertPositive(payload.aset, 'aset');
  const rset = round2(detection + alarm + preMovement + travel);
  const margin = round2(aset - rset);
  const marginPct = round2((margin / aset) * 100);
  let status = STATUS.PASS;
  const warnings = [];
  if (margin < 0) {
    status = STATUS.FAIL;
    warnings.push('RSET exceeds ASET.');
  } else if (marginPct < 20) {
    status = STATUS.WARNING;
    warnings.push('Safety margin is below 20%.');
  }
  return {
    module: 'rset_aset',
    status,
    warnings,
    recommendations: [
      'Target ASET >= 1.5 x RSET for robust design margin.',
      'Reduce pre-movement and travel time with drills and wayfinding.',
    ],
    data: { rset, aset, margin, marginPct, unit: 's' },
  };
}

function hydrant(payload) {
  const hydrantCount = assertPositive(payload.hydrantCount, 'hydrantCount');
  const flowPerHydrant = assertPositive(payload.flowPerHydrant, 'flowPerHydrant');
  const totalFlow = round2(hydrantCount * flowPerHydrant);
  const pressure = payload.pressure == null ? null : assertPositive(payload.pressure, 'pressure');
  const velocity = payload.velocity == null ? null : assertPositive(payload.velocity, 'velocity');
  const warnings = [];
  if (pressure != null && pressure < 3) warnings.push('Hydrant pressure appears low.');
  if (velocity != null && (velocity < 1 || velocity > 6)) warnings.push('Pipe velocity outside recommended range (1-6 m/s).');
  return response('hydrant', { totalFlow, unit: 'L/min' }, warnings);
}

function sprinkler(payload) {
  const density = assertPositive(payload.density, 'density');
  const area = assertPositive(payload.area, 'area');
  const hazardClass = String(payload.hazardClass || '').trim();
  if (!hazardClass) throw new Error('hazardClass is required');
  const demand = round2(density * area);
  return response('sprinkler', { demand, hazardClass, unit: 'L/min' });
}

function waterTank(payload) {
  const flow = assertPositive(payload.flow, 'flow');
  const durationMin = assertPositive(payload.durationMin, 'durationMin');
  const volumeL = round2(flow * durationMin);
  const volumeM3 = round2(volumeL / 1000);
  return response('water_tank', { volumeL, volumeM3, unit: 'm3' });
}

function foam(payload) {
  const solutionVolume = assertPositive(payload.solutionVolume, 'solutionVolume');
  const concentrationPct = assertPositive(payload.concentrationPct, 'concentrationPct');
  if (concentrationPct > 100) throw new Error('concentrationPct cannot exceed 100');
  const foamVolume = round2(solutionVolume * (concentrationPct / 100));
  const warnings = [];
  if (![1, 3, 6].includes(Number(concentrationPct))) {
    warnings.push('Typical concentrate values are 1%, 3%, or 6%.');
  }
  return response('foam_system', { foamVolume, unit: 'L' }, warnings);
}

function detector(payload, type) {
  const area = assertPositive(payload.area, 'area');
  const coverage = assertPositive(payload.coverage, 'coverage');
  const count = Math.max(1, Math.ceil(area / coverage));
  return response(type, { count, unit: 'detectors' });
}

function smokeExhaust(payload) {
  const area = assertPositive(payload.area, 'area');
  const airflowRate = assertPositive(payload.airflowRate, 'airflowRate');
  const flow = round2(area * airflowRate);
  return response('smoke_exhaust', { flow, unit: 'm3/h' });
}

function fireResistance(payload) {
  const buildingHeight = assertPositive(payload.buildingHeight, 'buildingHeight');
  const occupancy = String(payload.occupancy || '').trim();
  if (!occupancy) throw new Error('occupancy is required');
  let minRatingHours = 1;
  if (buildingHeight > 23 && buildingHeight <= 45) minRatingHours = 2;
  if (buildingHeight > 45) minRatingHours = 3;
  return response('fire_resistance', { minRatingHours, unit: 'h', occupancy });
}

function battery(payload) {
  const current = assertPositive(payload.current, 'current');
  const timeHours = assertPositive(payload.timeHours, 'timeHours');
  const derating = payload.derating == null ? 0.8 : assertPositive(payload.derating, 'derating');
  const ah = round2((current * timeHours) / derating);
  return response('battery_backup', { ah, unit: 'Ah' });
}

function cableDerating(payload) {
  const nominalCurrent = assertPositive(payload.nominalCurrent, 'nominalCurrent');
  const ca = assertPositive(payload.ca, 'ca');
  const cg = assertPositive(payload.cg, 'cg');
  const ci = assertPositive(payload.ci, 'ci');
  if (ca > 1 || cg > 1 || ci > 1) throw new Error('correction factors must be <= 1');
  const deratedCurrent = round2(nominalCurrent * ca * cg * ci);
  return response('cable_derating', { deratedCurrent, unit: 'A' });
}

function generator(payload) {
  const kW = assertPositive(payload.kW, 'kW');
  const pf = assertPositive(payload.powerFactor, 'powerFactor');
  if (pf > 1) throw new Error('powerFactor cannot exceed 1');
  const sparePct = payload.sparePct == null ? 20 : assertPositive(payload.sparePct, 'sparePct');
  const kVA = round2(kW / pf);
  const recommendedKVA = round2(kVA * (1 + sparePct / 100));
  return response('generator', { kVA, recommendedKVA, unit: 'kVA' }, [], ['Provide 20-25% spare capacity.']);
}

const calculators = {
  fire_load: fireLoad,
  fire_load_density: fireLoadDensityCalc,
  hrr: heatReleaseRate,
  floor_area: floorArea,
  volume,
  ventilation,
  occupant_load: occupantLoad,
  exit_width: exitWidth,
  evacuation,
  rset_aset: evacuation,
  hydrant,
  sprinkler,
  water_tank: waterTank,
  foam_system: foam,
  smoke_detector: (payload) => detector(payload, 'smoke_detector'),
  heat_detector: (payload) => detector(payload, 'heat_detector'),
  smoke_exhaust: smokeExhaust,
  fire_resistance: fireResistance,
  battery_backup: battery,
  cable_derating: cableDerating,
  generator,
};

function calculate(moduleName, payload = {}) {
  const moduleKey = String(moduleName || '').trim().toLowerCase();
  const calc = calculators[moduleKey];
  if (!calc) throw new Error(`Unsupported module: ${moduleName}`);
  return calc(payload);
}

module.exports = {
  STATUS,
  calculators,
  calculate,
};
