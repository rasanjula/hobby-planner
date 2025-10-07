// client/src/pages/SessionsList.tsx
import { useEffect, useState } from "react";
import { getPublicSessions, type Session } from "../api/sessions";
import SessionCard from "../components/SessionCard";
import { Link } from "react-router-dom";

export default function SessionsList() {
  const [data, setData] = useState<Session[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getPublicSessions()
      .then(setData)
      .catch((e) => setErr(e.message || "Failed to load"));
  }, []);

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Error</h2>
        <p>{err}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 16 }}>
        <p>Loading sessions…</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <p>No sessions yet.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>All Sessions</h1>
      {data.map((s) => (
        <Link
          key={s.id}
          to={`/session/${s.id}`}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <SessionCard s={s} />
        </Link>
      ))}
    </div>
  );
}
