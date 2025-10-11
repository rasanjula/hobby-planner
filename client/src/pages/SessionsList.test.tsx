import { useEffect, useMemo, useState } from "react";
import { getPublicSessions, type Session } from "../api/sessions";
import { HOBBIES } from "../lib/constants";
import SessionCard from "../components/SessionCard";

export default function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [hobby, setHobby] = useState<string>("All");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const list = await getPublicSessions();
        setSessions(list);
      } catch (e: any) {
        setErr(e?.message || "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      const matchesQ =
        q.trim().length === 0 ||
        [s.title, s.description, s.location_text].some(t =>
          (t || "").toLowerCase().includes(q.toLowerCase())
        );
      const matchesHobby =
        hobby === "All" || s.hobby.toLowerCase() === hobby.toLowerCase();
      const t = new Date(s.date_time).getTime();
      const fromOK = !from || t >= new Date(from).getTime();
      const toOK = !to || t <= new Date(to).getTime();
      return matchesQ && matchesHobby && fromOK && toOK;
    });
  }, [sessions, q, hobby, from, to]);

  return (
    <main className="page">
      <div className="container">
        {/* Top bar */}
        <div className="topbar">
          <div className="brand">
            <span style={{
              display: "inline-grid",
              placeItems: "center",
              width: 34, height: 34,
              background: "#111827", color: "#fff", borderRadius: 8,
              fontWeight: 800
            }}>
              HP
            </span>
            <span>Hobby Sessions</span>
          </div>

          <a className="btn" href="/create">+ Create Session</a>
        </div>

        {/* Filters */}
        <h2 className="h2">All Sessions</h2>
        <section className="filters">
          <input
            className="input"
            placeholder="Search title/description..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />

          <select
            className="select"
            value={hobby}
            onChange={e => setHobby(e.target.value)}
          >
            <option>All</option>
            {HOBBIES.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <input
            className="input"
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </section>

        {/* List */}
        <h2 className="h2" style={{ marginTop: 18 }}>Upcoming Sessions</h2>

        {loading && <div className="muted">Loading…</div>}
        {err && <div style={{ color: "#b91c1c" }}>{err}</div>}

        {!loading && !err && (
          <div className="cards">
            {filtered.map(s => <SessionCard key={s.id} s={s} />)}
          </div>
        )}
      </div>
    </main>
  );
}
