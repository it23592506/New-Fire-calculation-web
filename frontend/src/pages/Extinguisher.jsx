import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

export default function Extinguisher() {
  const [area, setArea] = useState("");
  const [hazard, setHazard] = useState("low");
  const [feType, setFeType] = useState("water");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const feTypeLabel = (type) => {
    const labels = {
      water: "Water FE",
      foam: "Foam FE",
      dry_powder: "Dry Powder FE",
      co2: "CO2 FE",
      wet_chemical: "Wet Chemical FE"
    };

    return labels[type] || "Water FE";
  };

  const feTypeUnit = (type) => {
    const liquidTypes = new Set(["water", "foam", "wet_chemical"]);
    return liquidTypes.has(type) ? "L" : "kg";
  };

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const a = parseFloat(area);
    if (!a || a <= 0) {
      setError("Please enter a valid area");
      setLoading(false);
      return;
    }

    const coverageMap = { low: 280, moderate: 140, high: 90 };
    const coverage = coverageMap[hazard];
    const count = Math.max(1, Math.ceil(a / coverage));
    const travelDistance = hazard === "high" ? 9 : hazard === "moderate" ? 15 : 23;
    const riskCategory = hazard === "high" ? "High" : hazard === "moderate" ? "Medium" : "Low";

    setResult({
      count,
      coverage,
      travelDistance,
      feType: feTypeLabel(feType),
      unit: feTypeUnit(feType)
    });

    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        return;
      }

      const res = await api.post("/calculate/custom", {
        calculatorType: "extinguisher",
        title: `Extinguisher Report (${riskCategory})`,
        extinguisherType: feType,
        area: a,
        hazard,
        feType
      });
      const data = res.data.metrics || res.data;
      setResult({
        count: data.extinguishers ?? count,
        coverage: data.coverage ?? coverage,
        travelDistance: data.travelDistance ?? travelDistance,
        feType: feTypeLabel(data.feType || feType),
        unit: data.unit || feTypeUnit(feType)
      });
    } catch (err) {
      const message = err.response?.data?.message || "Calculation saved failed";
      if (message.includes("13 values for 14 columns")) {
        setError("Save failed: backend schema mismatch detected. Restart backend server and try again.");
      } else {
        setNotice(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact">
        <h2>🧯 Fire Extinguisher</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>

      <div className="card calc-section">
        <h4>Number of Extinguishers & Coverage</h4>
        <label className="field">
          Floor Area (m²)
          <input className="input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 500" />
        </label>
        <label className="field">
          Hazard Level
          <select className="input" value={hazard} onChange={(e) => setHazard(e.target.value)}>
            <option value="low">Low Hazard</option>
            <option value="moderate">Moderate Hazard</option>
            <option value="high">High Hazard</option>
          </select>
        </label>
        <label className="field">
          Fire Extinguisher Type
          <select className="input" value={feType} onChange={(e) => setFeType(e.target.value)}>
            <option value="water">Water FE (L)</option>
            <option value="foam">Foam FE (L)</option>
            <option value="dry_powder">Dry Powder FE (kg)</option>
            <option value="co2">CO2 FE (kg)</option>
            <option value="wet_chemical">Wet Chemical FE (L)</option>
          </select>
        </label>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}

        <button className="primary-btn" disabled={loading} onClick={calculate}>
          {loading ? "Calculating..." : "Calculate & Save Report"}
        </button>

        {result && (
          <div className="result-box">
            <p><strong>FE type:</strong> {result.feType}</p>
            <p><strong>Unit:</strong> {result.unit}</p>
            <p><strong>Extinguishers required:</strong> {result.count}</p>
            <p><strong>Coverage per unit:</strong> {result.coverage} m²</p>
            <p><strong>Max travel distance:</strong> {result.travelDistance} m</p>
          </div>
        )}
      </div>
    </div>
  );
}
