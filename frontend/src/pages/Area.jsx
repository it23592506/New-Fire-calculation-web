import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAuthenticated } from "../services/auth";

export default function Area() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [openings, setOpenings] = useState("");
  const [openingHeight, setOpeningHeight] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const o = parseFloat(openings) || 0;
    const oh = parseFloat(openingHeight) || 0;
    if (!l || !w || !h || l <= 0 || w <= 0 || h <= 0) {
      setError("Please enter valid dimensions");
      setLoading(false);
      return;
    }

    const floorArea = l * w;
    const volume = floorArea * h;
    const ventFactor = o > 0 && oh > 0 ? (o * Math.sqrt(oh)).toFixed(2) : "N/A";
    const airChanges = o > 0 && oh > 0 ? ((o * Math.sqrt(oh) * 3600) / volume).toFixed(1) : "N/A";
    const airChangesValue = o > 0 && oh > 0 ? Number(airChanges) : 0;
    const localRiskCategory = airChangesValue === 0 ? "High" : airChangesValue >= 10 ? "Low" : airChangesValue >= 5 ? "Medium" : "High";

    if (o < 0 || oh < 0) {
      setError("Opening values cannot be negative");
      setLoading(false);
      return;
    }
    if (airChangesValue > 100) {
      setNotice("Warning: Air changes per hour appears unrealistic (>100).");
    }

    setResult({
      floorArea: Number(floorArea.toFixed(2)),
      volume: Number(volume.toFixed(2)),
      ventFactor,
      airChanges,
      riskCategory: localRiskCategory,
      fireLoad: Number((floorArea / h).toFixed(2)),
      extinguishers: Math.max(1, Math.ceil(floorArea / 120)),
      hydrantFlowLpm: Math.ceil((floorArea * 4.5) / 10) * 10,
      detectorCount: Math.max(2, Math.ceil(floorArea / 90))
    });

    try {
      if (!isAuthenticated()) {
        setNotice("Calculated locally. Sign in to save this report.");
        return;
      }

      const res = await api.post("/calculate/custom", {
        calculatorType: "area",
        title: "Area Calculations Report",
        length: l,
        width: w,
        height: h,
        openings: o,
        openingHeight: oh
      });

      const data = res.data.metrics || res.data;
      setResult({
        floorArea: data.floorArea ?? Number(floorArea.toFixed(2)),
        volume: data.volume ?? Number(volume.toFixed(2)),
        ventFactor: data.ventFactor ?? ventFactor,
        airChanges: data.airChanges ?? airChanges,
        riskCategory: data.riskCategory,
        fireLoad: data.fireLoad,
        extinguishers: data.extinguishers,
        hydrantFlowLpm: data.hydrantFlowLpm,
        detectorCount: data.detectorCount
      });
    } catch (err) {
      setNotice(err.response?.data?.message || "Calculated locally, but saving failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page narrow" style={{ position: "relative", zIndex: 2 }}>
      <div className="topbar compact">
        <h2>Area Calculations</h2>
        <Link className="ghost-btn action-link" to="/home">Back</Link>
      </div>

      <section className="card calc-section" style={{ display: "block", visibility: "visible" }}>
        <h4>Floor Area, Volume and Ventilation</h4>
        <label className="field">
          Length (m)
          <input className="input" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 20" />
        </label>
        <label className="field">
          Width (m)
          <input className="input" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 15" />
        </label>
        <label className="field">
          Height (m)
          <input className="input" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 4" />
        </label>
        <label className="field">
          Total Opening Area (m2) optional
          <input className="input" value={openings} onChange={(e) => setOpenings(e.target.value)} placeholder="e.g. 8" />
        </label>
        <label className="field">
          Opening Height (m) optional
          <input
            className="input"
            value={openingHeight}
            onChange={(e) => setOpeningHeight(e.target.value)}
            placeholder="e.g. 2.4"
          />
        </label>
        <p className="muted">Ventilation factor uses Aw*sqrt(Hw).</p>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}

        <button className="primary-btn" disabled={loading} onClick={calculate}>
          {loading ? "Calculating..." : "Calculate and Save Report"}
        </button>

        {result && (
          <div className="result-box">
            <p><strong>Floor Area:</strong> {result.floorArea} m2</p>
            <p><strong>Volume:</strong> {result.volume} m3</p>
            <p><strong>Ventilation Factor:</strong> {result.ventFactor}</p>
            <p><strong>Air Changes per hour:</strong> {result.airChanges}</p>
          </div>
        )}
      </section>
    </main>
  );
}
