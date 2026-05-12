import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const foamTypes = { AFFF: { ratio: 0.03 }, "AR-AFFF": { ratio: 0.03 }, FFFP: { ratio: 0.01 } };

const calculateLocal = ({ protectedArea, applicationRate, foamType, applicationDurationMin, reserveMultiplier, tankDesignFactor }) => {
  const requiredFlow = protectedArea * applicationRate;
  const applicationVolume = requiredFlow * applicationDurationMin;
  const concentrateVolume = applicationVolume * foamTypes[foamType].ratio;
  const withReserve = concentrateVolume * reserveMultiplier;
  const tankVolume = (withReserve / 1000) * tankDesignFactor;
  return {
    requiredFlowLpm: Number(requiredFlow.toFixed(1)),
    applicationVolumeL: Number(applicationVolume.toFixed(0)),
    concentrateVolumeL: Number(concentrateVolume.toFixed(0)),
    withReserveL: Number(withReserve.toFixed(0)),
    tankVolumeM3: Number(tankVolume.toFixed(1)),
    concentrateRatioPct: Number((foamTypes[foamType].ratio * 100).toFixed(1))
  };
};

export default function FoamSystem() {
  const [protectedArea, setProtectedArea] = useState("500");
  const [applicationRate, setApplicationRate] = useState("0.1");
  const [foamType, setFoamType] = useState("AFFF");
  const [applicationDurationMin, setApplicationDurationMin] = useState("20");
  const [reserveMultiplier, setReserveMultiplier] = useState("1.5");
  const [tankDesignFactor, setTankDesignFactor] = useState("1.2");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const area = toNumber(protectedArea);
    const rate = toNumber(applicationRate);
    const dur = toNumber(applicationDurationMin);
    const reserve = toNumber(reserveMultiplier);
    const tankDesign = toNumber(tankDesignFactor);
    if ([area, rate, dur, reserve, tankDesign].some((v)=>Number.isNaN(v))) { setError("Please enter valid inputs"); setLoading(false); return; }
    if (area <= 0 || rate <= 0 || dur <= 0 || reserve <= 0 || tankDesign <= 0) {
      setError("All inputs must be greater than 0");
      setLoading(false);
      return;
    }
    const localResult = calculateLocal({ protectedArea: area, applicationRate: rate, foamType, applicationDurationMin: dur, reserveMultiplier: reserve, tankDesignFactor: tankDesign });
    setResult(localResult);
    try {
      if (!isAuthenticated()) { setNotice("Calculated locally. Sign in to save this report."); setLoading(false); return; }
      const res = await api.post("/calculate/custom", { calculatorType: "foam_system", title: "Foam System", protectedArea: area, applicationRate: rate, foamType, applicationDurationMin: dur, reserveMultiplier: reserve, tankDesignFactor: tankDesign });
      const data = res.data.metrics || res.data;
      setResult({ ...localResult, ...data });
    } catch (err) { setNotice(err.response?.data?.message || "Calculated locally, but saving failed."); } finally { setLoading(false); }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact"><h2>Foam System Concentrate Sizing</h2><Link className="ghost-btn action-link" to="/home">Back</Link></div>
      <div className="card calc-section">
        <label className="field">Protected Area (m²)<input className="input" value={protectedArea} onChange={(e)=>setProtectedArea(e.target.value)} /></label>
        <label className="field">Application Rate (L/min/m²)<input className="input" value={applicationRate} onChange={(e)=>setApplicationRate(e.target.value)} /></label>
        <label className="field">Foam Type<select className="input" value={foamType} onChange={(e)=>setFoamType(e.target.value)}><option>AFFF</option><option>AR-AFFF</option><option>FFFP</option></select></label>
        <label className="field">Duration (min)<input className="input" value={applicationDurationMin} onChange={(e)=>setApplicationDurationMin(e.target.value)} /></label>
        <label className="field">Reserve Multiplier<input className="input" value={reserveMultiplier} onChange={(e)=>setReserveMultiplier(e.target.value)} /></label>
        <label className="field">Tank Design Factor<input className="input" value={tankDesignFactor} onChange={(e)=>setTankDesignFactor(e.target.value)} /></label>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <button className="primary-btn" disabled={loading} onClick={calculate}>{loading ? "Calculating..." : "Calculate & Save Report"}</button>
        {result && (
          <div className="result-box">
            <p><strong>Required Flow (L/min):</strong> {result.requiredFlowLpm}</p>
            <p><strong>Concentrate Volume (L):</strong> {result.concentrateVolumeL}</p>
            <p><strong>With Reserve (L):</strong> {result.withReserveL}</p>
            <p><strong>Recommended Tank (m³):</strong> {result.tankVolumeM3}</p>
          </div>
        )}
      </div>
    </div>
  );
}
