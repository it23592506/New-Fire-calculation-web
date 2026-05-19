import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";
import { computeQuantity } from "../services/extinguishers";

const TYPE_CONFIG = {
  Water: { label: "Water FE (L)", capacities: ["6L", "9L"] },
  Foam: { label: "Foam FE (L)", capacities: ["6L", "9L"] },
  "ABC Powder": { label: "Dry Powder FE (kg)", capacities: ["1kg", "2kg", "4kg", "6kg", "9kg"] },
  CO2: { label: "CO2 FE (kg)", capacities: ["2kg", "5kg"] },
  "Wet Chemical": { label: "Wet Chemical FE (L)", capacities: ["3L", "6L"] },
  "Clean Agent": { label: "Clean Agent FE (kg)", capacities: ["2kg", "4kg", "6kg"] },
};

const HAZARD_OPTIONS = ["Office", "Warehouse", "Kitchen", "Electrical Room", "Fuel Storage", "Server Room"];

const HAZARD_RECOMMENDED = {
  Office: "ABC Powder + CO2",
  Warehouse: "ABC Powder",
  Kitchen: "Wet Chemical",
  "Electrical Room": "CO2 / Clean Agent",
  "Fuel Storage": "Foam",
  "Server Room": "CO2 / Clean Agent",
};

export default function Extinguisher() {
  const [area, setArea] = useState("");
  const [hazard, setHazard] = useState("Office");
  const [feType, setFeType] = useState("Water");
  const [capacity, setCapacity] = useState("6L");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const onTypeChange = (nextType) => {
    setFeType(nextType);
    const caps = TYPE_CONFIG[nextType]?.capacities || [];
    setCapacity(caps[0] || "");
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

    if (!capacity) {
      setError("Please select extinguisher capacity");
      setLoading(false);
      return;
    }

    const local = computeQuantity(a, feType, capacity, hazard);
    setResult({
      count: local.quantity,
      coverage: local.coverage,
      travelDistance: local.travelDistanceLimit,
      feType,
      capacity,
      status: local.status,
      messages: local.messages,
      recommendation: local.recommendation?.recommendedTypes?.join(" + ") || HAZARD_RECOMMENDED[hazard],
    });

    try {
      const calcRes = await api.post("/extinguishers/calc", {
        area: a,
        type: feType,
        capacity,
        hazard,
      });
      const calcData = calcRes.data;
      setResult((prev) => ({
        ...prev,
        count: calcData.quantity,
        coverage: calcData.coverage,
        travelDistance: calcData.travelDistanceLimit,
        status: calcData.status,
        messages: calcData.messages,
        recommendation: calcData.recommendation?.recommendedTypes?.join(" + ") || prev?.recommendation,
      }));

      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        return;
      }

      const res = await api.post("/calculate/custom", {
        calculatorType: "extinguisher",
        title: `Extinguisher Report (${hazard})`,
        extinguisherType: feType,
        area: a,
        hazard,
        feType,
        capacity,
      });
      const data = res.data.metrics || res.data;
      setResult((prev) => ({
        ...prev,
        count: data.extinguishers ?? prev.count,
        coverage: data.coverage ?? prev.coverage,
        travelDistance: data.travelDistance ?? prev.travelDistance,
      }));
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
          Hazard / Area Type
          <select className="input" value={hazard} onChange={(e) => setHazard(e.target.value)}>
            {HAZARD_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Fire Extinguisher Type
          <select className="input" value={feType} onChange={(e) => onTypeChange(e.target.value)}>
            {Object.keys(TYPE_CONFIG).map((type) => (
              <option key={type} value={type}>{TYPE_CONFIG[type].label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Capacity
          <select className="input" value={capacity} onChange={(e) => setCapacity(e.target.value)}>
            {(TYPE_CONFIG[feType]?.capacities || []).map((cap) => (
              <option key={cap} value={cap}>{cap}</option>
            ))}
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
            <p><strong>Capacity:</strong> {result.capacity}</p>
            <p><strong>Extinguishers required:</strong> {result.count}</p>
            <p><strong>Coverage per unit:</strong> {result.coverage} m²</p>
            <p><strong>Max travel distance:</strong> {result.travelDistance} m</p>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Recommended for {hazard}:</strong> {result.recommendation}</p>
            {Array.isArray(result.messages) && result.messages.length > 0 && (
              <div>
                <strong>Validation notes:</strong>
                <ul>
                  {result.messages.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
