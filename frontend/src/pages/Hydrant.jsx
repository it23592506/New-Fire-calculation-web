import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Hydrant() {
  const [area, setArea] = useState("");
  const [stories, setStories] = useState("1");
  const [occupancy, setOccupancy] = useState("commercial");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setLoading(true);
    const a = parseFloat(area);
    const s = parseInt(stories, 10);
    if (!a || a <= 0 || !s || s <= 0) {
      setError("Please enter valid area and stories");
      setLoading(false);
      return;
    }

    const baseFlow = occupancy === "industrial" ? 5.5 : occupancy === "storage" ? 6.5 : 4.5;
    const maxFlow = occupancy === "industrial" ? 3800 : 2500;
    const calculatedFlow = Math.ceil((a * baseFlow) / 10) * 10;
    const flowRate = Math.min(maxFlow, calculatedFlow);
    const staticHead = 10 + s * 3.5;
    const head = staticHead * 1.2;
    const pumpPower = ((flowRate / 60) * head * 9.81) / (1000 * 0.7);
    const duration = occupancy === "storage" ? 4 : occupancy === "industrial" ? 3 : 2;
    const waterDemand = flowRate * 60 * duration;

    try {
      const res = await api.post("/calculate/custom", {
        calculatorType: "hydrant",
        title: `Hydrant System Report (${occupancy})`,
        area: a,
        stories: s,
        occupancy
      });
      const data = res.data.metrics || res.data;
      setResult({
        flowRate: data.flowRate ?? flowRate,
        head: (data.head ?? head).toFixed ? (data.head ?? head).toFixed(1) : Number(data.head ?? head).toFixed(1),
        pumpPower: (data.pumpPower ?? pumpPower).toFixed ? (data.pumpPower ?? pumpPower).toFixed(2) : Number(data.pumpPower ?? pumpPower).toFixed(2),
        waterDemand: data.waterDemand ?? (waterDemand / 1000).toFixed(1),
        maxFlow
      });
    } catch (err) {
      setError(err.response?.data?.message || "Calculation saved failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact">
        <h2>🚒 Hydrant System</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>

      <div className="card calc-section">
        <h4>Flow Rate, Pump Power & Water Demand</h4>
        <label className="field">
          Floor Area (m²)
          <input className="input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 2000" />
        </label>
        <label className="field">
          Number of Stories
          <input className="input" value={stories} onChange={(e) => setStories(e.target.value)} placeholder="e.g. 3" />
        </label>
        <label className="field">
          Occupancy Type
          <select className="input" value={occupancy} onChange={(e) => setOccupancy(e.target.value)}>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="storage">Storage / Warehouse</option>
          </select>
        </label>
        <p className="muted">
          Flow output is capped by occupancy class, and pump head includes a friction-loss buffer to better
          reflect real pipe runs.
        </p>
        {error && <p className="error-text">{error}</p>}

        <button className="primary-btn" disabled={loading} onClick={calculate}>
          {loading ? "Calculating..." : "Calculate & Save Report"}
        </button>

        {result && (
          <div className="result-box">
            <p><strong>Flow Rate:</strong> {result.flowRate} LPM</p>
            <p><strong>Maximum Allowed Flow:</strong> {result.maxFlow} LPM</p>
            <p><strong>Total Head:</strong> {result.head} m</p>
            <p><strong>Pump Power (approx):</strong> {result.pumpPower} kW</p>
            <p><strong>Water Demand:</strong> {result.waterDemand} kL</p>
          </div>
        )}
      </div>
    </div>
  );
}
