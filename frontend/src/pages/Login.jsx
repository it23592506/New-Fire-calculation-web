import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { saveSession } from "../services/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      saveSession(res.data);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-gradient-1"></div>
        <div className="auth-gradient-2"></div>
      </div>

      <div className="auth-content">
        <div className="auth-box">
          <div className="auth-header">
            <div className="auth-icon">🔥</div>
            <h1>ISA Fire Systems</h1>
            <p>Welcome back, Engineer</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="auth-btn primary-auth-btn"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Don't have an account?</span>
          </div>

          <Link to="/register" className="auth-btn secondary-auth-btn">
            Create Account
          </Link>

          <p className="auth-footer">
            Enter the command workspace to run calculations, track reports, and review risk.
          </p>
        </div>
      </div>
    </div>
  );
}
