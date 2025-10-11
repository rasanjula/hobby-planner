import { Link } from "react-router-dom";
import type { Session } from "../api/sessions";
import { formatISOToLocal } from "../lib/date";

export default function SessionCard({ s }: { s: Session }) {
  const [d, t] = formatISOToLocal(s.date_time).split(" ");

  return (
    <Link
      to={`/session/${s.id}`}
      aria-label={`Open session ${s.title}`}
      className="card"
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        {/* show type as a fixed badge if you like; or use s.type */}
        <span className="badge">{s.type || "public"}</span>
        <span className="muted">{s.hobby}</span>
      </div>

      <h3 style={{ margin: "0" }}>{s.title}</h3>

      {s.description && (
        <div className="muted" style={{ marginTop: 4 }}>
          {s.description.length > 140 ? s.description.slice(0, 140) + "…" : s.description}
        </div>
      )}

      <div className="row" style={{ marginTop: 6 }}>
        <span>📅 {d}</span>
        <span>🕒 {t}</span>
      </div>

      <div className="row">
        <span className="muted">
          {s.location_text ? `📍 ${s.location_text}` : "📍 —"}
        </span>
      </div>
    </Link>
  );
}
