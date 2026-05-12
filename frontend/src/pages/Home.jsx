import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { isAdmin } from "../services/auth";
import StatCard from "../components/StatCard";

const calculationCategories = [
  {
    label: "Fire load and geometry",
    description: "Start with the base inputs that define the hazard and space.",
    tools: [
      {
        icon: "🔥",
        title: "Fire Calculations",
        desc: "Fire Load, Fire Load Density, Heat Release Rate",
        to: "/fire"
      },
      {
        icon: "🏢",
        title: "Area Calculations",
        desc: "Floor area, Volume, Ventilation",
        to: "/area"
      },
      {
        icon: "👥",
        title: "Occupant Load & Exit Width",
        desc: "Required exits, occupancy density, egress width",
        to: "/occupant-load"
      },
      {
        icon: "🚶",
        title: "Evacuation Time",
        desc: "RSET vs ASET, egress margin",
        to: "/evacuation"
      }
    ]
  },
  {
    label: "Suppression and water supply",
    description: "Size the active protection systems and storage that support them.",
    tools: [
      {
        icon: "🧯",
        title: "Fire Extinguisher",
        desc: "Number of extinguishers, Coverage area",
        to: "/extinguisher"
      },
      {
        icon: "🚒",
        title: "Hydrant System",
        desc: "Flow rate, Pump power, Water demand",
        to: "/hydrant"
      },
      {
        icon: "💦",
        title: "Sprinkler Demand",
        desc: "Hazard class, Density, Hydraulic demand",
        to: "/sprinkler"
      },
      {
        icon: "🛢️",
        title: "Fire Water Tank",
        desc: "Tank volume from flow and duration",
        to: "/water-tank"
      },
      {
        icon: "🫧",
        title: "Foam System Concentrate",
        desc: "Tank sizing for AFFF/AR-AFFF proportioning",
        to: "/foam-system"
      }
    ]
  },
  {
    label: "Detection and life safety",
    description: "Cover alarm, detection, smoke control, and resistance checks.",
    tools: [
      {
        icon: "🚨",
        title: "Detection System",
        desc: "Smoke & heat detectors, Spacing",
        to: "/detection"
      },
      {
        icon: "💨",
        title: "Smoke Exhaust Sizing",
        desc: "Exhaust airflow by compartment area & fire scenario",
        to: "/smoke-exhaust"
      },
      {
        icon: "🔥",
        title: "Fire Resistance Rating",
        desc: "Wall/door/slab ratings by building height & use",
        to: "/fire-rating"
      },
      {
        icon: "🔋",
        title: "Battery Backup Sizing",
        desc: "AH capacity for detection & alarm systems",
        to: "/battery-backup"
      },
      {
        icon: "⚡",
        title: "Cable Derating & Fire Circuits",
        desc: "Ampacity with temperature & grouping factors",
        to: "/cable-derating"
      },
      {
        icon: "⚙️",
        title: "Generator Sizing",
        desc: "kVA for pumps, fans, alarms with diversity factor",
        to: "/generator-sizing"
      }
    ]
  },
  {
    label: "Review and simulation",
    description: "Use the output layer to document, compare, and validate decisions.",
    tools: [
      {
        icon: "📄",
        title: "Reports",
        desc: "View & download saved reports",
        to: "/reports"
      },
      {
        icon: "🧪",
        title: "Scenario Simulator",
        desc: "What-if sliders with live risk visualization",
        to: "/simulator"
      }
    ]
  }
];

const educationTools = [
  {
    icon: "🎓",
    title: "Fire Safety Education",
    desc: "Learn fire types, prevention, response",
    to: "/education"
  },
  {
    icon: "🧠",
    title: "Fire Safety Quiz",
    desc: "Test your knowledge and get a score",
    to: "/quiz"
  }
];

const aiTools = [
  {
    icon: "🤖",
    title: "AI Safety Copilot",
    desc: "Explain calculations and get code-compliant next actions",
    to: "/copilot"
  },
  {
    icon: "✅",
    title: "Compliance Engine",
    desc: "Template-based checklist scoring with gap highlights",
    to: "/compliance"
  },
  {
    icon: "👥",
    title: "Team Workspace",
    desc: "Create teams and assign Engineer/Reviewer/Admin roles",
    to: "/teams"
  },
  {
    icon: "📈",
    title: "Real-Time Analytics",
    desc: "Track trends, risks, and activity logs",
    to: "/analytics"
  },
  {
    icon: "🔗",
    title: "Integrations",
    desc: "Webhook tests and export packages",
    to: "/integrations"
  },
  {
    icon: "�",
    title: "Badge System",
    desc: "Earn achievements, compete on leaderboards",
    to: "/badges"
  },
  {
    icon: "�🎤",
    title: "Voice Assistant",
    desc: "Control system with voice commands",
    to: "/voice"
  }
];

const sectionOrder = ["overview", "modules", "intelligence", "process"];

export default function Home() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");
  const [visibleSections, setVisibleSections] = useState({});
  const admin = isAdmin();

  const totals = useMemo(() => {
    const count = reports.length;
    const fireReports = reports.filter((item) => item.calculatorType === "fire");
    const avgFireLoad =
      fireReports.length === 0
        ? 0
        : (fireReports.reduce((sum, item) => sum + Number(item.fireLoad || 0), 0) / fireReports.length).toFixed(2);
    const critical = reports.filter((r) => r.riskCategory === "Critical").length;
    return { count, avgFireLoad, critical };
  }, [reports]);

  const loadReports = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/reports");
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    let frameId = 0;
    const onScroll = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        frameId = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("[data-story-section]"));
    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          if (!id) {
            return;
          }

          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [id]: true }));
            setActiveSection(id);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -20% 0px"
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
    };
  }, []);

  const activeIndex = Math.max(sectionOrder.indexOf(activeSection), 0);
  const timelineProgress = (activeIndex / (sectionOrder.length - 1)) * 100;
  const heroMetrics = [
    { label: "Reports archived", value: loading ? "..." : totals.count },
    { label: "Avg fire load", value: loading ? "..." : totals.avgFireLoad },
    { label: "Critical cases", value: loading ? "..." : totals.critical }
  ];

  const heroVideoStyle = {
    transform: `translateY(${Math.min(scrollY * 0.2, 140)}px) scale(${1 + scrollY * 0.00015})`
  };

  const heroOverlayStyle = {
    transform: `translateY(${Math.min(scrollY * 0.11, 70)}px)`
  };

  const heroContentStyle = {
    transform: `translateY(${Math.min(scrollY * 0.07, 36)}px)`,
    opacity: Math.max(0.45, 1 - scrollY / 980)
  };

  return (
    <div className="ur-home">
      <section className="ur-hero" id="overview" data-story-section="overview">
        <video className="ur-hero-video" autoPlay muted loop playsInline style={heroVideoStyle}>
          <source src="https://cdn.coverr.co/videos/coverr-fireplace-at-night-1579/1080p.mp4" type="video/mp4" />
        </video>
        <div className="ur-hero-overlay" style={heroOverlayStyle} />
        <div className="ur-hero-grain" />

        <div className="page ur-shell">
          <header className="ur-nav">
            <div className="ur-brand-wrap">
              <p className="ur-brand">ISA FIRE SYSTEMS</p>
              <p className="ur-brand-sub">Fire Safety Calculation and Education Platform</p>
            </div>

            <nav className="ur-anchor-nav" aria-label="Home sections">
              <a href="#overview" className={activeSection === "overview" ? "active" : ""}>Overview</a>
              <a href="#modules" className={activeSection === "modules" ? "active" : ""}>Modules</a>
              <a href="#intelligence" className={activeSection === "intelligence" ? "active" : ""}>Intelligence</a>
              <a href="#process" className={activeSection === "process" ? "active" : ""}>Journey</a>
            </nav>

            <div className="actions">
              {admin && (
                <Link to="/admin" className="ghost-btn action-link">
                  Admin Panel
                </Link>
              )}
            </div>
          </header>

          <div className="ur-hero-content" style={heroContentStyle}>
            <p className="ur-kicker">Industrial-grade safety command center</p>
            <h1 className="ur-title">Built for hard decisions, fast calculations, and clean execution.</h1>
            <p className="ur-lead">
              Welcome, Engineer. Move from raw inputs to decision-ready reports with
              a steel-edged interface, sharper navigation, and a presentation that feels disciplined.
            </p>
            <div className="actions">
              <Link to="/fire" className="primary-btn action-link ur-primary-link">
                Open Command Deck
              </Link>
              <Link to="/reports" className="ghost-btn action-link">
                Review Reports
              </Link>
            </div>
            <div className="ur-hero-metrics" aria-label="Workspace metrics">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="ur-hero-metric">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="ur-hero-footer" aria-label="Quick overview and navigation">
            <section className="ur-hero-footer-card">
              <p className="ur-footer-eyebrow">Under the canopy</p>
              <h2>Precision calculations, rugged clarity, and a decisive visual finish.</h2>
              <p>
                The workspace stays practical at the bottom of the hero, with direct access to the main
                engineering flow and no unnecessary noise.
              </p>
            </section>

            <section className="ur-hero-footer-card">
              <p className="ur-footer-eyebrow">Jump to section</p>
              <div className="ur-hero-footer-links">
                <a href="#modules">Modules</a>
                <a href="#intelligence">Intelligence</a>
                <a href="#process">Journey</a>
                <Link to="/reports">Reports</Link>
              </div>
            </section>

            <section className="ur-hero-footer-card ur-hero-footer-status">
              <p className="ur-footer-eyebrow">Workspace status</p>
              <strong>{admin ? "Administrator control active" : "Workspace access active"}</strong>
              <p>
                Fire calculations, learning tools, and report history are ready below the video-led intro.
              </p>
            </section>
          </div>
        </div>
      </section>

      <aside className="home-scroll-timeline" aria-label="Progress timeline">
        <div className="timeline-rail">
          <span className="timeline-progress" style={{ height: `${timelineProgress}%` }} />
        </div>
        {sectionOrder.map((sectionId, index) => (
          <a
            key={sectionId}
            href={`#${sectionId}`}
            className={`timeline-stop ${activeSection === sectionId ? "active" : ""} ${visibleSections[sectionId] ? "seen" : ""}`}
          >
            <span>{`0${index + 1}`}</span>
          </a>
        ))}
      </aside>

      <section
        id="modules"
        data-story-section="modules"
        className={`ur-section ur-section-light ur-reveal ${visibleSections.modules ? "is-visible" : ""}`}
      >
        <div className="page ur-stack">
          <div className="ur-heading">
            <p className="ur-chip">Section Explorer</p>
            <h2 className="ur-heading-title">Clear command links for the core fire engineering stack</h2>
            <p className="ur-muted">Grouped by discipline so engineers can jump straight to the calculation family they need.</p>
          </div>

          <div className="ur-category-list">
            {calculationCategories.map((category, categoryIndex) => (
              <section key={category.label} className="ur-category-block">
                <div className="ur-category-header">
                  <div>
                    <p className="ur-category-kicker">{category.label}</p>
                    <p className="ur-category-desc">{category.description}</p>
                  </div>
                  <span className="ur-category-count">{category.tools.length} links</span>
                </div>

                <div className="ur-explorer-grid">
                  {category.tools.map((cat, index) => (
                    <Link
                      key={cat.to}
                      to={cat.to}
                      className={`ur-explorer-tile tone-${((categoryIndex + index) % 6) + 1}`}
                      style={{ animationDelay: `${(categoryIndex * 120) + (index * 90)}ms` }}
                    >
                      <span className="ur-explorer-icon">{cat.icon}</span>
                      <h3>{cat.title}</h3>
                      <p>{cat.desc}</p>
                      <span className="ur-explorer-cta">Explore Module</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section
        id="intelligence"
        data-story-section="intelligence"
        className={`ur-section ur-section-dark ur-reveal ${visibleSections.intelligence ? "is-visible" : ""}`}
      >
        <div className="page ur-intelligence-grid">
          <section className="ur-panel glass">
            <p className="ur-chip">Live Intelligence</p>
            <h3>Portfolio snapshot and risk concentration</h3>
            <div className="stats-grid">
              <StatCard label="Reports" value={loading ? "..." : totals.count} />
              <StatCard label="Avg Fire Load" value={loading ? "..." : totals.avgFireLoad} />
              <StatCard label="Critical Risk" value={loading ? "..." : totals.critical} />
            </div>
            {error && <p className="error-text">{error}</p>}
          </section>

          <section className="ur-panel solid">
            <p className="ur-chip">Learning and Support</p>
            <h3>Train teams while you engineer safer spaces</h3>
            <div className="ur-mini-links">
              {[...educationTools, ...aiTools].map((cat) => (
                <Link key={cat.to} to={cat.to} className="ur-mini-link">
                  <span>{cat.icon}</span>
                  <div>
                    <strong>{cat.title}</strong>
                    <small>{cat.desc}</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section
        id="process"
        data-story-section="process"
        className={`ur-section ur-section-light ur-reveal ${visibleSections.process ? "is-visible" : ""}`}
      >
        <div className="page ur-journey-grid">
          <div className="ur-journey-copy">
            <p className="ur-chip">Story Flow</p>
            <h2 className="ur-heading-title">A disciplined workflow from technical input to executive output</h2>
            <p className="ur-muted">
              A rhythm designed for consultants and operations teams: capture inputs, validate risk,
              generate documentation, and communicate clearly.
            </p>
          </div>
          <ol className="ur-steps">
            <li>
              <span>01</span>
              <div>
                <strong>Collect project parameters</strong>
                <p>Enter occupancy, area, and fire load details with structured forms.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Run technical calculations</strong>
                <p>Compute suppression, detection, and hydraulic demand in dedicated modules.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Generate and store reports</strong>
                <p>Save auditable records, export PDF deliverables, and track history.</p>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <strong>Share outcomes confidently</strong>
                <p>Provide stakeholders with premium, decision-ready fire safety documentation.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <footer className="ur-footer" data-story-section="footer">
        <div className="page ur-footer-grid">
          <section className="ur-footer-card">
            <p className="ur-chip">Premium Workspace</p>
            <h3>Engineered interface. Editorial presentation. Operational confidence.</h3>
            <p>
              Crafted to make every fire engineering project feel clear, credible, and production-ready.
            </p>
          </section>

          <section className="ur-footer-card">
            <p className="ur-chip">Quick Access</p>
            <div className="ur-footer-links">
              <Link to="/fire">Fire Calculations</Link>
              <Link to="/extinguisher">Extinguisher</Link>
              <Link to="/hydrant">Hydrant</Link>
              <Link to="/reports">Reports</Link>
              <Link to="/education">Education</Link>
              <Link to="/voice">Voice Assistant</Link>
            </div>
          </section>
        </div>
      </footer>
    </div>
  );
}
