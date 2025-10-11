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
    const f = sessions.filter((s) => {
      // hobby
      if (hobby !== "All" && s.hobby !== hobby) return false;

      // keyword
      if (q) {
        const hay = `${s.title} ${s.description ?? ""} ${s.location_text ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }

      // date range
      const dt = new Date(s.date_time);
      if (from && dt < new Date(from)) return false;
      if (to && dt > new Date(to)) return false;

      return true;
    });

    return f.sort(
      (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );
  }, [sessions, q, hobby, from, to]);

  const now = Date.now();
  const upcoming = filtered.filter((s) => new Date(s.date_time).getTime() >= now);
  const past = filtered.filter((s) => new Date(s.date_time).getTime() < now);

  return (
    <main className="page">
      <div className="container">
        <h2 className="h2">All Sessions</h2>

        {/* Filters – responsive grid */}
        <section className="filters">
          <input
            className="input"
            placeholder="Search title/description..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="select"
            value={hobby}
            onChange={(e) => setHobby(e.target.value)}
          >
            <option>All</option>
            {HOBBIES.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>

          <input
            className="input"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />

          <input
            className="input"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </section>

        {loading && <div className="muted" style={{ marginTop: 12 }}>Loading…</div>}
        {err && <div style={{ color: "#b91c1c", marginTop: 12 }}>Error: {err}</div>}

        {!loading && !err && (
          <>
            <section style={{ marginTop: 18 }}>
              <h3 className="h2" style={{ marginTop: 0 }}>Upcoming Sessions</h3>
              {upcoming.length === 0 ? (
                <div className="muted">No upcoming sessions.</div>
              ) : (
                <div className="cards">
                  {upcoming.map((s) => (
                    <SessionCard key={s.id} s={s} />
                  ))}
                </div>
              )}
            </section>

            <section style={{ marginTop: 24 }}>
              <h3 className="h2">Past Sessions</h3>
              {past.length === 0 ? (
                <div className="muted">No past sessions.</div>
              ) : (
                <div className="cards">
                  {past.map((s) => (
                    <SessionCard key={s.id} s={s} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
