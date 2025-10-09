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
      setErr(null); setLoading(true);
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
    const f = sessions.filter(s => {
      if (hobby !== "All" && s.hobby !== hobby) return false;
      if (q) {
        const hay = `${s.title} ${s.description ?? ""} ${s.location_text ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (from) {
        if (new Date(s.date_time) < new Date(from)) return false;
      }
      if (to) {
        if (new Date(s.date_time) > new Date(to)) return false;
      }
      return true;
    });
    // split upcoming/past in the render
    return f.sort((a,b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
  }, [sessions, q, hobby, from, to]);
  const now = Date.now();
  const upcoming = filtered.filter(s => new Date(s.date_time).getTime() >= now);
  const past = filtered.filter(s => new Date(s.date_time).getTime() < now);
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: "tomato" }}>Error: {err}</div>;
  return (
    <div style={{ padding: 16 }}>
      <h1>All Sessions</h1>
      <div style={{ display:"grid", gap:8, gridTemplateColumns:"2fr 1fr 1fr 1fr", marginBottom: 12 }}>
        <input placeholder="Keyword…" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={hobby} onChange={e=>setHobby(e.target.value)}>
          <option>All</option>
          {HOBBIES.map(h => <option key={h}>{h}</option>)}
        </select>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} />
      </div>
      <section style={{ marginTop: 12 }}>
        <h2>Upcoming</h2>
        {upcoming.length === 0 ? <p>No upcoming sessions.</p> :
          <div style={{ display:"grid", gap:8 }}>
            {upcoming.map(s => <SessionCard key={s.id} s={s} />)}
          </div>
        }
      </section>
      <section style={{ marginTop: 24 }}>
        <h2>Past</h2>
        {past.length === 0 ? <p>No past sessions.</p> :
          <div style={{ display:"grid", gap:8 }}>
            {past.map(s => <SessionCard key={s.id} s={s} />)}
          </div>
        }
      </section>
    </div>
  );
}
