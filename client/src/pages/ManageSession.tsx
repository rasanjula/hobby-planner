import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getSessionById, getSessionByCode, type Session, patchSession, deleteSession } from "../api/sessions";
import { HOBBIES } from "../lib/constants";

export default function ManageSession() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const manage = sp.get("code") || "";
  const nav = useNavigate();

  const [data, setData] = useState<Session | null>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setErr(null);
      setLoading(true);
      try {
        let s: Session;
        try {
          s = await getSessionById(id);
        } catch {
          s = await getSessionByCode(id);
        }
        setData(s);
        setForm({
          hobby: s.hobby,
          title: s.title,
          description: s.description ?? "",
          // Show as local datetime-local string; keep simple slice
          date_time: s.date_time.slice(0, 16), // yyyy-MM-ddTHH:mm
          max_participants: s.max_participants,
          type: s.type,
          location_text: s.location_text ?? "",
          lat: s.lat ?? "",
          lng: s.lng ?? "",
        });
      } catch (e: any) {
        setErr(e?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((p: any) => ({ ...p, [k]: v }));
  }

  async function onSave(e: React.FormEvent) {
  e.preventDefault();
  if (!data) return;
  if (!manage) {
    alert("Missing manage code in URL (?code=...)");
    return;
  }
  setSaving(true);
  try {
    const toNull = (v: any) => (v === "" ? null : v);

    // numeric parsing for lat/lng
    const latRaw = form.lat;
    const lngRaw = form.lng;
    const latNum =
      latRaw === "" || latRaw === null || latRaw === undefined ? null : Number(latRaw);
    const lngNum =
      lngRaw === "" || lngRaw === null || lngRaw === undefined ? null : Number(lngRaw);

    const mp = Number(form.max_participants);

    const payload = {
      hobby: form.hobby,
      title: form.title,
      description: toNull(form.description),
      type: form.type,
      location_text: toNull(form.location_text),
      lat: Number.isNaN(latNum as number) ? null : (latNum as number | null),
      lng: Number.isNaN(lngNum as number) ? null : (lngNum as number | null),
      ...(Number.isFinite(mp) ? { max_participants: mp } : {}),
      ...(form.date_time ? { date_time: new Date(form.date_time).toISOString() } : {}),
    } as const;

    const updated = await patchSession(data.id, manage, payload);
    alert("Saved!");
    setData({ ...data, ...updated });
  } catch (e: any) {
    alert(e?.message || "Save failed");
  } finally {
    setSaving(false);
  }
}


  async function onDelete() {
    if (!data) return;
    if (!manage) {
      alert("Missing manage code");
      return;
    }
    if (!confirm("Delete this session? This cannot be undone.")) return;
    try {
      await deleteSession(data.id, manage);
      alert("Deleted.");
      nav("/");
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16, color: "tomato" }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Not found.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 640 }}>
      <h1>Manage: {data.title}</h1>
      {!manage && (
        <p style={{ color: "tomato" }}>
          No manage code in URL. Add ?code=YOUR_MANAGE_CODE to edit.
        </p>
      )}

      <form onSubmit={onSave} style={{ display: "grid", gap: 8 }}>
        <label>
          Hobby
          <select value={form.hobby} onChange={(e) => set("hobby", e.target.value)}>
            {HOBBIES.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label>
          Title
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </label>

        <label>
          Description
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>

        <label>
          Date & Time
          <input
            type="datetime-local"
            value={form.date_time}
            onChange={(e) => set("date_time", e.target.value)}
            required
          />
        </label>

        <label>
          Max participants
          <input
            type="number"
            min={1}
            value={form.max_participants}
            onChange={(e) => set("max_participants", Number(e.target.value))}
            required
          />
        </label>

        <label>
          Type
          <select value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="public">public</option>
            <option value="private">private</option>
          </select>
        </label>

        <label>
          Location (text)
          <input value={form.location_text} onChange={(e) => set("location_text", e.target.value)} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label>
            Lat
            <input value={form.lat} onChange={(e) => set("lat", e.target.value)} />
          </label>
          <label>
            Lng
            <input value={form.lng} onChange={(e) => set("lng", e.target.value)} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          <button type="button" onClick={onDelete} style={{ background: "#552222", color: "#fff" }}>
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
