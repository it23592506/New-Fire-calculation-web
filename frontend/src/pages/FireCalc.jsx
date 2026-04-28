import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import api from "../services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function FireCalc() {
  const [title, setTitle] = useState("Factory Shed Report");
  const [area, setArea] = useState("");
  const [weight, setWeight] = useState("");
  const [cv, setCv] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const growthData = result
    ? (() => {
        const points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((minute) => {
          const normalized = minute / 10;
          return Number((result.fireLoad * Math.pow(normalized, 2)).toFixed(2));
        });

        return {
          labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          datasets: [
            {
              label: "Estimated Fire Growth Index",
              data: points,
              borderColor: "#ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.16)",
              fill: true,
              tension: 0.25
            }
          ]
        };
      })()
    : null;

  const calculate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/calculate", { title, area, weight, cv });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <div className="topbar compact">
        <h2>Advanced Fire Calculation</h2>
        <Link className="ghost-btn action-link" to="/home">
          Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <label className="field">
          Report Title
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Report title"
          />
        </label>
        <label className="field">
          Area (m²)
          <input
            className="input"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. 1200"
          />
        </label>
        <label className="field">
          Combustible Weight (kg)
          <input
            className="input"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 3600"
          />
        </label>
        <label className="field">
          Calorific Value (kcal/kg)
          <input
            className="input"
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            placeholder="e.g. 4200"
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="actions">
          <button className="primary-btn" disabled={loading} onClick={calculate}>
            {loading ? "Calculating..." : "Calculate & Save"}
          </button>
          {result && (
            <button className="ghost-btn" onClick={() => navigate("/home")}>
              View All Reports
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="card">
          <h3>Calculated Results</h3>
          <ul className="result-list">
            <li>Fire Load: {result.fireLoad}</li>
            <li>Risk Category: {result.riskCategory}</li>
          </ul>

          <p className="muted">
            Equipment sizing is handled in the dedicated extinguisher, hydrant, and detection modules so the
            core fire-load screen stays focused on the principal energy-density calculation.
          </p>

          <h4 className="chart-title">Fire Growth (0 to 10 minutes)</h4>
          <div className="chart-wrap">
            {growthData && (
              <Line
                data={growthData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true }
                  },
                  scales: {
                    x: { title: { display: true, text: "Time (min)" } },
                    y: { title: { display: true, text: "Growth Index" }, beginAtZero: true }
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
