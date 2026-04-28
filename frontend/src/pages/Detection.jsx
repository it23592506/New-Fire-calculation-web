import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Detection() {
  const [area, setArea] = useState("");
  const [height, setHeight] = useState("");
  const [detectorType, setDetectorType] = useState("smoke");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setLoading(true);
    const a = parseFloat(area);
    const h = parseFloat(height);
    if (!a || a <= 0) {
      setError("Please enter a valid area");
      setLoading(false);
      return;
    }

    const spacingMap = {
      smoke: { coverage: 75, spacing: 9 },
      heat: { coverage: 37, spacing: 6.3 },
      beam: { coverage: 1000, spacing: 30 }
    };

    let config = spacingMap[detectorType];
    if (detectorType === "smoke" && h > 4) {
      config = { coverage: 60, spacing: 8 };
    }

    const count = Math.max(2, Math.ceil(a / config.coverage));

    try {
      const res = await api.post("/calculate/custom", {
        calculatorType: "detection",
        title: `Detection System Report (${detectorType})`,
        area: a,
        height: h,
        detectorType
      });
      const data = res.data.metrics || res.data;
      setResult({
        count: data.detectorCount ?? count,
        coverage: data.coverage ?? config.coverage,
        spacing: data.spacing ?? config.spacing,
        type: data.type || detectorType
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
        <h2>🚨 Detection System</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>

      <div className="card calc-section">
        <h4>Smoke / Heat Detectors & Spacing</h4>
        <label className="field">
          Protected Area (m²)
          <input className="input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 600" />
        </label>
        <label className="field">
          Ceiling Height (m)
          <input className="input" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 3" />
        </label>
        <label className="field">
          Detector Type
          <select className="input" value={detectorType} onChange={(e) => setDetectorType(e.target.value)}>
            <option value="smoke">Smoke Detector</option>
            <option value="heat">Heat Detector</option>
            <option value="beam">Beam Detector</option>
          </select>
        </label>
        {error && <p className="error-text">{error}</p>}

        <button className="primary-btn" disabled={loading} onClick={calculate}>
          {loading ? "Calculating..." : "Calculate & Save Report"}
        </button>

        {result && (
          <div className="result-box">
            <p><strong>Detector Type:</strong> {result.type}</p>
            <p><strong>Detectors required:</strong> {result.count}</p>
            <p><strong>Coverage per detector:</strong> {result.coverage} m²</p>
            <p><strong>Max spacing:</strong> {result.spacing} m</p>
          </div>
        )}
      </div>
    </div>
  );
}
