import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const statusOptions = ["pending", "pass", "fail", "na"];

export default function Compliance() {
  const [templates, setTemplates] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTemplates = async () => {
    const res = await api.get("/compliance/templates");
    setTemplates(res.data || []);
    if (res.data?.length && !selectedTemplateId) {
      setSelectedTemplateId(res.data[0].id);
    }
  };

  const loadChecklists = async () => {
    const res = await api.get("/compliance/checklists");
    setChecklists(res.data || []);
    if (res.data?.length && !selectedChecklistId) {
      setSelectedChecklistId(String(res.data[0]._id));
    }
  };

  const loadChecklistDetails = async (id) => {
    if (!id) {
      setDetails(null);
      return;
    }
    const res = await api.get(`/compliance/checklists/${id}`);
    setDetails(res.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setError("");
        await Promise.all([loadTemplates(), loadChecklists()]);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load compliance data");
      }
    };

    init();
  }, []);

  useEffect(() => {
    loadChecklistDetails(selectedChecklistId).catch((err) => {
      setError(err.response?.data?.message || "Failed to load checklist details");
    });
  }, [selectedChecklistId]);

  const createChecklist = async () => {
    if (!selectedTemplateId) {
      return;
    }
    setError("");
    setLoading(true);
    try {
      const created = await api.post("/compliance/checklists", {
        templateId: selectedTemplateId
      });
      await loadChecklists();
      setSelectedChecklistId(String(created.data._id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create checklist");
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId, status, notes) => {
    setError("");
    try {
      const res = await api.patch(`/compliance/checklists/${selectedChecklistId}/items/${itemId}`, {
        status,
        notes
      });
      setDetails((prev) => ({ ...prev, items: res.data.items }));
      await loadChecklists();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update checklist item");
    }
  };

  return (
    <div className="page">
      <div className="topbar compact">
        <div>
          <h2>Compliance Checklist Engine</h2>
          <p className="muted">Build code-based checklists, score pass/fail, and highlight compliance gaps.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">
          Back Home
        </Link>
      </div>

      <div className="card">
        <h3>Create From Template</h3>
        <div className="actions">
          <select
            className="input"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            {templates.length === 0 && <option value="">No templates</option>}
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.standardCode})
              </option>
            ))}
          </select>
          <button className="primary-btn" type="button" disabled={loading} onClick={createChecklist}>
            Create Checklist
          </button>
          <button className="ghost-btn" type="button" onClick={loadChecklists}>
            Refresh
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="card">
        <h3>Existing Checklists</h3>
        <select
          className="input"
          value={selectedChecklistId}
          onChange={(e) => setSelectedChecklistId(e.target.value)}
        >
          {checklists.length === 0 && <option value="">No checklists available</option>}
          {checklists.map((checklist) => (
            <option key={checklist._id} value={checklist._id}>
              {checklist.name} - {checklist.status}
            </option>
          ))}
        </select>
      </div>

      {details && (
        <div className="card">
          <h3>{details.checklist.name}</h3>
          <p className="muted">
            {details.checklist.standardCode || "Standard"} | {details.checklist.country || "Country not set"}
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Clause</th>
                  <th>Requirement</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {details.items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.clause || "-"}</td>
                    <td>{item.requirement}</td>
                    <td>
                      <select
                        className="input"
                        value={item.status}
                        onChange={(e) => updateItem(item._id, e.target.value, item.notes || "")}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input"
                        value={item.notes || ""}
                        onChange={(e) => {
                          setDetails((prev) => ({
                            ...prev,
                            items: prev.items.map((entry) =>
                              entry._id === item._id ? { ...entry, notes: e.target.value } : entry
                            )
                          }));
                        }}
                      />
                    </td>
                    <td>
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => updateItem(item._id, item.status, item.notes || "")}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
