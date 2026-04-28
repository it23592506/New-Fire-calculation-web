import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Badges() {
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("my-badges");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [badgesRes, leaderboardRes, defsRes] = await Promise.all([
        api.get("/badges"),
        api.get("/badges/leaderboard"),
        api.get("/badges/definitions")
      ]);
      setBadges(badgesRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
      setDefinitions(defsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load badges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const earnedBadgeTypes = new Set(badges.map((b) => b.badgeType));

  return (
    <div className="page">
      <div className="topbar compact">
        <div>
          <h2>Badge-Based Learning System</h2>
          <p className="muted">Earn achievements, compete on leaderboard, download certificates.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">
          Back Home
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="actions">
          <button
            className={tab === "my-badges" ? "primary-btn" : "ghost-btn"}
            type="button"
            onClick={() => setTab("my-badges")}
          >
            My Badges ({badges.length})
          </button>
          <button
            className={tab === "leaderboard" ? "primary-btn" : "ghost-btn"}
            type="button"
            onClick={() => setTab("leaderboard")}
          >
            Leaderboard
          </button>
          <button
            className={tab === "all" ? "primary-btn" : "ghost-btn"}
            type="button"
            onClick={() => setTab("all")}
          >
            All Achievements
          </button>
        </div>
      </div>

      {loading && <p className="muted">Loading...</p>}

      {!loading && tab === "my-badges" && (
        <>
          {badges.length === 0 ? (
            <div className="card">
              <p className="muted">No badges yet. Start quizzing and building reports to earn achievements!</p>
            </div>
          ) : (
            <div className="stats-grid">
              {badges.map((badge) => (
                <div key={badge._id} className="stat-card" style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "32px", margin: 0 }}>{badge.iconEmoji}</p>
                  <p className="stat-label">{badge.title}</p>
                  <p className="muted" style={{ marginBottom: 0, fontSize: "13px" }}>{badge.description}</p>
                  <p className="muted" style={{ fontSize: "11px", marginTop: "8px" }}>
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {badges.length > 0 && (
            <div className="card">
              <h4>Download Certificate</h4>
              <p className="muted">Coming soon: Download a completion certificate with your earned badges.</p>
              <button className="ghost-btn" type="button" disabled>
                Generate PDF Certificate
              </button>
            </div>
          )}
        </>
      )}

      {!loading && tab === "leaderboard" && (
        <>
          {leaderboard.length === 0 ? (
            <div className="card">
              <p className="muted">No users have earned badges yet.</p>
            </div>
          ) : (
            <div className="card">
              <h3>Top Achievers</h3>
              <table style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Rank</th>
                    <th style={{ textAlign: "left" }}>User</th>
                    <th style={{ textAlign: "center" }}>Badges</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, index) => (
                    <tr key={user.userId}>
                      <td>#{index + 1}</td>
                      <td>{user.userName}</td>
                      <td style={{ textAlign: "center", fontWeight: "700" }}>
                        {user.badgeCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && tab === "all" && (
        <>
          <div className="stats-grid">
            {definitions.map((def) => (
              <div
                key={def.type}
                className="stat-card"
                style={{
                  textAlign: "center",
                  opacity: earnedBadgeTypes.has(def.type) ? 1 : 0.65,
                  border: earnedBadgeTypes.has(def.type) ? "2px solid #10b981" : "1px solid #cbd5e1"
                }}
              >
                <p style={{ fontSize: "32px", margin: 0 }}>{def.iconEmoji}</p>
                <p className="stat-label">{def.title}</p>
                <p className="muted" style={{ marginBottom: 0, fontSize: "13px" }}>{def.description}</p>
                {earnedBadgeTypes.has(def.type) && (
                  <p style={{ color: "#10b981", fontSize: "12px", marginTop: "8px", fontWeight: "700" }}>
                    ✓ Earned
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
