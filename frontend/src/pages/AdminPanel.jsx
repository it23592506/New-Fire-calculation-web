import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAdmin } from "../services/auth";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!isAdmin()) {
    return <Navigate to="/home" replace />;
  }

  const loadData = async () => {
    setError("");
    setLoading(true);
    try {
      const [usersRes, reportsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/reports")
      ]);
      setUsers(usersRes.data);
      setReports(reportsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page">
      <div className="topbar compact">
        <h2>Admin Panel</h2>
        <div className="actions">
          <button className="ghost-btn" onClick={loadData}>Refresh</button>
          <Link className="ghost-btn action-link" to="/home">Back</Link>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <h3>All Users</h3>
        {loading ? (
          <p className="muted">Loading users...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user._id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{new Date(user.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>All Reports</h3>
        {loading ? (
          <p className="muted">Loading reports...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Title</th>
                  <th>Fire Load</th>
                  <th>Risk</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id}>
                    <td>{report._id}</td>
                    <td>{report.userEmail}</td>
                    <td>{report.title}</td>
                    <td>{report.fireLoad}</td>
                    <td>{report.riskCategory}</td>
                    <td>{new Date(report.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
