// client/src/pages/CreateSession.tsx
import { useState, FormEvent, useMemo } from "react";
import { HOBBIES } from "../lib/constants";
import {
  createSession,
  type CreateSessionInput,
  type CreateSessionOutput,
} from "../api/sessions";

export default function CreateSession() {
  const [form, setForm] = useState<CreateSessionInput>({
    hobby: HOBBIES[0] || "Reading",
    title: "",
    description: "",
    date_time: "", // yyyy-MM-ddTHH:mm from <input type="datetime-local">
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
    setForm(prev => ({ ...prev, [key]: val }));
  }

  // helpers to guarantee no `undefined` is sent to the API
  const normStrOrNull = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };
  const normNumStrOrNull = (v: unknown): number | string | null => {
    if (v === undefined || v === null || v === "") return null;
    return v as number | string; // keep number or numeric string
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const iso = form.date_time ? new Date(form.date_time).toISOString() : "";

      const payload: CreateSessionInput = {
        ...form,
        date_time: iso,
        description: normStrOrNull(form.description),
        location_text: normStrOrNull(form.location_text),
        lat: normNumStrOrNull(form.lat),
        lng: normNumStrOrNull(form.lng),
      };

      const out = await createSession(payload);
      setResult(out); // show the success panel
    } catch (e: any) {
      setErr(e?.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="page">
      <div className="container">
        <h2 className="h2" style={{ marginBottom: 10 }}>Create Session</h2>

        {/* Success panel (persistent, outside the form) */}
        {result && (
          <SuccessPanel
            result={result}
            origin={origin}
            onClose={() => setResult(null)}
          />
        )}

        <form className="form" onSubmit={onSubmit} noValidate>
          {/* Row: hobby + max participants */}
          <div className="form-grid two">
            <div>
              <label htmlFor="hobby">Hobby</label>
              <select
                id="hobby"
                className="select"
                value={form.hobby}
                onChange={(e) => set("hobby", e.target.value)}
              >
                {HOBBIES.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="max">Max participants</label>
              <input
                id="max"
                className="input"
                type="number"
                min={1}
                value={form.max_participants}
                onChange={(e) => set("max_participants", Number(e.target.value || 1))}
              />
            </div>
          </div>

          {/* Title */}
          <div style={{ marginTop: 8 }}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              placeholder="e.g., Reading Circle — Chapter 3"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div style={{ marginTop: 8 }}>
            <label htmlFor="desc">
              Description <span className="help">(optional)</span>
            </label>
            <textarea
              id="desc"
              className="input"
              placeholder="What are you planning to do?"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Row: date_time + type */}
          <div className="form-grid two" style={{ marginTop: 8 }}>
            <div>
              <label htmlFor="dt">Date &amp; time</label>
              <input
                id="dt"
                className="input"
                type="datetime-local"
                value={form.date_time}
                onChange={(e) => set("date_time", e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="type">Type</label>
              <select
                id="type"
                className="select"
                value={form.type}
                onChange={(e) => set("type", e.target.value as "public" | "private")}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* Location block */}
          <div className="form-grid two" style={{ marginTop: 8 }}>
            <div>
              <label htmlFor="loc">
                Location (text) <span className="help">(optional)</span>
              </label>
              <input
                id="loc"
                className="input"
                placeholder="Oulu Library"
                value={form.location_text ?? ""}
                onChange={(e) => set("location_text", e.target.value)}
              />
            </div>

            <div className="form-grid two">
              <div>
                <label htmlFor="lat">
                  Latitude <span className="help">(optional)</span>
                </label>
                <input
                  id="lat"
                  className="input"
                  type="number"
                  step="any"
                  value={form.lat ?? ""}
                  onChange={(e) => set("lat", e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="lng">
                  Longitude <span className="help">(optional)</span>
                </label>
                <input
                  id="lng"
                  className="input"
                  type="number"
                  step="any"
                  value={form.lng ?? ""}
                  onChange={(e) => set("lng", e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Errors + actions */}
          {err && (
            <div
              className="card"
              style={{ marginTop: 8, color: "#b91c1c", borderColor: "#fecaca" }}
            >
              Error: {err}
            </div>
          )}

          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create session"}
            </button>
            <a className="btn btn-outline" href="/">Cancel</a>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ===== Success panel component ===== */

function CopyBtn({ text, children }: { text: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "Copied!" : children}
    </button>
  );
}

function SuccessPanel({
  result,
  origin,
  onClose,
}: {
  result: CreateSessionOutput;
  origin: string;
  onClose: () => void;
}) {
  // Expecting your API to return:
  // - result.id
  // - result.managementCode
  // - result.manageUrl (e.g., "/session/<id>/manage?code=<code>")
  // - result.privateUrlCode (nullable for public sessions)
  //
  // If your keys are snake_case, adjust accordingly.

  const viewPath = useMemo(() => {
    return result.privateUrlCode
      ? `/session/by-code/${result.privateUrlCode}`
      : `/session/${result.id}`;
  }, [result.privateUrlCode, result.id]);

  const managePath = useMemo(() => result.manageUrl, [result.manageUrl]);

  const viewUrl = useMemo(() => `${origin}${viewPath}`, [origin, viewPath]);
  const manageUrl = useMemo(() => `${origin}${managePath}`, [origin, managePath]);

  return (
    <div
      className="card"
      style={{
        background: "#ecfdf5",
        borderColor: "#34d399",
        marginBottom: 14,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Session created successfully!</h3>

      <div style={{ marginTop: 4 }}>
        <strong>Management code:</strong>{" "}
        <code>{result.managementCode}</code>
      </div>

      {/* View link (public OR private) */}
      <div style={{ marginTop: 10 }}>
        <div>
          <strong>{result.privateUrlCode ? "Private link:" : "View link:"}</strong>{" "}
          <a href={viewPath}>{viewPath}</a>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input
            readOnly
            className="input"
            value={viewUrl}
            onFocus={(e) => e.currentTarget.select()}
          />
          {/* ⤵ Copies the VIEW URL only */}
          <CopyBtn text={viewUrl}>Copy</CopyBtn>
        </div>
      </div>

      {/* Management link */}
      <div style={{ marginTop: 10 }}>
        <div>
          <strong>Management link:</strong>{" "}
          <a href={managePath}>{managePath}</a>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input
            readOnly
            className="input"
            value={manageUrl}
            onFocus={(e) => e.currentTarget.select()}
          />
          {/* ⤵ Copies the MANAGEMENT URL only (separate prop) */}
          <CopyBtn text={manageUrl}>Copy Management Link</CopyBtn>
        </div>
      </div>

      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn btn-outline" onClick={onClose}>
          Create another
        </button>
      </div>
    </div>
  );
}
