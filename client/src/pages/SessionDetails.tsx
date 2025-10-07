import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSessionById, getSessionByCode, type Session } from "../api/sessions";
import { formatISOToLocal } from "../lib/date";
export default function SessionDetails() {
  const { id } = useParams(); // could be id or private code
  const [data, setData] = useState<Session | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      if (!id) return;
      setErr(null);
      setLoading(true);
      try {
        const s = await getSessionById(id);
        setData(s);
      } catch {
        try {
          const s2 = await getSessionByCode(id);
          setData(s2);
        } catch (e: any) {
          setErr(e?.message || "Not found");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: "tomato" }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Not found.</div>;
  return (
    <div style={{ padding: 16 }}>
      <h1>{data.title}</h1>
      <p><strong>Hobby:</strong> {data.hobby}</p>
      <p><strong>When:</strong> {formatISOToLocal(data.date_time)}</p>
      {data.location_text && <p><strong>Where:</strong> {data.location_text}</p>}
      {data.description && <p>{data.description}</p>}
    </div>
  );
}
