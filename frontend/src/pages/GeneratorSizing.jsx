import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const calculateLocal = ({ pumpKW, fanKW, alarmKW, lightingKW, controlsKW, diversityFactor, demandFactor, loadMargin }) => {
  const totalConnectedKW = pumpKW + fanKW + alarmKW + lightingKW + controlsKW;
  const diversityLoadKW = totalConnectedKW * diversityFactor;
  const demandLoadKW = diversityLoadKW * demandFactor;
  const withMarginKW = demandLoadKW * (1 + loadMargin / 100);
  const totalKVA = (pumpKW / 0.85) + (fanKW / 0.85) + alarmKW + lightingKW + controlsKW;
  const withMarginKVA = totalKVA * (1 + loadMargin / 100);
  const standardSizes = [10,15,20,30,50,75,100,150,200,300,500];
  const recommended = standardSizes.find((s)=>s >= withMarginKVA) || Math.ceil(withMarginKVA);
  return {
    totalConnectedKW: Number(totalConnectedKW.toFixed(1)),
    diversityLoadKW: Number(diversityLoadKW.toFixed(1)),
    demandLoadKW: Number(demandLoadKW.toFixed(1)),
    withMarginKW: Number(withMarginKW.toFixed(1)),
    totalKVA: Number(totalKVA.toFixed(1)),
    withMarginKVA: Number(withMarginKVA.toFixed(1)),
    recommendedKVA: Number(recommended)
  };
};

export default function GeneratorSizing() {
  const [pumpKW, setPumpKW] = useState("30");
  const [fanKW, setFanKW] = useState("10");
  const [alarmKW, setAlarmKW] = useState("0.5");
  const [lightingKW, setLightingKW] = useState("5");
  const [controlsKW, setControlsKW] = useState("2");
  const [diversityFactor, setDiversityFactor] = useState("0.8");
  const [demandFactor, setDemandFactor] = useState("0.75");
  const [loadMargin, setLoadMargin] = useState("25");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const pump = toNumber(pumpKW);
    const fan = toNumber(fanKW);
    const alarm = toNumber(alarmKW);
    const lighting = toNumber(lightingKW);
    const controls = toNumber(controlsKW);
    const diversity = toNumber(diversityFactor);
    const demand = toNumber(demandFactor);
    const margin = toNumber(loadMargin);
    if ([pump, fan, alarm, lighting, controls, diversity, demand, margin].some((v)=>Number.isNaN(v))) { setError("Please enter valid inputs"); setLoading(false); return; }
    const localResult = calculateLocal({ pumpKW: pump, fanKW: fan, alarmKW: alarm, lightingKW: lighting, controlsKW: controls, diversityFactor: diversity, demandFactor: demand, loadMargin: margin });
    setResult(localResult);
    try {
      if (!isAuthenticated()) { setNotice("Calculated locally. Sign in to save this report."); setLoading(false); return; }
      const res = await api.post("/calculate/custom", { calculatorType: "generator", title: "Generator Sizing", pumpKW: pump, fanKW: fan, alarmKW: alarm, lightingKW: lighting, controlsKW: controls, diversityFactor: diversity, demandFactor: demand, loadMargin: margin });
      const data = res.data.metrics || res.data;
      setResult({ ...localResult, ...data });
    } catch (err) { setNotice(err.response?.data?.message || "Calculated locally, but saving failed."); } finally { setLoading(false); }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact"><h2>Generator Sizing for Fire Loads</h2><Link className="ghost-btn action-link" to="/home">Back</Link></div>
      <div className="card calc-section">
        <label className="field">Pump kW<input className="input" value={pumpKW} onChange={(e)=>setPumpKW(e.target.value)} /></label>
        <label className="field">Fan kW<input className="input" value={fanKW} onChange={(e)=>setFanKW(e.target.value)} /></label>
        <label className="field">Alarm kW<input className="input" value={alarmKW} onChange={(e)=>setAlarmKW(e.target.value)} /></label>
        <label className="field">Lighting kW<input className="input" value={lightingKW} onChange={(e)=>setLightingKW(e.target.value)} /></label>
        <label className="field">Controls kW<input className="input" value={controlsKW} onChange={(e)=>setControlsKW(e.target.value)} /></label>
        <label className="field">Diversity Factor<input className="input" value={diversityFactor} onChange={(e)=>setDiversityFactor(e.target.value)} /></label>
        <label className="field">Demand Factor<input className="input" value={demandFactor} onChange={(e)=>setDemandFactor(e.target.value)} /></label>
        <label className="field">Load Margin (%)<input className="input" value={loadMargin} onChange={(e)=>setLoadMargin(e.target.value)} /></label>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <button className="primary-btn" disabled={loading} onClick={calculate}>{loading ? "Calculating..." : "Calculate & Save Report"}</button>
        {result && (
          <div className="result-box">
            <p><strong>Total Connected (kW):</strong> {result.totalConnectedKW}</p>
            <p><strong>Diversity Load (kW):</strong> {result.diversityLoadKW}</p>
            <p><strong>Demand Load (kW):</strong> {result.demandLoadKW}</p>
            <p><strong>With Margin (kW):</strong> {result.withMarginKW}</p>
            <p><strong>Total kVA:</strong> {result.totalKVA}</p>
            <p><strong>With Margin (kVA):</strong> {result.withMarginKVA}</p>
            <p><strong>Recommended Generator Size:</strong> {result.recommendedKVA} kVA</p>
          </div>
        )}
      </div>
    </div>
  );
}
