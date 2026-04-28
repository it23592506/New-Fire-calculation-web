const asNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return parsed;
};

const asNonNegativeNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
  return parsed;
};

const asOptionalNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const calculateRiskCategory = (fireLoad) => {
  if (fireLoad < 300) return "Low";
  if (fireLoad < 900) return "Medium";
  if (fireLoad < 1800) return "High";
  return "Critical";
};

const calculateFireMetrics = ({ area, weight, cv }) => {
  const safeArea = asNumber(area, "Area");
  const safeWeight = asNumber(weight, "Weight");
  const safeCv = asNumber(cv, "CV");

  const fireLoad = Number(((safeWeight * safeCv) / safeArea).toFixed(2));
  const extinguishers = Math.max(1, Math.ceil(safeArea / 100));
  const hydrantFlowLpm = Math.ceil((safeArea * 4.5) / 10) * 10;
  const detectorCount = Math.max(2, Math.ceil(safeArea / 75));
  const riskCategory = calculateRiskCategory(fireLoad);

  return {
    area: safeArea,
    weight: safeWeight,
    cv: safeCv,
    fireLoad,
    extinguishers,
    hydrantFlowLpm,
    detectorCount,
    riskCategory
  };
};

const calculateHydrantMetrics = ({ area, stories, occupancy }) => {
  const safeArea = asNumber(area, "Area");
  const safeStories = asNumber(stories, "Stories");
  const safeOccupancy = String(occupancy || "commercial").toLowerCase();

  const baseFlow = safeOccupancy === "industrial" ? 5.5 : safeOccupancy === "storage" ? 6.5 : 4.5;
  const maxFlow = safeOccupancy === "industrial" ? 3800 : 2500;
  const calculatedFlow = Math.ceil((safeArea * baseFlow) / 10) * 10;
  const flowRate = Math.min(maxFlow, calculatedFlow);
  const staticHead = 10 + safeStories * 3.5;
  const head = staticHead * 1.2;
  const pumpPower = ((flowRate / 60) * head * 9.81) / (1000 * 0.7);
  const duration = safeOccupancy === "storage" ? 4 : safeOccupancy === "industrial" ? 3 : 2;
  const waterDemand = flowRate * 60 * duration;

  return {
    flowRate,
    head: Number(head.toFixed(1)),
    pumpPower: Number(pumpPower.toFixed(2)),
    waterDemand: Number((waterDemand / 1000).toFixed(1))
  };
};

const calculateAreaMetrics = ({ length, width, height, openings, openingHeight }) => {
  const safeLength = asNumber(length, "Length");
  const safeWidth = asNumber(width, "Width");
  const safeHeight = asNumber(height, "Height");
  const safeOpenings = asOptionalNumber(openings);
  const safeOpeningHeight = asOptionalNumber(openingHeight);

  const floorArea = safeLength * safeWidth;
  const volume = floorArea * safeHeight;
  const ventFactor =
    safeOpenings > 0 && safeOpeningHeight > 0
      ? Number((safeOpenings * Math.sqrt(safeOpeningHeight)).toFixed(2))
      : 0;
  const airChanges =
    safeOpenings > 0 && safeOpeningHeight > 0
      ? Number(((safeOpenings * Math.sqrt(safeOpeningHeight) * 3600) / volume).toFixed(1))
      : 0;
  const heightCoefficient = Number((floorArea / safeHeight).toFixed(2));

  const riskCategory = airChanges === 0 ? "High" : airChanges >= 10 ? "Low" : airChanges >= 5 ? "Medium" : "High";

  return {
    area: Number(floorArea.toFixed(2)),
    weight: Number(volume.toFixed(2)),
    cv: ventFactor,
    fireLoad: heightCoefficient,
    extinguishers: Math.max(1, Math.ceil(floorArea / 120)),
    hydrantFlowLpm: Math.ceil((floorArea * 4.5) / 10) * 10,
    detectorCount: Math.max(2, Math.ceil(floorArea / 90)),
    riskCategory,
    floorArea: Number(floorArea.toFixed(2)),
    volume: Number(volume.toFixed(2)),
    ventFactor: ventFactor || "N/A",
    airChanges: airChanges || "N/A"
  };
};

const calculateExtinguisherMetrics = ({ area, hazard, feType }) => {
  const safeArea = asNumber(area, "Area");
  const normalizedHazard = String(hazard || "low").toLowerCase();
  const coverageMap = { low: 280, moderate: 140, high: 90 };
  const coverage = coverageMap[normalizedHazard] || coverageMap.low;
  const count = Math.max(1, Math.ceil(safeArea / coverage));
  const travelDistance = normalizedHazard === "high" ? 9 : normalizedHazard === "moderate" ? 15 : 23;
  const riskCategory = normalizedHazard === "high" ? "High" : normalizedHazard === "moderate" ? "Medium" : "Low";
  const baseCv = normalizedHazard === "high" ? 4500 : normalizedHazard === "moderate" ? 3500 : 2500;

  return {
    area: Number(safeArea.toFixed(2)),
    weight: count * 25,
    cv: baseCv,
    fireLoad: coverage,
    extinguishers: count,
    hydrantFlowLpm: Math.ceil((safeArea * (normalizedHazard === "high" ? 5.5 : 4.5)) / 10) * 10,
    detectorCount: Math.max(2, Math.ceil(safeArea / 80)),
    riskCategory,
    coverage,
    travelDistance,
    feType: feType || "water",
    unit: new Set(["water", "foam", "wet_chemical"]).has(String(feType || "water")) ? "L" : "kg"
  };
};

const calculateDetectionMetrics = ({ area, height, detectorType }) => {
  const safeArea = asNumber(area, "Area");
  const safeHeight = asOptionalNumber(height);
  const normalizedType = String(detectorType || "smoke").toLowerCase();

  const spacingMap = {
    smoke: { coverage: 75, spacing: 9 },
    heat: { coverage: 37, spacing: 6.3 },
    beam: { coverage: 1000, spacing: 30 }
  };

  let config = spacingMap[normalizedType] || spacingMap.smoke;
  if (normalizedType === "smoke" && safeHeight > 4) {
    config = { coverage: 60, spacing: 8 };
  }

  const count = Math.max(2, Math.ceil(safeArea / config.coverage));
  const riskCategory = normalizedType === "heat" ? "High" : normalizedType === "beam" ? "Low" : "Medium";

  return {
    area: Number(safeArea.toFixed(2)),
    weight: count * 10,
    cv: config.coverage,
    fireLoad: config.spacing,
    extinguishers: Math.max(1, Math.ceil(safeArea / 150)),
    hydrantFlowLpm: Math.ceil((safeArea * 4.2) / 10) * 10,
    detectorCount: count,
    riskCategory,
    coverage: config.coverage,
    spacing: config.spacing,
    type: normalizedType
  };
};

const calculateSprinklerDemandMetrics = ({
  hazardClass,
  density,
  designArea,
  hoseStreamLpm,
  safetyFactor,
  durationMin,
  sprinklerCoverageM2
}) => {
  const normalizedHazard = String(hazardClass || "ordinary").toLowerCase();
  const hazardDefaults = {
    light: { density: 4.1, designArea: 140, hoseStreamLpm: 250, durationMin: 60, risk: "Low" },
    ordinary: { density: 6.1, designArea: 140, hoseStreamLpm: 500, durationMin: 90, risk: "Medium" },
    extra: { density: 10.2, designArea: 230, hoseStreamLpm: 950, durationMin: 120, risk: "High" }
  };
  const defaults = hazardDefaults[normalizedHazard] || hazardDefaults.ordinary;
  const safeDensity = asNumber(density ?? defaults.density, "Density");
  const safeDesignArea = asNumber(designArea ?? defaults.designArea, "Design area");
  const safeHoseStream = asNonNegativeNumber(
    asOptionalNumber(hoseStreamLpm) || defaults.hoseStreamLpm,
    "Hose stream allowance"
  );
  const safeSafetyFactor = asNumber(safetyFactor ?? 1.15, "Safety factor");
  const safeDurationMin = asNumber(durationMin ?? defaults.durationMin, "Duration");
  const safeSprinklerCoverage = asNumber(sprinklerCoverageM2 ?? 12, "Sprinkler coverage");

  const sprinklerDemandLpm = safeDensity * safeDesignArea;
  const totalDemandLpm = (sprinklerDemandLpm + safeHoseStream) * safeSafetyFactor;
  const demandM3Hr = totalDemandLpm * 0.06;
  const demandGpm = totalDemandLpm / 3.785;
  const operatingSprinklers = Math.max(1, Math.ceil(safeDesignArea / safeSprinklerCoverage));
  const flowPerSprinklerLpm = sprinklerDemandLpm / operatingSprinklers;
  const waterVolumeM3 = (totalDemandLpm * safeDurationMin) / 1000;

  return {
    area: Number(safeDesignArea.toFixed(2)),
    weight: Number(demandM3Hr.toFixed(1)),
    cv: Number(safeDensity.toFixed(2)),
    fireLoad: Number(totalDemandLpm.toFixed(1)),
    extinguishers: 0,
    hydrantFlowLpm: Number(totalDemandLpm.toFixed(1)),
    detectorCount: 0,
    riskCategory: defaults.risk,
    hazardClass: normalizedHazard,
    density: Number(safeDensity.toFixed(2)),
    designArea: Number(safeDesignArea.toFixed(2)),
    sprinklerDemandLpm: Number(sprinklerDemandLpm.toFixed(1)),
    hoseStreamLpm: Number(safeHoseStream.toFixed(1)),
    safetyFactor: Number(safeSafetyFactor.toFixed(2)),
    durationMin: Number(safeDurationMin.toFixed(1)),
    operatingSprinklers,
    flowPerSprinklerLpm: Number(flowPerSprinklerLpm.toFixed(1)),
    demandLpm: Number(totalDemandLpm.toFixed(1)),
    demandM3Hr: Number(demandM3Hr.toFixed(1)),
    demandGpm: Number(demandGpm.toFixed(1)),
    waterVolumeM3: Number(waterVolumeM3.toFixed(1))
  };
};

const calculateWaterTankMetrics = ({
  sprinklerFlowLpm,
  hydrantFlowLpm,
  durationHours,
  sprinklerDurationMin,
  hydrantDurationMin,
  reservePercent,
  deadStoragePercent,
  demandMode
}) => {
  const safeSprinkler = asNonNegativeNumber(sprinklerFlowLpm ?? 0, "Sprinkler flow");
  const safeHydrant = asNonNegativeNumber(hydrantFlowLpm ?? 0, "Hydrant flow");
  const safeDuration = asOptionalNumber(durationHours);
  const defaultSprinklerDuration = safeDuration > 0 ? safeDuration * 60 : 90;
  const defaultHydrantDuration = safeDuration > 0 ? safeDuration * 60 : 120;
  const safeSprinklerDurationMin = asNumber(sprinklerDurationMin ?? defaultSprinklerDuration, "Sprinkler duration");
  const safeHydrantDurationMin = asNumber(hydrantDurationMin ?? defaultHydrantDuration, "Hydrant duration");
  const safeReservePercent = asNonNegativeNumber(reservePercent ?? 15, "Reserve percent");
  const safeDeadStoragePercent = asNonNegativeNumber(deadStoragePercent ?? 10, "Dead storage percent");
  const safeDemandMode = String(demandMode || "simultaneous").toLowerCase();

  if (safeSprinkler + safeHydrant === 0) {
    throw new Error("At least one flow demand must be provided");
  }

  if (safeDeadStoragePercent >= 100) {
    throw new Error("Dead storage percent must be less than 100");
  }

  if (!new Set(["simultaneous", "largest"]).has(safeDemandMode)) {
    throw new Error("Demand mode must be simultaneous or largest");
  }

  const sprinklerVolumeL = safeSprinkler * safeSprinklerDurationMin;
  const hydrantVolumeL = safeHydrant * safeHydrantDurationMin;
  const netVolumeL = safeDemandMode === "largest"
    ? Math.max(sprinklerVolumeL, hydrantVolumeL)
    : sprinklerVolumeL + hydrantVolumeL;
  const reserveVolumeL = netVolumeL * (safeReservePercent / 100);
  const grossBeforeDeadStorageL = netVolumeL + reserveVolumeL;
  const grossVolumeL = grossBeforeDeadStorageL / (1 - safeDeadStoragePercent / 100);
  const totalFlow = safeSprinkler + safeHydrant;
  const volumeM3 = grossVolumeL / 1000;
  const netVolumeM3 = netVolumeL / 1000;
  const recommendedTankM3 = Math.ceil(volumeM3 / 5) * 5;

  let riskCategory = "Low";
  if (recommendedTankM3 >= 500) {
    riskCategory = "Critical";
  } else if (recommendedTankM3 >= 250) {
    riskCategory = "High";
  } else if (recommendedTankM3 >= 100) {
    riskCategory = "Medium";
  }

  return {
    area: Number(safeSprinkler.toFixed(1)),
    weight: Number(safeHydrant.toFixed(1)),
    cv: Number((safeSprinklerDurationMin / 60).toFixed(2)),
    fireLoad: Number(recommendedTankM3.toFixed(1)),
    extinguishers: 0,
    hydrantFlowLpm: Number(totalFlow.toFixed(1)),
    detectorCount: 0,
    riskCategory,
    sprinklerFlowLpm: Number(safeSprinkler.toFixed(1)),
    hydrantDemandLpm: Number(safeHydrant.toFixed(1)),
    durationHours: Number(((Math.max(safeSprinklerDurationMin, safeHydrantDurationMin)) / 60).toFixed(2)),
    sprinklerDurationMin: Number(safeSprinklerDurationMin.toFixed(1)),
    hydrantDurationMin: Number(safeHydrantDurationMin.toFixed(1)),
    demandMode: safeDemandMode,
    reservePercent: Number(safeReservePercent.toFixed(1)),
    deadStoragePercent: Number(safeDeadStoragePercent.toFixed(1)),
    totalFlowLpm: Number(totalFlow.toFixed(1)),
    netVolumeM3: Number(netVolumeM3.toFixed(1)),
    volumeM3: Number(volumeM3.toFixed(1)),
    recommendedTankM3: Number(recommendedTankM3.toFixed(1))
  };
};

const calculateEvacuationMetrics = ({
  detectionTime,
  alarmTime,
  preMovementTime,
  travelDistance,
  travelSpeed,
  asetTime,
  occupantCount,
  exitCount,
  exitWidthM,
  specificFlowPerMps,
  safetyFactorPercent
}) => {
  const safeDetection = asNonNegativeNumber(detectionTime ?? 0, "Detection time");
  const safeAlarm = asNonNegativeNumber(alarmTime ?? 0, "Alarm time");
  const safePreMovement = asNonNegativeNumber(preMovementTime ?? 0, "Pre-movement time");
  const safeDistance = asNumber(travelDistance, "Travel distance");
  const safeSpeed = asNumber(travelSpeed, "Travel speed");
  const safeAset = asNumber(asetTime, "ASET");
  const occupants = asNonNegativeNumber(occupantCount ?? 0, "Occupant count");
  const exits = asNumber(exitCount ?? 2, "Exit count");
  const exitWidth = asNumber(exitWidthM ?? 1.2, "Exit width");
  const specificFlow = asNumber(specificFlowPerMps ?? 1.3, "Specific flow");
  const safeSafetyFactorPercent = asNonNegativeNumber(safetyFactorPercent ?? 10, "Safety factor");

  const travelTime = (safeDistance / safeSpeed) / 60;
  const exitCapacityPps = exits * exitWidth * specificFlow;
  const queuingTime = occupants > 0 ? (occupants / exitCapacityPps) / 60 : 0;
  const rset = safeDetection + safeAlarm + safePreMovement + travelTime + queuingTime;
  const rsetWithSafety = rset * (1 + safeSafetyFactorPercent / 100);
  const margin = safeAset - rsetWithSafety;

  let riskCategory = "Low";
  if (margin < -5) {
    riskCategory = "Critical";
  } else if (margin < 0) {
    riskCategory = "High";
  } else if (margin < 5) {
    riskCategory = "Medium";
  }

  return {
    area: Number(safeDetection.toFixed(2)),
    weight: Number(safeAlarm.toFixed(2)),
    cv: Number(safePreMovement.toFixed(2)),
    fireLoad: Number(travelTime.toFixed(2)),
    extinguishers: 0,
    hydrantFlowLpm: Number(rsetWithSafety.toFixed(2)),
    detectorCount: Number(safeAset.toFixed(2)),
    riskCategory,
    detectionTime: Number(safeDetection.toFixed(2)),
    alarmTime: Number(safeAlarm.toFixed(2)),
    preMovementTime: Number(safePreMovement.toFixed(2)),
    travelDistance: Number(safeDistance.toFixed(2)),
    travelSpeed: Number(safeSpeed.toFixed(2)),
    occupantCount: Number(occupants.toFixed(0)),
    exitCount: Number(exits.toFixed(0)),
    exitWidthM: Number(exitWidth.toFixed(2)),
    specificFlowPerMps: Number(specificFlow.toFixed(2)),
    exitCapacityPps: Number(exitCapacityPps.toFixed(2)),
    queuingTime: Number(queuingTime.toFixed(2)),
    safetyFactorPercent: Number(safeSafetyFactorPercent.toFixed(1)),
    travelTime: Number(travelTime.toFixed(2)),
    rsetMinutes: Number(rset.toFixed(2)),
    rsetWithSafetyMinutes: Number(rsetWithSafety.toFixed(2)),
    asetMinutes: Number(safeAset.toFixed(2)),
    marginMinutes: Number(margin.toFixed(2)),
    status: margin >= 0 ? "Within ASET" : "Exceeds ASET"
  };
};

const calculateOccupantLoadMetrics = ({ occupancyType, floorArea, occupantCount, exitCount, stairWidth, doorWidth }) => {
  const occupancyDefaults = { residential: { occupantLoad: 10 }, office: { occupantLoad: 7 }, retail: { occupantLoad: 3 }, warehouse: { occupantLoad: 20 }, assembly: { occupantLoad: 0.3 } };
  const defaults = occupancyDefaults[occupancyType] || occupancyDefaults.office;
  const safeArea = asNumber(floorArea, "Floor area");
  const calcOccupants = occupantCount > 0 ? Number(occupantCount) : Math.ceil(safeArea / defaults.occupantLoad);
  const safeExits = asNumber(exitCount ?? 2, "Exit count");
  const safeStairWidth = asNumber(stairWidth ?? 1.5, "Stair width");
  const safeDoorWidth = asNumber(doorWidth ?? 1.2, "Door width");
  const requiredExits = calcOccupants > 250 ? Math.ceil(calcOccupants / 250) : calcOccupants > 100 ? 2 : 1;
  const occupantsPerExit = Math.ceil(calcOccupants / safeExits);
  const minExitWidthM = occupantsPerExit * 0.005;
  const actualExitWidth = Math.max(minExitWidthM, safeDoorWidth);
  return {
    area: Number(safeArea.toFixed(2)),
    weight: Number(calcOccupants.toFixed(0)),
    cv: Number(actualExitWidth.toFixed(2)),
    fireLoad: Number(requiredExits.toFixed(0)),
    extinguishers: 0,
    hydrantFlowLpm: 0,
    detectorCount: 0,
    riskCategory: requiredExits > safeExits ? "High" : "Medium",
    occupancyType,
    occupantCount: Number(calcOccupants.toFixed(0)),
    exitCount: Number(safeExits.toFixed(0)),
    requiredExits: Number(requiredExits.toFixed(0)),
    minExitWidthM: Number(minExitWidthM.toFixed(2)),
    actualExitWidth: Number(actualExitWidth.toFixed(2)),
    stairCapacity: Number(Math.floor(safeStairWidth / 0.55).toFixed(0))
  };
};

const calculateSmokeExhaustMetrics = ({ compartmentArea, ceilingHeight, fireScenario, smokeProductionRate, exchangesPerHour, safetyFactor }) => {
  const fireScenarioFactors = { flashover: 1.2, smoldering: 0.8, active: 1.0 };
  const safeArea = asNumber(compartmentArea, "Compartment area");
  const safeHeight = asNumber(ceilingHeight, "Ceiling height");
  const safeProduction = asNumber(smokeProductionRate ?? 1.5, "Smoke production rate");
  const safeExchanges = asNumber(exchangesPerHour ?? 6, "Exchanges per hour");
  const safeSafety = asNumber(safetyFactor ?? 1.25, "Safety factor");
  const volume = safeArea * safeHeight;
  const scenarioFactor = fireScenarioFactors[fireScenario] || 1.0;
  const productionAdjusted = safeProduction * scenarioFactor;
  const demandM3H = productionAdjusted * safeArea;
  const exchangeDemand = volume * safeExchanges;
  const requiredAirflow = Math.max(demandM3H, exchangeDemand);
  const withSafety = requiredAirflow * safeSafety;
  return {
    area: Number(safeArea.toFixed(1)),
    volume: Number(volume.toFixed(1)),
    fireScenario,
    requiredAirflowM3H: Number(requiredAirflow.toFixed(1)),
    withSafetyM3H: Number(withSafety.toFixed(1)),
    exhaustFanCFM: Number((withSafety / 1.699).toFixed(1)),
    exhaustFanKW: Number(((withSafety * 0.1) / 3600).toFixed(2)),
    riskCategory: withSafety > 5000 ? "High" : "Medium"
  };
};

const calculateFireRatingMetrics = ({ buildingUse, buildingHeight, elementType }) => {
  const ratingRules = {
    residential: { 0: "1 hr", 1: "1 hr", 2: "1 hr", 3: "1 hr", 4: "2 hr" },
    office: { 0: "1 hr", 1: "1 hr", 2: "2 hr", 3: "2 hr", 4: "3 hr" },
    industrial: { 0: "1 hr", 1: "2 hr", 2: "2 hr", 3: "3 hr", 4: "4 hr" },
    assembly: { 0: "1 hr", 1: "2 hr", 2: "2 hr", 3: "3 hr", 4: "4 hr" }
  };
  const safeHeight = asNumber(buildingHeight, "Building height");
  const heightStories = Math.ceil(safeHeight / 3.5);
  const rules = ratingRules[buildingUse] || ratingRules.office;
  const heightCategory = Math.min(Math.max(0, Math.floor((heightStories - 1) / 1)), 4);
  const rating = rules[heightCategory] || "1 hr";
  const elementFactors = { wall: 1.0, door: 1.25, slab: 0.9, beam: 1.1 };
  const elementFactor = elementFactors[elementType] || 1.0;
  const adjustedHours = parseFloat(rating) * elementFactor;
  const finalRating = adjustedHours > 3 ? "4 hr" : adjustedHours > 2 ? "3 hr" : adjustedHours > 1 ? "2 hr" : "1 hr";
  return {
    buildingUse,
    buildingHeight: Number(safeHeight.toFixed(1)),
    heightStories: Number(heightStories.toFixed(0)),
    elementType,
    baseRating: rating,
    elementFactor: Number(elementFactor.toFixed(2)),
    finalRating
  };
};

const calculateBatteryBackupMetrics = ({ detectorCount, alarmPowerW, standbyHours, alarmHours, voltageV, safetyFactor }) => {
  const safeDetectors = asNumber(detectorCount ?? 50, "Detector count");
  const safeAlarmPower = asNumber(alarmPowerW ?? 100, "Alarm power");
  const safeStandby = asNumber(standbyHours ?? 24, "Standby hours");
  const safeAlarm = asNumber(alarmHours ?? 0.5, "Alarm hours");
  const safeVoltage = asNumber(voltageV ?? 24, "Voltage");
  const safeSafety = asNumber(safetyFactor ?? 1.25, "Safety factor");
  const detectorPower = safeDetectors * 0.5;
  const standbyPower = detectorPower + (safeAlarmPower * 0.1);
  const standbyWH = standbyPower * safeStandby;
  const alarmWH = (detectorPower + safeAlarmPower) * safeAlarm;
  const totalWH = standbyWH + alarmWH;
  const withSafetyWH = totalWH * safeSafety;
  const batteryAH = withSafetyWH / safeVoltage;
  const batteryCount = Math.ceil(batteryAH / 60);
  return {
    requiredAH: Number(batteryAH.toFixed(1)),
    standardBatteryCount: batteryCount,
    withSafetyWH: Number(withSafetyWH.toFixed(0)),
    riskCategory: batteryAH > 200 ? "High" : "Medium"
  };
};

const calculateCableDeratingMetrics = ({ ampacity, cableType, insulationTemp, ambientTemp, grouping }) => {
  const cableRatings = { XLPE: { at60: 58, at90: 64 }, PVC: { at60: 42, at90: 51 }, EPR: { at60: 58, at90: 64 } };
  const tempFactors = { "30": 1.0, "40": 0.94, "50": 0.88, "60": 0.82, "70": 0.71 };
  const safeAmpacity = asNumber(ampacity, "Ampacity");
  const safeGrouping = asNumber(grouping ?? 1, "Grouping");
  const baseCurrent = cableRatings[cableType] && cableRatings[cableType][`at${insulationTemp}`] ? cableRatings[cableType][`at${insulationTemp}`] : 58;
  const tempFactor = tempFactors[ambientTemp] || 1.0;
  const groupingFactor = Math.max(0.5, 1 - 0.1 * (safeGrouping - 1));
  const finalRating = baseCurrent * tempFactor * groupingFactor;
  const safetyMargin = ((finalRating - safeAmpacity) / finalRating) * 100;
  return {
    ampacity: Number(safeAmpacity.toFixed(1)),
    cableType,
    finalRating: Number(finalRating.toFixed(1)),
    safetyMargin: Number(safetyMargin.toFixed(1)),
    riskCategory: safetyMargin > 20 ? "Low" : safetyMargin > 0 ? "Medium" : "High"
  };
};

const calculateFoamSystemMetrics = ({ protectedArea, applicationRate, foamType, applicationDurationMin, reserveMultiplier, tankDesignFactor }) => {
  const foamTypes = { AFFF: { ratio: 0.03 }, "AR-AFFF": { ratio: 0.03 }, FFFP: { ratio: 0.01 } };
  const safeArea = asNumber(protectedArea, "Protected area");
  const safeRate = asNumber(applicationRate, "Application rate");
  const safeDuration = asNumber(applicationDurationMin, "Duration");
  const safeReserve = asNumber(reserveMultiplier ?? 1.5, "Reserve multiplier");
  const safeTankDesign = asNumber(tankDesignFactor ?? 1.2, "Tank design factor");
  const foamData = foamTypes[foamType] || foamTypes.AFFF;
  const requiredFlow = safeArea * safeRate;
  const applicationVolume = requiredFlow * safeDuration;
  const concentrateVolume = applicationVolume * foamData.ratio;
  const withReserve = concentrateVolume * safeReserve;
  const tankVolume = (withReserve / 1000) * safeTankDesign;
  return {
    concentrateVolumeL: Number(concentrateVolume.toFixed(0)),
    withReserveL: Number(withReserve.toFixed(0)),
    tankVolumeM3: Number(tankVolume.toFixed(1)),
    hydrantFlowLpm: Number(requiredFlow.toFixed(1)),
    riskCategory: tankVolume > 100 ? "High" : "Medium"
  };
};

const calculateGeneratorMetrics = ({ pumpKW, fanKW, alarmKW, lightingKW, controlsKW, diversityFactor, demandFactor, loadMargin }) => {
  const safePump = asNumber(pumpKW ?? 30, "Pump kW");
  const safeFan = asNumber(fanKW ?? 10, "Fan kW");
  const safeAlarm = asNumber(alarmKW ?? 0.5, "Alarm kW");
  const safeLight = asNumber(lightingKW ?? 5, "Lighting kW");
  const safeControls = asNumber(controlsKW ?? 2, "Controls kW");
  const safeDiversity = asNumber(diversityFactor ?? 0.8, "Diversity factor");
  const safeDemand = asNumber(demandFactor ?? 0.75, "Demand factor");
  const safeMargin = asNumber(loadMargin ?? 25, "Load margin");
  const totalConnected = safePump + safeFan + safeAlarm + safeLight + safeControls;
  const diversityLoad = totalConnected * safeDiversity;
  const demandLoad = diversityLoad * safeDemand;
  const withMargin = demandLoad * (1 + safeMargin / 100);
  const totalKVA = (safePump / 0.85) + (safeFan / 0.85) + safeAlarm + safeLight + safeControls;
  const withMarginKVA = totalKVA * (1 + safeMargin / 100);
  const standardSizes = [10,15,20,30,50,75,100,150,200,300,500];
  const recommended = standardSizes.find((size) => size >= withMarginKVA) || Math.ceil(withMarginKVA);
  return {
    withMarginKW: Number(withMargin.toFixed(1)),
    totalKVA: Number(totalKVA.toFixed(1)),
    withMarginKVA: Number(withMarginKVA.toFixed(1)),
    recommendedKVA: Number(recommended)
  };
};

const calculateCustomMetrics = (payload = {}) => {
  const calculatorType = String(payload.calculatorType || "fire").toLowerCase();

  if (calculatorType === "area") {
    return calculateAreaMetrics(payload);
  }

  if (calculatorType === "extinguisher") {
    return calculateExtinguisherMetrics(payload);
  }

  if (calculatorType === "hydrant") {
    const base = calculateHydrantMetrics(payload);
    const occupancy = String(payload.occupancy || "commercial").toLowerCase();
    const riskCategory = occupancy === "storage" ? "Critical" : occupancy === "industrial" ? "High" : "Medium";

    return {
      area: asNumber(payload.area, "Area"),
      weight: base.waterDemand,
      cv: base.head,
      fireLoad: base.flowRate,
      extinguishers: Math.max(1, Math.ceil(asNumber(payload.area, "Area") / 120)),
      hydrantFlowLpm: base.flowRate,
      detectorCount: Math.max(2, Math.ceil(asNumber(payload.area, "Area") / 90)),
      riskCategory,
      flowRate: base.flowRate,
      head: base.head,
      pumpPower: base.pumpPower,
      waterDemand: base.waterDemand,
      occupancy
    };
  }

  if (calculatorType === "detection") {
    return calculateDetectionMetrics(payload);
  }

  if (calculatorType === "sprinkler") {
    return calculateSprinklerDemandMetrics(payload);
  }

  if (calculatorType === "water_tank" || calculatorType === "tank") {
    return calculateWaterTankMetrics(payload);
  }

  if (calculatorType === "evacuation") {
    return calculateEvacuationMetrics(payload);
  }
  if (calculatorType === "occupant_load") {
    return calculateOccupantLoadMetrics(payload);
  }

  if (calculatorType === "smoke_exhaust") {
    return calculateSmokeExhaustMetrics(payload);
  }

  if (calculatorType === "fire_rating") {
    return calculateFireRatingMetrics(payload);
  }

  if (calculatorType === "battery_backup") {
    return calculateBatteryBackupMetrics(payload);
  }

  if (calculatorType === "cable_derating") {
    return calculateCableDeratingMetrics(payload);
  }

  if (calculatorType === "foam_system") {
    return calculateFoamSystemMetrics(payload);
  }

  if (calculatorType === "generator") {
    return calculateGeneratorMetrics(payload);
  }

  const fire = calculateFireMetrics(payload);
  return {
    ...fire,
    fireLoad: fire.fireLoad,
    extinguishers: fire.extinguishers,
    hydrantFlowLpm: fire.hydrantFlowLpm,
    detectorCount: fire.detectorCount,
    riskCategory: fire.riskCategory
  };
};

module.exports = {
  calculateFireMetrics,
  calculateHydrantMetrics,
  calculateCustomMetrics
};
