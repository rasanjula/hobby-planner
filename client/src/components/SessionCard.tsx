import { Link } from "react-router-dom";
import type { Session } from "../api/sessions";
import { formatISOToLocal } from "../lib/date";

interface Props {
  s: Session;
}

export default function SessionCard({ s }: Props) {
  return (
    <Link
      to={`/session/${s.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
      aria-label={`Open session ${s.title}`}
    >
      <div
        style={{
          border: "1px solid #444",
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          transition: "background 120ms, border-color 120ms",
        }}
      >
        <h3 style={{ margin: "0 0 6px" }}>{s.title}</h3>
        <div><strong>Hobby:</strong> {s.hobby}</div>
        <div><strong>When:</strong> {formatISOToLocal(s.date_time)}</div>
        {s.location_text && <div><strong>Where:</strong> {s.location_text}</div>}
        {s.description && <p style={{ marginTop: 6 }}>{s.description}</p>}
      </div>
    </Link>
  );
}
