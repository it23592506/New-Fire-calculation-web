import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const cableRatings = { XLPE: { at60: 58, at90: 64 }, PVC: { at60: 42, at90: 51 }, EPR: { at60: 58, at90: 64 } };
const tempFactors = { "30": 1.0, "40": 0.94, "50": 0.88, "60": 0.82, "70": 0.71 };

const calculateLocal = ({ ampacity, cableType, insulationTemp, ambientTemp, grouping }) => {
  const baseCurrent = cableRatings[cableType][`at${insulationTemp}`] || 58;
  const tempFactor = tempFactors[ambientTemp] || 1.0;
  const groupingFactor = Math.max(0.5, 1 - 0.1 * (grouping - 1));
  const finalRating = baseCurrent * tempFactor * groupingFactor;
  const safetyMargin = ((finalRating - ampacity) / finalRating) * 100;
  const recommendation = safetyMargin > 20 ? "Adequate" : safetyMargin > 0 ? "Consider upsizing" : "Undersized";
  return {
    ampacity: Number(ampacity.toFixed(1)),
    cableType,
    insulationTemp,
    ambientTemp,
    baseCurrent: Number(baseCurrent.toFixed(1)),
    tempFactor: Number(tempFactor.toFixed(2)),
    grouping: Number(grouping.toFixed(0)),
    groupingFactor: Number(groupingFactor.toFixed(2)),
    finalRating: Number(finalRating.toFixed(1)),
    safetyMargin: Number(safetyMargin.toFixed(1)),
    recommendation
  };
};

export default function CableDerating() {
  const [ampacity, setAmpacity] = useState("100");
  const [cableType, setCableType] = useState("XLPE");
  const [insulationTemp, setInsulationTemp] = useState("90");
  const [ambientTemp, setAmbientTemp] = useState("30");
  const [grouping, setGrouping] = useState("1");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const amp = toNumber(ampacity);
    const grp = toNumber(grouping);
    if ([amp, grp].some((v) => Number.isNaN(v))) {
      setError("Please enter valid numeric inputs");
      setLoading(false);
      return;
    }
    const localResult = calculateLocal({ ampacity: amp, cableType, insulationTemp, ambientTemp, grouping: grp });
    setResult(localResult);
    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        setLoading(false);
        return;
      }
      const res = await api.post("/calculate/custom", { calculatorType: "cable_derating", title: "Cable Derating", ampacity: amp, cableType, insulationTemp, ambientTemp, grouping: grp });
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
        <h2>Cable Derating / Fire Survival Sizing</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>
      <div className="card calc-section">
        <label className="field">Conductor Ampacity (A)<input className="input" value={ampacity} onChange={(e)=>setAmpacity(e.target.value)} /></label>
        <label className="field">Cable Type<select className="input" value={cableType} onChange={(e)=>setCableType(e.target.value)}><option>XLPE</option><option>PVC</option><option>EPR</option></select></label>
        <label className="field">Insulation Temp<select className="input" value={insulationTemp} onChange={(e)=>setInsulationTemp(e.target.value)}><option value="60">60</option><option value="90">90</option></select></label>
        <label className="field">Ambient Temp<select className="input" value={ambientTemp} onChange={(e)=>setAmbientTemp(e.target.value)}><option value="30">30</option><option value="40">40</option><option value="50">50</option><option value="60">60</option><option value="70">70</option></select></label>
        <label className="field">Grouping (count)<input className="input" value={grouping} onChange={(e)=>setGrouping(e.target.value)} /></label>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <button className="primary-btn" disabled={loading} onClick={calculate}>{loading ? "Calculating..." : "Calculate & Save Report"}</button>
        {result && (
          <div className="result-box">
            <p><strong>Final Ampacity Rating:</strong> {result.finalRating} A</p>
            <p><strong>Safety Margin:</strong> {result.safetyMargin}%</p>
            <p><strong>Recommendation:</strong> {result.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
