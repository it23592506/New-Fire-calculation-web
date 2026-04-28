import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const fireScenarioFactors = { flashover: 1.2, smoldering: 0.8, active: 1.0 };

const calculateLocal = ({ compartmentArea, ceilingHeight, fireScenario, smokeProductionRate, exchangesPerHour, safetyFactor }) => {
  const volume = compartmentArea * ceilingHeight;
  const scenarioFactor = fireScenarioFactors[fireScenario] || 1.0;
  const productionAdjusted = smokeProductionRate * scenarioFactor;
  const demandM3H = productionAdjusted * compartmentArea;
  const exchangeDemand = volume * exchangesPerHour;
  const requiredAirflow = Math.max(demandM3H, exchangeDemand);
  const withSafety = requiredAirflow * safetyFactor;
  return {
    compartmentArea: Number(compartmentArea.toFixed(1)),
    ceilingHeight: Number(ceilingHeight.toFixed(2)),
    volume: Number(volume.toFixed(1)),
    fireScenario,
    requiredAirflowM3H: Number(requiredAirflow.toFixed(1)),
    withSafetyM3H: Number(withSafety.toFixed(1)),
    exhaustFanCFM: Number((withSafety / 1.699).toFixed(1)),
    exhaustFanKW: Number(((withSafety * 0.1) / 3600).toFixed(2))
  };
};

export default function SmokeExhaust() {
  const [compartmentArea, setCompartmentArea] = useState("200");
  const [ceilingHeight, setCeilingHeight] = useState("3.5");
  const [fireScenario, setFireScenario] = useState("active");
  const [smokeProductionRate, setSmokeProductionRate] = useState("1.5");
  const [exchangesPerHour, setExchangesPerHour] = useState("6");
  const [safetyFactor, setSafetyFactor] = useState("1.25");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const area = toNumber(compartmentArea);
    const height = toNumber(ceilingHeight);
    const prod = toNumber(smokeProductionRate);
    const exch = toNumber(exchangesPerHour);
    const safety = toNumber(safetyFactor);
    if ([area, height, prod, exch, safety].some((v) => Number.isNaN(v))) {
      setError("Please enter valid numeric inputs");
      setLoading(false);
      return;
    }
    const localResult = calculateLocal({ compartmentArea: area, ceilingHeight: height, fireScenario, smokeProductionRate: prod, exchangesPerHour: exch, safetyFactor: safety });
    setResult(localResult);
    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        setLoading(false);
        return;
      }
      const res = await api.post("/calculate/custom", {
        calculatorType: "smoke_exhaust",
        title: `Smoke Exhaust (${fireScenario})`,
        compartmentArea: area,
        ceilingHeight: height,
        fireScenario,
        smokeProductionRate: prod,
        exchangesPerHour: exch,
        safetyFactor: safety
      });
      const data = res.data.metrics || res.data;
      setResult({ ...localResult, ...data });
    } catch (err) {
      setNotice(err.response?.data?.message || "Calculated locally, but saving failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact">
        <h2>Smoke Exhaust Sizing</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>
      <div className="card calc-section">
        <label className="field">Compartment Area (m²)<input className="input" value={compartmentArea} onChange={(e) => setCompartmentArea(e.target.value)} /></label>
        <label className="field">Ceiling Height (m)<input className="input" value={ceilingHeight} onChange={(e) => setCeilingHeight(e.target.value)} /></label>
        <label className="field">Fire Scenario<select className="input" value={fireScenario} onChange={(e) => setFireScenario(e.target.value)}><option value="smoldering">Smoldering</option><option value="active">Active</option><option value="flashover">Flashover</option></select></label>
        <label className="field">Smoke Prod (m³/min/m²)<input className="input" value={smokeProductionRate} onChange={(e) => setSmokeProductionRate(e.target.value)} /></label>
        <label className="field">Air Exchanges/hr<input className="input" value={exchangesPerHour} onChange={(e) => setExchangesPerHour(e.target.value)} /></label>
        <label className="field">Safety Factor<input className="input" value={safetyFactor} onChange={(e) => setSafetyFactor(e.target.value)} /></label>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <button className="primary-btn" disabled={loading} onClick={calculate}>{loading ? "Calculating..." : "Calculate & Save Report"}</button>
        {result && (
          <div className="result-box">
            <p><strong>Volume:</strong> {result.volume} m³</p>
            <p><strong>Required Airflow:</strong> {result.requiredAirflowM3H} m³/h</p>
            <p><strong>With Safety:</strong> {result.withSafetyM3H} m³/h</p>
            <p><strong>Exhaust Fan (CFM):</strong> {result.exhaustFanCFM}</p>
            <p><strong>Fan Power:</strong> {result.exhaustFanKW} kW</p>
          </div>
        )}
      </div>
    </div>
  );
}
