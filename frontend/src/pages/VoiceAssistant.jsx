import { Link } from "react-router-dom";

const commands = ["Open fire calculations", "Show latest reports", "Go to hydrant system", "Summarize critical risks"];

const statuses = [
  { label: "Mic status", value: "Ready" },
  { label: "Command latency", value: "Low" },
  { label: "Recognition", value: "Active" }
];

export default function VoiceAssistant() {
  return (
    <div className="page narrow">
      <div className="topbar compact">
        <div>
          <h2>Voice Assistant</h2>
          <p className="muted">A command surface for quick hands-free navigation.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">
          Back Home
        </Link>
      </div>

      <section className="card hero-banner">
        <p className="muted">Voice control</p>
        <h2>Use short commands to move through the fire safety workspace.</h2>
        <p>
          This page keeps the assistant concept grounded in workflow: fast access, clear states, and no
          gimmicks.
        </p>
      </section>

      <div className="stats-grid">
        {statuses.map((status) => (
          <div key={status.label} className="stat-card">
            <p className="stat-label">{status.label}</p>
            <p className="stat-value" style={{ fontSize: 20 }}>
              {status.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Available commands</h3>
        <div className="category-grid">
          {commands.map((command) => (
            <article key={command} className="category-card">
              <span className="category-icon">◉</span>
              <h3 className="category-title">{command}</h3>
              <p className="category-desc">Speak this phrase to navigate directly to the matching module.</p>
            </article>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Next move</h3>
        <p className="muted">Use the dashboard for calculations or review saved output in reports.</p>
        <div className="actions">
          <Link className="primary-btn action-link" to="/reports">
            Open Reports
          </Link>
          <Link className="ghost-btn action-link" to="/fire">
            Open Calculations
          </Link>
        </div>
      </div>
    </div>
  );
}