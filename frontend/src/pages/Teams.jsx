import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const roleOptions = ["engineer", "reviewer", "admin"];

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [members, setMembers] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTeams = async () => {
    try {
      const res = await api.get("/teams");
      setTeams(res.data || []);
      if (res.data?.length && !selectedTeamId) {
        setSelectedTeamId(String(res.data[0]._id));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teams");
    }
  };

  const loadMembers = async (teamId) => {
    if (!teamId) {
      setMembers([]);
      return;
    }

    try {
      const res = await api.get(`/teams/${teamId}/members`);
      setMembers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load team members");
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    loadMembers(selectedTeamId);
  }, [selectedTeamId]);

  const createTeam = async () => {
    if (!teamName.trim()) {
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.post("/teams", { name: teamName.trim() });
      const nextTeams = [res.data, ...teams];
      setTeams(nextTeams);
      setTeamName("");
      setSelectedTeamId(String(res.data._id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!selectedTeamId || !inviteEmail.trim()) {
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.post(`/teams/${selectedTeamId}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      setMembers(res.data || []);
      setInviteEmail("");
      setInviteRole("engineer");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add team member");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, role) => {
    setError("");
    try {
      const res = await api.patch(`/teams/${selectedTeamId}/members/${userId}`, { role });
      setMembers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  const removeMember = async (userId) => {
    setError("");
    try {
      const res = await api.delete(`/teams/${selectedTeamId}/members/${userId}`);
      setMembers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
    }
  };

  return (
    <div className="page">
      <div className="topbar compact">
        <div>
          <h2>Team Workspace + Roles</h2>
          <p className="muted">Create company teams, invite members, and assign Engineer/Reviewer/Admin roles.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">
          Back Home
        </Link>
      </div>

      <div className="card">
        <h3>Create Team</h3>
        <div className="actions">
          <input
            className="input"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <button className="primary-btn" type="button" disabled={loading} onClick={createTeam}>
            Create Team
          </button>
          <button className="ghost-btn" type="button" onClick={loadTeams}>
            Refresh
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="card">
        <h3>Teams</h3>
        <label className="field">
          Select team
          <select
            className="input"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
          >
            {teams.length === 0 && <option value="">No teams yet</option>}
            {teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card">
        <h3>Invite Member</h3>
        <div className="actions">
          <input
            className="input"
            placeholder="user@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button className="primary-btn" type="button" disabled={loading || !selectedTeamId} onClick={addMember}>
            Invite
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Members</h3>
        {members.length === 0 ? (
          <p className="muted">No members yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId}>
                    <td>{member.userName || "-"}</td>
                    <td>{member.userEmail || "-"}</td>
                    <td>{member.role}</td>
                    <td>
                      <div className="actions">
                        <select
                          className="input"
                          value={member.role}
                          onChange={(e) => updateRole(member.userId, e.target.value)}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button className="ghost-btn" type="button" onClick={() => removeMember(member.userId)}>
                          Remove
                        </button>
                      </div>
                    </td>
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
