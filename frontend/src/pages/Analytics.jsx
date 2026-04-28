import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const res = await api.get("/analytics/overview");
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics");
    }
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="page">
      <div className="topbar compact">
        <div>
          <h2>Real-Time Dashboard Analytics</h2>
          <p className="muted">Report trends, compliance posture, and recent activity updates.</p>
        </div>
        <div className="actions">
          <button className="ghost-btn" onClick={load}>Refresh</button>
          <Link className="ghost-btn action-link" to="/home">Back Home</Link>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!data && !error && <p className="muted">Loading analytics...</p>}

      {data && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Total reports</p>
              <p className="stat-value">{data.reports.total}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Avg fire load</p>
              <p className="stat-value">{data.reports.averageFireLoad}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Compliance checklists</p>
              <p className="stat-value">{data.compliance.total}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Activity (7d)</p>
              <p className="stat-value">{data.activity.last7Days}</p>
            </div>
          </div>

          <div className="card">
            <h3>Risk Distribution</h3>
            <ul className="result-list">
              {Object.entries(data.reports.riskCounts).map(([risk, count]) => (
                <li key={risk}>{risk}: {count}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Compliance Status</h3>
            <ul className="result-list">
              {Object.entries(data.compliance.statusCounts).map(([status, count]) => (
                <li key={status}>{status}: {count}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Recent Activity</h3>
            {data.activity.recent.length === 0 ? (
              <p className="muted">No recent logs yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.activity.recent.map((entry) => (
                      <tr key={entry._id}>
                        <td>{entry.action}</td>
                        <td>{entry.entityType}</td>
                        <td>{new Date(entry.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
