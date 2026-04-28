import { Link } from "react-router-dom";

const pillars = [
  {
    title: "Fire behavior",
    text: "Understand ignition, spread, and suppression from a practical engineering angle."
  },
  {
    title: "Prevention strategy",
    text: "Shape safer layouts, storage habits, and response plans before a fault becomes an incident."
  },
  {
    title: "Response readiness",
    text: "Move from awareness to action with structured drills, clear roles, and fast decisions."
  }
];

const modules = [
  { title: "Fire classes", desc: "Match the hazard to the right suppression approach." },
  { title: "Evacuation logic", desc: "Design movement paths that hold up under stress." },
  { title: "Operational readiness", desc: "Keep equipment, staff, and reporting aligned." }
];

export default function Education() {
  return (
    <div className="page narrow">
      <div className="topbar compact">
        <div>
          <h2>Fire Safety Education</h2>
          <p className="muted">A compact training hub for practical fire safety learning.</p>
        </div>
        <Link className="ghost-btn action-link" to="/home">
          Back Home
        </Link>
      </div>

      <section className="card hero-banner">
        <p className="muted">Learning path</p>
        <h2>Train teams to think clearly before conditions turn critical.</h2>
        <p>
          This section gives the platform an education layer that stays aligned with the calculation tools:
          practical, direct, and built for real operational use.
        </p>
      </section>

      <div className="stats-grid" style={{ marginTop: 16 }}>
        {pillars.map((pillar) => (
          <div key={pillar.title} className="stat-card">
            <p className="stat-label">{pillar.title}</p>
            <p className="muted" style={{ marginBottom: 0 }}>
              {pillar.text}
            </p>
          </div>
        ))}
      </div>

      <h3 className="section-title">Core modules</h3>
      <div className="category-grid">
        {modules.map((module) => (
          <article key={module.title} className="category-card">
            <span className="category-icon">▣</span>
            <h3 className="category-title">{module.title}</h3>
            <p className="category-desc">{module.desc}</p>
          </article>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Next step</h3>
        <p className="muted">Measure knowledge with the built-in quiz or jump back to the engineering tools.</p>
        <div className="actions">
          <Link className="primary-btn action-link" to="/quiz">
            Open Quiz
          </Link>
          <Link className="ghost-btn action-link" to="/fire">
            Go to Calculations
          </Link>
        </div>
      </div>
    </div>
  );
}