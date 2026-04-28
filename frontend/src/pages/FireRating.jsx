import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const ratingRules = {
  residential: { 0: "1 hr", 1: "1 hr", 2: "1 hr", 3: "1 hr", 4: "2 hr" },
  office: { 0: "1 hr", 1: "1 hr", 2: "2 hr", 3: "2 hr", 4: "3 hr" },
  industrial: { 0: "1 hr", 1: "2 hr", 2: "2 hr", 3: "3 hr", 4: "4 hr" },
  assembly: { 0: "1 hr", 1: "2 hr", 2: "2 hr", 3: "3 hr", 4: "4 hr" }
};

const calculateLocal = ({ buildingUse, buildingHeight, elementType }) => {
  const safeHeight = toNumber(buildingHeight);
  const heightStories = Math.max(1, Math.ceil(safeHeight / 3.5));
  const rules = ratingRules[buildingUse] || ratingRules.office;
  const heightCategory = Math.min(4, Math.floor((heightStories - 1) / 1));
  const rating = rules[heightCategory] || "1 hr";
  const elementFactors = { wall: 1.0, door: 1.25, slab: 0.9, beam: 1.1 };
  const elementFactor = elementFactors[elementType] || 1.0;
  const adjustedHours = parseFloat(rating) * elementFactor;
  const finalRating = adjustedHours > 3 ? "4 hr" : adjustedHours > 2 ? "3 hr" : adjustedHours > 1 ? "2 hr" : "1 hr";
  return {
    buildingUse,
    buildingHeight: Number(safeHeight.toFixed(1)),
    heightStories,
    elementType,
    baseRating: rating,
    elementFactor: Number(elementFactor.toFixed(2)),
    finalRating,
    recommendation: `${elementType} should have minimum ${finalRating} fire rating`
  };
};

export default function FireRating() {
  const [buildingUse, setBuildingUse] = useState("office");
  const [buildingHeight, setBuildingHeight] = useState("12");
  const [elementType, setElementType] = useState("wall");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const height = toNumber(buildingHeight);
    if (Number.isNaN(height) || height <= 0) {
      setError("Please enter a valid building height");
      setLoading(false);
      return;
    }
    const localResult = calculateLocal({ buildingUse, buildingHeight: height, elementType });
    setResult(localResult);
    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        setLoading(false);
        return;
      }
      const res = await api.post("/calculate/custom", { calculatorType: "fire_rating", title: "Fire Rating", buildingUse, buildingHeight: height, elementType });
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
        <h2>Fire Resistance Rating Check</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>
      <div className="card calc-section">
        <label className="field">Building Use<select className="input" value={buildingUse} onChange={(e) => setBuildingUse(e.target.value)}><option value="residential">Residential</option><option value="office">Office</option><option value="industrial">Industrial</option><option value="assembly">Assembly</option></select></label>
        <label className="field">Building Height (m)<input className="input" value={buildingHeight} onChange={(e) => setBuildingHeight(e.target.value)} /></label>
        <label className="field">Element Type<select className="input" value={elementType} onChange={(e) => setElementType(e.target.value)}><option value="wall">Wall</option><option value="door">Door</option><option value="slab">Slab</option><option value="beam">Beam</option></select></label>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <button className="primary-btn" disabled={loading} onClick={calculate}>{loading ? "Calculating..." : "Calculate & Save Report"}</button>
        {result && (
          <div className="result-box">
            <p><strong>Base Rating:</strong> {result.baseRating}</p>
            <p><strong>Element Factor:</strong> {result.elementFactor}x</p>
            <p><strong>Final Rating:</strong> {result.finalRating}</p>
            <p><strong>Recommendation:</strong> {result.recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
