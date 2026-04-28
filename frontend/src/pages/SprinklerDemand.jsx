import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const hazardDefaults = {
  light: {
    label: "Light Hazard",
    density: 4.1,
    designArea: 140,
    hoseStreamLpm: 250,
    durationMin: 60
  },
  ordinary: {
    label: "Ordinary Hazard",
    density: 6.1,
    designArea: 140,
    hoseStreamLpm: 500,
    durationMin: 90
  },
  extra: {
    label: "Extra Hazard",
    density: 10.2,
    designArea: 230,
    hoseStreamLpm: 950,
    durationMin: 120
  }
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const calculateLocal = ({ hazard, density, designArea, hoseStreamLpm, safetyFactor, durationMin, sprinklerCoverageM2 }) => {
  const defaults = hazardDefaults[hazard] || hazardDefaults.ordinary;
  const safeDensity = toNumber(density);
  const safeDesignArea = toNumber(designArea);
  const safeHose = toNumber(hoseStreamLpm);
  const safeSafetyFactor = toNumber(safetyFactor);
  const safeDuration = toNumber(durationMin);
  const safeCoverage = toNumber(sprinklerCoverageM2);

  const sprinklerDemandLpm = safeDensity * safeDesignArea;
  const totalDemandLpm = (sprinklerDemandLpm + safeHose) * safeSafetyFactor;
  const demandM3Hr = totalDemandLpm * 0.06;
  const demandGpm = totalDemandLpm / 3.785;
  const operatingSprinklers = Math.max(1, Math.ceil(safeDesignArea / safeCoverage));
  const flowPerSprinklerLpm = sprinklerDemandLpm / operatingSprinklers;
  const waterVolumeM3 = (totalDemandLpm * safeDuration) / 1000;

  return {
    hazardLabel: defaults.label,
    density: Number(safeDensity.toFixed(2)),
    designArea: Number(safeDesignArea.toFixed(2)),
    hoseStreamLpm: Number(safeHose.toFixed(1)),
    safetyFactor: Number(safeSafetyFactor.toFixed(2)),
    durationMin: Number(safeDuration.toFixed(1)),
    sprinklerCoverageM2: Number(safeCoverage.toFixed(1)),
    sprinklerDemandLpm: Number(sprinklerDemandLpm.toFixed(1)),
    operatingSprinklers,
    flowPerSprinklerLpm: Number(flowPerSprinklerLpm.toFixed(1)),
    demandLpm: Number(totalDemandLpm.toFixed(1)),
    demandM3Hr: Number(demandM3Hr.toFixed(1)),
    demandGpm: Number(demandGpm.toFixed(1)),
    waterVolumeM3: Number(waterVolumeM3.toFixed(1))
  };
};

export default function SprinklerDemand() {
  const [hazard, setHazard] = useState("ordinary");
  const [density, setDensity] = useState(String(hazardDefaults.ordinary.density));
  const [designArea, setDesignArea] = useState(String(hazardDefaults.ordinary.designArea));
  const [hoseStreamLpm, setHoseStreamLpm] = useState(String(hazardDefaults.ordinary.hoseStreamLpm));
  const [durationMin, setDurationMin] = useState(String(hazardDefaults.ordinary.durationMin));
  const [safetyFactor, setSafetyFactor] = useState("1.15");
  const [sprinklerCoverageM2, setSprinklerCoverageM2] = useState("12");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preset = hazardDefaults[hazard] || hazardDefaults.ordinary;
    setDensity(String(preset.density));
    setDesignArea(String(preset.designArea));
    setHoseStreamLpm(String(preset.hoseStreamLpm));
    setDurationMin(String(preset.durationMin));
  }, [hazard]);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);

    const d = toNumber(density);
    const a = toNumber(designArea);
    const hose = toNumber(hoseStreamLpm);
    const sf = toNumber(safetyFactor);
    const dur = toNumber(durationMin);
    const coverage = toNumber(sprinklerCoverageM2);

    if ([d, a, hose, sf, dur, coverage].some((value) => Number.isNaN(value))) {
      setError("Please enter valid numeric inputs");
      setLoading(false);
      return;
    }

    if (d <= 0 || a <= 0 || sf <= 0 || dur <= 0 || coverage <= 0) {
      setError("Density, design area, safety factor, duration, and coverage must be positive");
      setLoading(false);
      return;
    }

    if (hose < 0) {
      setError("Hose stream allowance cannot be negative");
      setLoading(false);
      return;
    }

    const localResult = calculateLocal({
      hazard,
      density: d,
      designArea: a,
      hoseStreamLpm: hose,
      safetyFactor: sf,
      durationMin: dur,
      sprinklerCoverageM2: coverage
    });

    setResult(localResult);

    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        setLoading(false);
        return;
      }

      const res = await api.post("/calculate/custom", {
        calculatorType: "sprinkler",
        title: `Sprinkler Demand (${localResult.hazardLabel})`,
        hazardClass: hazard,
        density: d,
        designArea: a,
        hoseStreamLpm: hose,
        safetyFactor: sf,
        durationMin: dur,
        sprinklerCoverageM2: coverage
      });
      const data = res.data.metrics || res.data;
      setResult({
        ...localResult,
        density: data.density ?? localResult.density,
        designArea: data.designArea ?? localResult.designArea,
        hoseStreamLpm: data.hoseStreamLpm ?? localResult.hoseStreamLpm,
        safetyFactor: data.safetyFactor ?? localResult.safetyFactor,
        durationMin: data.durationMin ?? localResult.durationMin,
        sprinklerDemandLpm: data.sprinklerDemandLpm ?? localResult.sprinklerDemandLpm,
        operatingSprinklers: data.operatingSprinklers ?? localResult.operatingSprinklers,
        flowPerSprinklerLpm: data.flowPerSprinklerLpm ?? localResult.flowPerSprinklerLpm,
        demandLpm: data.demandLpm ?? localResult.demandLpm,
        demandM3Hr: data.demandM3Hr ?? localResult.demandM3Hr,
        demandGpm: data.demandGpm ?? localResult.demandGpm,
        waterVolumeM3: data.waterVolumeM3 ?? localResult.waterVolumeM3
      });
    } catch (err) {
      setNotice(err.response?.data?.message || "Calculated locally, but saving failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact">
        <h2>💦 Sprinkler Demand</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>

      <div className="card calc-section">
        <h4>Hydraulic Demand by Hazard Class, Density, and Design Area</h4>
        <label className="field">
          Hazard Class
          <select className="input" value={hazard} onChange={(e) => setHazard(e.target.value)}>
            <option value="light">Light Hazard</option>
            <option value="ordinary">Ordinary Hazard</option>
            <option value="extra">Extra Hazard</option>
          </select>
        </label>
        <label className="field">
          Density (L/min/m²)
          <input className="input" type="number" step="0.1" value={density} onChange={(e) => setDensity(e.target.value)} placeholder="e.g. 6.1" />
        </label>
        <label className="field">
          Design Area (m²)
          <input className="input" type="number" step="1" value={designArea} onChange={(e) => setDesignArea(e.target.value)} placeholder="e.g. 140" />
        </label>
        <label className="field">
          Hose Stream Allowance (L/min)
          <input className="input" type="number" step="10" value={hoseStreamLpm} onChange={(e) => setHoseStreamLpm(e.target.value)} placeholder="e.g. 500" />
        </label>
        <label className="field">
          Safety Factor (multiplier)
          <input className="input" type="number" step="0.01" value={safetyFactor} onChange={(e) => setSafetyFactor(e.target.value)} placeholder="e.g. 1.15" />
        </label>
        <label className="field">
          Design Duration (min)
          <input className="input" type="number" step="1" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder="e.g. 90" />
        </label>
        <label className="field">
          Area per Sprinkler (m²/head)
          <input className="input" type="number" step="0.5" value={sprinklerCoverageM2} onChange={(e) => setSprinklerCoverageM2(e.target.value)} placeholder="e.g. 12" />
        </label>
        <p className="muted">
          Base sprinkler demand = density × design area. Total demand includes hose stream allowance and safety factor.
        </p>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}

        <button className="primary-btn" disabled={loading} onClick={calculate}>
          {loading ? "Calculating..." : "Calculate & Save Report"}
        </button>

        {result && (
          <div className="result-box">
            <p><strong>Hazard Class:</strong> {result.hazardLabel}</p>
            <p><strong>Density:</strong> {result.density} L/min/m²</p>
            <p><strong>Design Area:</strong> {result.designArea} m²</p>
            <p><strong>Sprinkler Demand:</strong> {result.sprinklerDemandLpm} L/min</p>
            <p><strong>Hose Stream:</strong> {result.hoseStreamLpm} L/min</p>
            <p><strong>Safety Factor:</strong> {result.safetyFactor} x</p>
            <p><strong>Operating Sprinklers:</strong> {result.operatingSprinklers} heads</p>
            <p><strong>Flow per Sprinkler:</strong> {result.flowPerSprinklerLpm} L/min/head</p>
            <p><strong>Total Demand (L/min):</strong> {result.demandLpm} L/min</p>
            <p><strong>Demand (m³/h):</strong> {result.demandM3Hr} m³/h</p>
            <p><strong>Demand (gpm):</strong> {result.demandGpm} gpm</p>
            <p><strong>Water for Duration:</strong> {result.waterVolumeM3} m³</p>
          </div>
        )}
      </div>
    </div>
  );
}
