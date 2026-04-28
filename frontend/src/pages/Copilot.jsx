import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Copilot() {
  const [reports, setReports] = useState([]);
  const [reportId, setReportId] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await api.get("/reports");
        setReports(res.data || []);
        if (res.data?.length) {
          setReportId(String(res.data[0]._id));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load reports");
      }
    };

    loadReports();
  }, []);

  const getAdvice = async () => {
    if (!reportId) {
      setError("Select a report first");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/copilot/advice", {
        reportId: Number(reportId),
        question
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate copilot advice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="topbar compact">
        <div>
          <h2>AI Safety Copilot</h2>
          <p className="muted">Explain calculations, get code-compliant recommendations, and plan next actions.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">
          Back Home
        </Link>
      </div>

      <div className="card">
        <label className="field">
          Report
          <select className="input" value={reportId} onChange={(e) => setReportId(e.target.value)}>
            {reports.length === 0 && <option value="">No reports available</option>}
            {reports.map((report) => (
              <option key={report._id} value={report._id}>
                {report.title} ({report.riskCategory})
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Ask Copilot
          <input
            className="input"
            placeholder="Example: What should I fix first for compliance readiness?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>

        <div className="actions">
          <button className="primary-btn" type="button" disabled={loading} onClick={getAdvice}>
            {loading ? "Generating..." : "Generate Advice"}
          </button>
          <Link className="ghost-btn action-link" to="/reports">
            Open Reports
          </Link>
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>

      {result && (
        <div className="card">
          <h3>{result.reportTitle}</h3>
          <p className="muted">Risk: {result.riskCategory}</p>

          <h4>Posture</h4>
          <p>{result.advice.posture}</p>

          <h4>Explanation</h4>
          <p>{result.advice.explanation}</p>

          <h4>Code-compliant recommendations</h4>
          <ul className="result-list">
            {result.advice.codeComplianceRecommendations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <h4>Next actions</h4>
          <ol className="result-list">
            {result.advice.nextActions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
