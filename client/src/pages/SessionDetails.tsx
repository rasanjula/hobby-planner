/* augment existing SessionDetails page */
import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import { useParams } from "react-router-dom";
import { getSessionById, getSessionByCode, type Session } from "../api/sessions";
import { getAttendeeCount, joinSession, leaveSessionSelf } from "../api/sessions";
import { formatISOToLocal } from "../lib/date";
type StoredAttend = { attendeeId: string; attendanceCode: string };
export default function SessionDetails() {
  const { id } = useParams(); // could be id or code
  const [data, setData] = useState<Session | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState<number>(0);
  const [max, setMax] = useState<number>(0);
  const [myAttend, setMyAttend] = useState<StoredAttend | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  function key(sid: string) { return `attend:${sid}`; }
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
      const raw = localStorage.getItem(key(s.id));
      setMyAttend(raw ? JSON.parse(raw) as StoredAttend : null);
      // load count
      const c = await getAttendeeCount(s.id);
      setCount(c.count);
      setMax(c.max);
    } catch (e: any) {
      setErr(e?.message || "Not found");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (id) loadSession(id);
  }, [id]);
  async function onJoin() {
    if (!data) return;
    setJoining(true);
    try {
      const out = await joinSession(data.id);
      localStorage.setItem(key(data.id), JSON.stringify(out));
      setMyAttend(out);
      const c = await getAttendeeCount(data.id);
      setCount(c.count); setMax(c.max);
    } catch (e: any) {
      alert(e?.message || "Join failed");
    } finally {
      setJoining(false);
    }
  }
  async function onLeave() {
    if (!data || !myAttend) return;
    setLeaving(true);
    try {
      await leaveSessionSelf(data.id, myAttend.attendeeId, myAttend.attendanceCode);
      localStorage.removeItem(key(data.id));
      setMyAttend(null);
      const c = await getAttendeeCount(data.id);
      setCount(c.count); setMax(c.max);
    } catch (e: any) {
      alert(e?.message || "Leave failed");
    } finally {
      setLeaving(false);
    }
  }
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: "tomato" }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Not found.</div>;
  const isFull = count >= max;
  return (
    <div style={{ padding: 16 }}>
      <h1>{data.title}</h1>
      <p><strong>Hobby:</strong> {data.hobby}</p>
      <p><strong>When:</strong> {formatISOToLocal(data.date_time)}</p>
      {data.location_text && <p><strong>Where:</strong> {data.location_text}</p>}
      {data.description && <p>{data.description}</p>}
      <div style={{ marginTop: 16, padding: 12, border: "1px solid #444", borderRadius: 8 }}>
        <div><strong>Attendees:</strong> {count} / {max}</div>
        {!myAttend && (
          <button disabled={joining || isFull} onClick={onJoin} style={{ marginTop: 8 }}>
            {isFull ? "Full" : (joining ? "Joining…" : "Join")}
          </button>
        )}
        {myAttend && (
          <button disabled={leaving} onClick={onLeave} style={{ marginTop: 8 }}>
            {leaving ? "Leaving…" : "Leave"}
          </button>
        )}
      </div>

         {(data.lat ?? null) && (data.lng ?? null) ? (
        <>
          <h3 style={{ marginTop: 16 }}>Map</h3>
          <MapView lat={data.lat!} lng={data.lng!} title={data.title} />
        </>
      ) : null}

    </div>
  );
}
