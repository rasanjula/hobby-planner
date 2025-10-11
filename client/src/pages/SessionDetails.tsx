// client/src/pages/SessionDetails.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MapView from "../components/MapView";
import {
  getSessionById,
  getSessionByCode,
  getAttendeeCount,
  joinSession,
  leaveSessionSelf,
  listAttendees,
  type Attendee,
  type Session,
} from "../api/sessions";
import { formatISOToLocal } from "../lib/date";

type StoredAttend = { attendeeId: string; attendanceCode: string };

export default function SessionDetails() {
  const { id } = useParams(); // may be a session id or a private code

  const [data, setData] = useState<Session | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [count, setCount] = useState(0);
  const [max, setMax] = useState(0);

  const [myAttend, setMyAttend] = useState<StoredAttend | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Name typed by the user when joining (restored per session)
  const [myName, setMyName] = useState("");

  // Public attendee list
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  function attendKey(sid: string) {
    return `attend:${sid}`;
  }
  function nameKey(sid: string) {
    return `name:${sid}`;
  }

  async function refreshCount(sid: string) {
    const c = await getAttendeeCount(sid);
    setCount(c.count);
    setMax(c.max);
  }

  async function refreshAttendeesSafe() {
    if (!data) return;
    try {
      const list = await listAttendees(data.id);
      setAttendees(list);
    } catch {
      // If B5 isn't implemented yet, ignore and show empty list
      setAttendees([]);
    }
  }

  async function loadSession(idOrCode: string) {
    setErr(null);
    setLoading(true);
    try {
      let s: Session;
      try {
        s = await getSessionById(idOrCode);
      } catch {
        s = await getSessionByCode(idOrCode);
      }

      setData(s);

      // restore my attendance (if any)
      const raw = localStorage.getItem(attendKey(s.id));
      setMyAttend(raw ? (JSON.parse(raw) as StoredAttend) : null);

      // restore saved display name for this session
      setMyName(localStorage.getItem(nameKey(s.id)) || "");

      await refreshCount(s.id);

      // load attendees if it's a public session (safe)
      if (s.type === "public") {
        await refreshAttendeesSafe();
      } else {
        setAttendees([]);
      }
    } catch (e: any) {
      setErr(e?.message || "Not found");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadSession(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!data) return;
    if (data.type === "public") {
      refreshAttendeesSafe().catch(() => setAttendees([]));
    } else {
      setAttendees([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, data?.type]);

  // persist name while typing so it survives navigation before joining
  useEffect(() => {
    if (!data) return;
    localStorage.setItem(nameKey(data.id), myName || "");
  }, [data?.id, myName]);

  async function onJoin() {
    if (!data) return;
    setJoining(true);
    try {
      const out = await joinSession(data.id, myName || undefined);
      // name is already persisted on change; also store attend
      localStorage.setItem(attendKey(data.id), JSON.stringify(out));
      setMyAttend(out);

      await refreshCount(data.id);
      if (data.type === "public") await refreshAttendeesSafe();
      alert("Joined! 🎉");
    } catch (e: any) {
      alert(e?.message || "Join failed");
    } finally {
      setJoining(false);
    }
  }

  async function onLeave() {
    if (!data || !myAttend) return;
    if (!confirm("Leave this session?")) return;
    setLeaving(true);
    try {
      await leaveSessionSelf(data.id, myAttend.attendeeId, myAttend.attendanceCode);
      localStorage.removeItem(attendKey(data.id));
      setMyAttend(null);

      await refreshCount(data.id);
      if (data.type === "public") await refreshAttendeesSafe();
      alert("You left the session.");
    } catch (e: any) {
      alert(e?.message || "Leave failed");
    } finally {
      setLeaving(false);
    }
  }

  if (loading)
    return (
      <main className="page">
        <div className="container"><div className="muted">Loading…</div></div>
      </main>
    );
  if (err)
    return (
      <main className="page">
        <div className="container"><div style={{ color: "#b91c1c" }}>Error: {err}</div></div>
      </main>
    );
  if (!data)
    return (
      <main className="page">
        <div className="container"><div className="muted">Not found.</div></div>
      </main>
    );

  const isFull = count >= max;

  return (
    <main className="page">
      <div className="container">
        {/* Title + type badge */}
        <article className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <h2 className="h2" style={{ margin: 0 }}>{data.title}</h2>
            <span className="badge">{data.type}</span>
          </div>

          {/* Meta */}
          <div className="form-grid two" style={{ marginTop: 8 }}>
            <div>
              <div>📚 <b>Hobby:</b> {data.hobby}</div>
              {data.location_text && <div>📍 <b>Where:</b> {data.location_text}</div>}
            </div>
            <div>
              <div>📅 <b>When:</b> {formatISOToLocal(data.date_time)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div>👥 <b>Capacity:</b> {count} / {max}</div>
                {isFull && (
                  <span
                    title="Session is full"
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    Full
                  </span>
                )}
              </div>
            </div>
          </div>

          {data.description && <p className="muted" style={{ marginTop: 8 }}>{data.description}</p>}

          {/* Join/Leave block */}
          <div className="card" style={{ marginTop: 12, padding: 12 }}>
            <div className="muted"><b>Attendees:</b> {count} / {max}</div>

            {!myAttend && (
              <div style={{ marginTop: 8 }}>
                <label>
                  Your name <span className="help">(optional)</span>
                </label>
                <input
                  className="input"
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  placeholder="e.g., Alex"
                  style={{ maxWidth: 320 }}
                />
              </div>
            )}

            <div className="actions">
              {!myAttend ? (
                <button
                  className="btn btn-primary"
                  disabled={joining || isFull}
                  title={isFull ? "Session is full" : ""}
                  onClick={onJoin}
                >
                  {isFull ? "Full" : joining ? "Joining…" : "Join"}
                </button>
              ) : (
                <button
                  className="btn btn-outline"
                  disabled={leaving}
                  onClick={onLeave}
                >
                  {leaving ? "Leaving…" : "Leave"}
                </button>
              )}
            </div>

            {/* Optional: manual refresh */}
            <div style={{ marginTop: 8 }}>
              <button className="link" onClick={() => data && refreshCount(data.id)}>
                Refresh attendees
              </button>
            </div>
          </div>

          {/* Public participants */}
          {data.type === "public" && (
            <section style={{ marginTop: 12 }}>
              <h3 className="h2" style={{ marginTop: 0 }}>Participants</h3>
              <div className="card" style={{ padding: 12 }}>
                {attendees.length === 0 ? (
                  <div className="muted">No participants yet.</div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {attendees.map((a) => (
                      <li key={a.id} style={{ padding: "4px 0" }}>
                        {a.display_name || "Anonymous"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </article>

        {/* Map */}
        {data.lat != null && data.lng != null && (
          <section style={{ marginTop: 16 }}>
            <h3 className="h2" style={{ marginTop: 0 }}>Map</h3>
            <div className="card" style={{ padding: 8 }}>
              <MapView lat={data.lat!} lng={data.lng!} title={data.title} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
