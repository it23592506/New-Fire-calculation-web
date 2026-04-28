import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Integrations() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [reports, setReports] = useState([]);
  const [reportId, setReportId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/reports");
        setReports(res.data || []);
        if (res.data?.length) {
          setReportId(String(res.data[0]._id));
        }
      } catch (_err) {
        setStatus("Failed to load reports for integration exports");
      }
    };
    load();
  }, []);

  const testWebhook = async () => {
    setStatus("");
    try {
      const res = await api.post("/integrations/webhook/test", { webhookUrl });
      setStatus(res.data.message || "Webhook test sent");
    } catch (err) {
      setStatus(err.response?.data?.message || "Webhook test failed");
    }
  };

  const exportPackage = async () => {
    setStatus("");
    try {
      const res = await api.get(`/integrations/export/${reportId}`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `report-export-${reportId}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Export package downloaded");
    } catch (err) {
      setStatus(err.response?.data?.message || "Failed to export package");
    }
  };

  return (
    <div className="page">
      <div className="topbar compact">
        <div>
          <h2>Integrations</h2>
          <p className="muted">Connect webhooks and export report packages for external workflows.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">Back Home</Link>
      </div>

      <div className="card">
        <h3>Webhook Test (Slack/Teams/Automation)</h3>
        <input
          className="input"
          placeholder="https://your-webhook-url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />
        <button className="primary-btn" type="button" onClick={testWebhook}>Send Test Event</button>
      </div>

      <div className="card">
        <h3>Export Integration Package</h3>
        <select className="input" value={reportId} onChange={(e) => setReportId(e.target.value)}>
          {reports.length === 0 && <option value="">No reports available</option>}
          {reports.map((report) => (
            <option key={report._id} value={report._id}>{report.title}</option>
          ))}
        </select>
        <button className="ghost-btn" type="button" disabled={!reportId} onClick={exportPackage}>Download JSON Package</button>
      </div>

      {status && <p className="muted">{status}</p>}
    </div>
  );
}
