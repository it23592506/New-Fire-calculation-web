import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const calculateLocal = ({
  sprinklerFlow,
  hydrantFlow,
  sprinklerDurationMin,
  hydrantDurationMin,
  reservePercent,
  deadStoragePercent,
  demandMode
}) => {
  const sprinklerVolumeL = sprinklerFlow * sprinklerDurationMin;
  const hydrantVolumeL = hydrantFlow * hydrantDurationMin;
  const netVolumeL = demandMode === "largest"
    ? Math.max(sprinklerVolumeL, hydrantVolumeL)
    : sprinklerVolumeL + hydrantVolumeL;
  const reserveVolumeL = netVolumeL * (reservePercent / 100);
  const grossVolumeL = (netVolumeL + reserveVolumeL) / (1 - deadStoragePercent / 100);
  const totalFlow = sprinklerFlow + hydrantFlow;
  const netVolumeM3 = netVolumeL / 1000;
  const grossVolumeM3 = grossVolumeL / 1000;
  const recommendedTankM3 = Math.ceil(grossVolumeM3 / 5) * 5;

  return {
    sprinklerFlow: Number(sprinklerFlow.toFixed(1)),
    hydrantFlow: Number(hydrantFlow.toFixed(1)),
    totalFlow: Number(totalFlow.toFixed(1)),
    sprinklerDurationMin: Number(sprinklerDurationMin.toFixed(1)),
    hydrantDurationMin: Number(hydrantDurationMin.toFixed(1)),
    reservePercent: Number(reservePercent.toFixed(1)),
    deadStoragePercent: Number(deadStoragePercent.toFixed(1)),
    demandMode,
    netVolumeM3: Number(netVolumeM3.toFixed(1)),
    volumeM3: Number(grossVolumeM3.toFixed(1)),
    recommendedTankM3: Number(recommendedTankM3.toFixed(1))
  };
};

export default function FireWaterTank() {
  const [sprinklerFlow, setSprinklerFlow] = useState("");
  const [hydrantFlow, setHydrantFlow] = useState("");
  const [sprinklerDurationMin, setSprinklerDurationMin] = useState("90");
  const [hydrantDurationMin, setHydrantDurationMin] = useState("120");
  const [reservePercent, setReservePercent] = useState("15");
  const [deadStoragePercent, setDeadStoragePercent] = useState("10");
  const [demandMode, setDemandMode] = useState("simultaneous");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);

    const sprinkler = toNumber(sprinklerFlow || 0);
    const hydrant = toNumber(hydrantFlow || 0);
    const sprinklerDuration = toNumber(sprinklerDurationMin);
    const hydrantDuration = toNumber(hydrantDurationMin);
    const reserve = toNumber(reservePercent);
    const deadStorage = toNumber(deadStoragePercent);

    if ([sprinkler, hydrant, sprinklerDuration, hydrantDuration, reserve, deadStorage].some((value) => Number.isNaN(value))) {
      setError("Please enter valid numeric inputs");
      setLoading(false);
      return;
    }

    if (sprinkler < 0 || hydrant < 0) {
      setError("Flow values cannot be negative");
      setLoading(false);
      return;
    }

    if (sprinklerDuration <= 0 || hydrantDuration <= 0) {
      setError("Duration values must be positive");
      setLoading(false);
      return;
    }

    if (reserve < 0 || deadStorage < 0 || deadStorage >= 100) {
      setError("Reserve must be non-negative and dead storage must be between 0 and 99.9");
      setLoading(false);
      return;
    }

    if (sprinkler === 0 && hydrant === 0) {
      setError("Enter at least one flow demand");
      setLoading(false);
      return;
    }

    const localResult = calculateLocal({
      sprinklerFlow: sprinkler,
      hydrantFlow: hydrant,
      sprinklerDurationMin: sprinklerDuration,
      hydrantDurationMin: hydrantDuration,
      reservePercent: reserve,
      deadStoragePercent: deadStorage,
      demandMode
    });

    setResult(localResult);

    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        setLoading(false);
        return;
      }

      const res = await api.post("/calculate/custom", {
        calculatorType: "water_tank",
        title: "Fire Water Tank Sizing",
        sprinklerFlowLpm: sprinkler,
        hydrantFlowLpm: hydrant,
        durationHours: Math.max(sprinklerDuration, hydrantDuration) / 60,
        sprinklerDurationMin: sprinklerDuration,
        hydrantDurationMin: hydrantDuration,
        reservePercent: reserve,
        deadStoragePercent: deadStorage,
        demandMode
      });
      const data = res.data.metrics || res.data;
      setResult({
        ...localResult,
        sprinklerFlow: data.sprinklerFlowLpm ?? localResult.sprinklerFlow,
        hydrantFlow: data.hydrantDemandLpm ?? data.hydrantFlowLpm ?? localResult.hydrantFlow,
        totalFlow: data.totalFlowLpm ?? localResult.totalFlow,
        sprinklerDurationMin: data.sprinklerDurationMin ?? localResult.sprinklerDurationMin,
        hydrantDurationMin: data.hydrantDurationMin ?? localResult.hydrantDurationMin,
        reservePercent: data.reservePercent ?? localResult.reservePercent,
        deadStoragePercent: data.deadStoragePercent ?? localResult.deadStoragePercent,
        demandMode: data.demandMode ?? localResult.demandMode,
        netVolumeM3: data.netVolumeM3 ?? localResult.netVolumeM3,
        volumeM3: data.volumeM3 ?? localResult.volumeM3,
        recommendedTankM3: data.recommendedTankM3 ?? localResult.recommendedTankM3
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
        <h2>🛢️ Fire Water Tank</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>

      <div className="card calc-section">
        <h4>Required Tank Volume</h4>
        <label className="field">
          Sprinkler Flow (L/min)
          <input className="input" type="number" step="10" value={sprinklerFlow} onChange={(e) => setSprinklerFlow(e.target.value)} placeholder="e.g. 900" />
        </label>
        <label className="field">
          Hydrant Flow (L/min)
          <input className="input" type="number" step="10" value={hydrantFlow} onChange={(e) => setHydrantFlow(e.target.value)} placeholder="e.g. 1500" />
        </label>
        <label className="field">
          Demand Combination Basis
          <select className="input" value={demandMode} onChange={(e) => setDemandMode(e.target.value)}>
            <option value="simultaneous">Simultaneous (sprinkler + hydrant)</option>
            <option value="largest">Largest Demand Only</option>
          </select>
        </label>
        <label className="field">
          Sprinkler Duration (min)
          <input className="input" type="number" step="1" value={sprinklerDurationMin} onChange={(e) => setSprinklerDurationMin(e.target.value)} placeholder="e.g. 90" />
        </label>
        <label className="field">
          Hydrant Duration (min)
          <input className="input" type="number" step="1" value={hydrantDurationMin} onChange={(e) => setHydrantDurationMin(e.target.value)} placeholder="e.g. 120" />
        </label>
        <label className="field">
          Reserve Allowance (%)
          <input className="input" type="number" step="0.5" value={reservePercent} onChange={(e) => setReservePercent(e.target.value)} placeholder="e.g. 15" />
        </label>
        <label className="field">
          Dead Storage / Unusable Volume (%)
          <input className="input" type="number" step="0.5" value={deadStoragePercent} onChange={(e) => setDeadStoragePercent(e.target.value)} placeholder="e.g. 10" />
        </label>
        <p className="muted">
          Net volume is based on selected demand mode and durations, then adjusted for reserve and dead storage.
        </p>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}

        <button className="primary-btn" disabled={loading} onClick={calculate}>
          {loading ? "Calculating..." : "Calculate & Save Report"}
        </button>

        {result && (
          <div className="result-box">
            <p><strong>Sprinkler Flow:</strong> {result.sprinklerFlow} L/min</p>
            <p><strong>Hydrant Flow:</strong> {result.hydrantFlow} L/min</p>
            <p><strong>Total Flow:</strong> {result.totalFlow} L/min</p>
            <p><strong>Demand Mode:</strong> {result.demandMode}</p>
            <p><strong>Sprinkler Duration:</strong> {result.sprinklerDurationMin} min</p>
            <p><strong>Hydrant Duration:</strong> {result.hydrantDurationMin} min</p>
            <p><strong>Net Required Volume:</strong> {result.netVolumeM3} m³</p>
            <p><strong>Gross Volume (with allowances):</strong> {result.volumeM3} m³</p>
            <p><strong>Recommended Tank Size:</strong> {result.recommendedTankM3} m³</p>
          </div>
        )}
      </div>
    </div>
  );
}
