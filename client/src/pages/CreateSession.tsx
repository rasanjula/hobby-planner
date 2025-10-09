import { useState } from "react";
import { HOBBIES } from "../lib/constants";
import { createSession, type CreateSessionInput, type CreateSessionOutput } from "../api/sessions";

export default function CreateSession() {
  const [form, setForm] = useState<CreateSessionInput>({
    hobby: "Reading",
    title: "",
    description: "",
    date_time: "",
    max_participants: 10,
    type: "public",
    location_text: "",
    lat: null,
    lng: null,
  });

  const [result, setResult] = useState<CreateSessionOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof CreateSessionInput>(key: K, val: CreateSessionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // normalize fields:
      const toNull = (v: unknown) => (v === "" ? null : (v as any));

      // date_time → ISO (UTC). Keep simple for demo.
      const iso = form.date_time ? new Date(form.date_time).toISOString() : "";

      // lat/lng → number | null (never empty strings)
      const latRaw = form.lat as any;
      const lngRaw = form.lng as any;
      const latNum =
        latRaw === "" || latRaw == null ? null : Number(latRaw);
      const lngNum =
        lngRaw === "" || lngRaw == null ? null : Number(lngRaw);

      const payload: CreateSessionInput = {
        hobby: form.hobby,
        title: form.title,
        description: toNull(form.description),
        date_time: iso,
        max_participants: Number(form.max_participants),
        type: form.type,
        location_text: toNull(form.location_text),
        lat: Number.isFinite(latNum as number) ? (latNum as number) : null,
        lng: Number.isFinite(lngNum as number) ? (lngNum as number) : null,
      };

      const out = await createSession(payload);
      setResult(out);
    } catch (ex: any) {
      setErr(ex?.message ?? "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Create Session</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 560 }}>
        <label>Hobby
          <select value={form.hobby} onChange={(e) => set("hobby", e.target.value as any)}>
            {HOBBIES.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>

        <label>Title
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </label>

        <label>Description
          <textarea
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Optional notes about this session"
          />
        </label>

        <label>Date & Time
          <input
            type="datetime-local"
            value={form.date_time}
            onChange={(e) => set("date_time", e.target.value)}
            required
          />
        </label>

        <label>Max participants
          <input
            type="number"
            min={1}
            value={form.max_participants}
            onChange={(e) => set("max_participants", Number(e.target.value))}
            required
          />
        </label>

        <label>Type
          <select value={form.type} onChange={(e) => set("type", e.target.value as any)}>
            <option value="public">public</option>
            <option value="private">private</option>
          </select>
        </label>

        <label>Location (text)
          <input
            value={form.location_text ?? ""}
            onChange={(e) => set("location_text", e.target.value)}
            placeholder="e.g., Oulu Library"
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label>Lat
            <input
              value={form.lat ?? ""}
              onChange={(e) => set("lat", e.target.value || null)}
              placeholder="65.012"
              inputMode="decimal"
            />
          </label>
          <label>Lng
            <input
              value={form.lng ?? ""}
              onChange={(e) => set("lng", e.target.value || null)}
              placeholder="25.465"
              inputMode="decimal"
            />
          </label>
        </div>

        <button disabled={loading}>{loading ? "Creating…" : "Create"}</button>
      </form>

      {err && <p style={{ color: "tomato" }}>Error: {err}</p>}

      {result && (
        <div style={{ marginTop: 16, padding: 12, border: "1px dashed #666", borderRadius: 8 }}>
          <h3>Created</h3>
          <div><strong>Session ID:</strong> {result.id}</div>
          <div><strong>Management code:</strong> {result.managementCode}</div>
          {result.privateUrlCode && (
            <div><strong>Private URL code:</strong> {result.privateUrlCode}</div>
          )}
          <div style={{ marginTop: 8 }}>
            <CopyButton text={result.manageUrl} label="Copy Manage URL Path" />
          </div>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Keep these codes safe. They won’t show again in lists.
          </p>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  return (
    <button type="button" onClick={() => navigator.clipboard.writeText(text)}>
      {label ?? "Copy"}
    </button>
  );
}
