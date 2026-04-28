import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function ScenarioSimulator() {
  const [area, setArea] = useState(1000);
  const [weight, setWeight] = useState(2200);
  const [cv, setCv] = useState(4200);

  const metrics = useMemo(() => {
    const fireLoad = area > 0 ? (weight * cv) / area : 0;
    const extinguishers = Math.max(1, Math.ceil(area / 200));
    const hydrantFlowLpm = Math.round(area * 0.35);
    const detectorCount = Math.max(1, Math.ceil(area / 85));

    let riskCategory = "Low";
    if (fireLoad > 500) riskCategory = "Medium";
    if (fireLoad > 1200) riskCategory = "High";
    if (fireLoad > 2200) riskCategory = "Critical";

    return { fireLoad, extinguishers, hydrantFlowLpm, detectorCount, riskCategory };
  }, [area, weight, cv]);

  const growthData = useMemo(() => {
    const labels = Array.from({ length: 11 }, (_, i) => `${i}`);
    const values = labels.map((_, i) => {
      const normalized = i / 10;
      return Number((metrics.fireLoad * Math.pow(normalized, 2)).toFixed(2));
    });

    return {
      labels,
      datasets: [
        {
          label: "What-if fire growth index",
          data: values,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          fill: true,
          tension: 0.3
        }
      ]
    };
  }, [metrics.fireLoad]);

  return (
    <div className="page">
      <div className="topbar compact">
        <div>
          <h2>Scenario Simulator</h2>
          <p className="muted">What-if mode for fire load, hydrant, and detection planning with live chart updates.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">
          Back Home
        </Link>
      </div>

      <div className="card">
        <h3>Scenario Inputs</h3>
        <label className="field">
          Area: {area} m2
          <input className="input" type="range" min="100" max="5000" step="50" value={area} onChange={(e) => setArea(Number(e.target.value))} />
        </label>
        <label className="field">
          Combustible Weight: {weight} kg
          <input className="input" type="range" min="100" max="10000" step="100" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
        </label>
        <label className="field">
          Calorific Value: {cv} kcal/kg
          <input className="input" type="range" min="1000" max="7000" step="100" value={cv} onChange={(e) => setCv(Number(e.target.value))} />
        </label>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Fire load</p>
          <p className="stat-value">{metrics.fireLoad.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Extinguishers</p>
          <p className="stat-value">{metrics.extinguishers}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Hydrant flow (LPM)</p>
          <p className="stat-value">{metrics.hydrantFlowLpm}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Detectors</p>
          <p className="stat-value">{metrics.detectorCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Risk</p>
          <p className="stat-value">{metrics.riskCategory}</p>
        </div>
      </div>

      <div className="card">
        <h3>Live Risk Curve</h3>
        <div className="chart-wrap">
          <Line data={growthData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}
