import { Link } from "react-router-dom";

export default function PlaceholderPage({ title, message }) {
  return (
    <div className="page narrow">
      <div className="card">
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        <Link className="primary-btn action-link" to="/home">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
