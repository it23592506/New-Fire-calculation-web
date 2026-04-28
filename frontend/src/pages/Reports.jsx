import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [builder, setBuilder] = useState({
    templateName: "",
    logoUrl: "",
    approverName: "",
    signatureText: "",
    revisionNo: 1,
    clientName: ""
  });

  const typeLabels = {
    fire: "Fire Load",
    extinguisher: "Extinguisher",
    hydrant: "Hydrant",
    detection: "Detection",
    area: "Area",
    sprinkler: "Sprinkler Demand",
    water_tank: "Fire Water Tank",
    evacuation: "Evacuation Time"
  };

  const loadReports = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/reports");
      setReports(res.data);
      if (res.data?.length) {
        const first = res.data[0];
        setSelectedReportId(String(first._id));
        setBuilder({
          templateName: first.templateName || "",
          logoUrl: first.logoUrl || "",
          approverName: first.approverName || "",
          signatureText: first.signatureText || "",
          revisionNo: first.revisionNo || 1,
          clientName: first.clientName || ""
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const downloadPdf = async (id) => {
    const res = await api.get(`/reports/${id}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `fire-report-${id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadFullReport = async () => {
    setError("");
    try {
      const res = await api.get("/reports/full/pdf", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "full-fire-reports.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download full report");
    }
  };

  const sendEmail = async (id) => {
    setEmailStatus("");
    try {
      const res = await api.post(`/reports/${id}/email`);
      setEmailStatus(res.data.message || "Report emailed successfully");
    } catch (err) {
      setEmailStatus(err.response?.data?.message || "Failed to send report email");
    }
  };

  const deleteReport = async (id) => {
    const confirmed = window.confirm("Delete this saved report? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    setError("");
    setBusyId(id);
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((report) => report._id !== id));
      if (String(id) === selectedReportId) {
        setSelectedReportId("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete report");
    } finally {
      setBusyId(null);
    }
  };

  const syncBuilderFromReport = (id) => {
    const report = reports.find((entry) => String(entry._id) === String(id));
    if (!report) {
      return;
    }
    setBuilder({
      templateName: report.templateName || "",
      logoUrl: report.logoUrl || "",
      approverName: report.approverName || "",
      signatureText: report.signatureText || "",
      revisionNo: report.revisionNo || 1,
      clientName: report.clientName || ""
    });
  };

  const saveBuilder = async () => {
    if (!selectedReportId) {
      return;
    }
    setError("");
    try {
      const res = await api.patch(`/reports/${selectedReportId}/builder`, builder);
      setReports((prev) =>
        prev.map((report) =>
          report._id === res.data._id ? { ...report, ...res.data } : report
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save builder settings");
    }
  };

  return (
    <div className="page">
      <div className="topbar compact">
        <div>
          <h2>Saved Reports</h2>
          <p className="muted">Download, email, and manage fire safety reports from one place.</p>
        </div>
        <div className="actions">
          <button className="ghost-btn" onClick={loadReports}>Refresh</button>
          <button className="primary-btn" onClick={downloadFullReport}>Download Full Report</button>
          <Link className="ghost-btn action-link" to="/home">Back</Link>
        </div>
      </div>

      <div className="card">
        <div className="stats-grid report-kpis">
          <div className="stat-card">
            <p className="stat-label">Saved reports</p>
            <p className="stat-value">{loading ? "..." : reports.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Email status</p>
            <p className="stat-value" style={{ fontSize: 18 }}>{emailStatus ? "Sent" : "Idle"}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Source</p>
            <p className="stat-value" style={{ fontSize: 18 }}>History</p>
          </div>
        </div>

        {loading && <p className="muted">Loading reports...</p>}
        {error && <p className="error-text">{error}</p>}
        {emailStatus && <p className="muted">{emailStatus}</p>}
        {!loading && reports.length === 0 && (
          <p className="muted">No reports yet. Use Fire Calculations to generate and save one.</p>
        )}
        {reports.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Fire Load</th>
                  <th>Risk</th>
                  <th>Extinguishers</th>
                  <th>Hydrant LPM</th>
                  <th>Detectors</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td>{r.title}</td>
                    <td>{typeLabels[r.calculatorType] || r.calculatorType}</td>
                    <td>{r.fireLoad}</td>
                    <td>{r.riskCategory}</td>
                    <td>{r.extinguishers}</td>
                    <td>{r.hydrantFlowLpm}</td>
                    <td>{r.detectorCount}</td>
                    <td>
                      <button className="inline-btn" onClick={() => downloadPdf(r._id)}>PDF</button>
                      <button className="ghost-btn" onClick={() => sendEmail(r._id)}>Email</button>
                      <button
                        className="ghost-btn"
                        disabled={busyId === r._id}
                        onClick={() => deleteReport(r._id)}
                      >
                        {busyId === r._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Smart Report Builder</h3>
        <p className="muted">Customize template, logo, approvals, and revision data for client-ready exports.</p>
        <label className="field">
          Report
          <select
            className="input"
            value={selectedReportId}
            onChange={(e) => {
              setSelectedReportId(e.target.value);
              syncBuilderFromReport(e.target.value);
            }}
          >
            {reports.length === 0 && <option value="">No reports</option>}
            {reports.map((report) => (
              <option key={report._id} value={report._id}>
                {report.title}
              </option>
            ))}
          </select>
        </label>
        <div className="stats-grid">
          <input
            className="input"
            placeholder="Template name"
            value={builder.templateName}
            onChange={(e) => setBuilder((prev) => ({ ...prev, templateName: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Client name"
            value={builder.clientName}
            onChange={(e) => setBuilder((prev) => ({ ...prev, clientName: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Logo URL"
            value={builder.logoUrl}
            onChange={(e) => setBuilder((prev) => ({ ...prev, logoUrl: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Approver name"
            value={builder.approverName}
            onChange={(e) => setBuilder((prev) => ({ ...prev, approverName: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Signature text"
            value={builder.signatureText}
            onChange={(e) => setBuilder((prev) => ({ ...prev, signatureText: e.target.value }))}
          />
          <input
            className="input"
            type="number"
            min="1"
            placeholder="Revision"
            value={builder.revisionNo}
            onChange={(e) =>
              setBuilder((prev) => ({ ...prev, revisionNo: Number(e.target.value) || 1 }))
            }
          />
        </div>
        <div className="actions">
          <button className="primary-btn" type="button" disabled={!selectedReportId} onClick={saveBuilder}>
            Save Builder Settings
          </button>
        </div>
      </div>
    </div>
  );
}
