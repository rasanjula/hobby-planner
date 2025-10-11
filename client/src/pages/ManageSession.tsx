// client/src/pages/ManageSession.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { HOBBIES } from "../lib/constants";
import { formatISOToLocal } from "../lib/date";
import {
  getSessionById,
  getSessionByCode,
  patchSession,
  deleteSession,
  listAttendees,
  removeAttendeeManage,
  type Attendee,
  type Session,
  type UpdateSessionInput,
} from "../api/sessions";

export default function ManageSession() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const loc = useLocation();

  const manageFromUrl = useMemo(
    () => new URLSearchParams(loc.search).get("code") || "",
    [loc.search]
  );
  const [manageCodeInput, setManageCodeInput] = useState(manageFromUrl);

  const [data, setData] = useState<Session | null>(null);
  const [form, setForm] = useState<UpdateSessionInput>({
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // attendees (creator-only list)
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function set<K extends keyof UpdateSessionInput>(key: K, val: UpdateSessionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  // Load session by id; if not found, try treating :id as private code
  useEffect(() => {
    (async () => {
      if (!id) return;
      setErr(null);
      setLoading(true);
      try {
        let s: Session | null = null;
        try {
          s = await getSessionById(id);
        } catch {
          s = await getSessionByCode(id);
        }
        if (!s) throw new Error("Session not found");
        setData(s);

        setForm({
          hobby: s.hobby,
          title: s.title,
          description: s.description || "",
          date_time: new Date(s.date_time).toISOString().slice(0, 16), // datetime-local
          max_participants: s.max_participants,
          type: s.type as "public" | "private",
          location_text: s.location_text || "",
          lat: s.lat == null ? null : Number(s.lat),
          lng: s.lng == null ? null : Number(s.lng),
        });
      } catch (e: any) {
        setErr(e?.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Fetch attendees (public: allowed without code; private: needs manage code)
  useEffect(() => {
    (async () => {
      if (!data) return;
      try {
        const list = await listAttendees(
          data.id,
          data.type === "private" ? manageFromUrl : undefined
        );
        setAttendees(list);
      } catch {
        // do not surface as page error; just hide list on auth failure
        setAttendees([]);
      }
    })();
  }, [data?.id, data?.type, manageFromUrl]);

  // Submit manage code prompt -> push to URL (?code=...)
  function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!manageCodeInput.trim()) return;
    const next = new URLSearchParams(loc.search);
    next.set("code", manageCodeInput.trim());
    nav({ pathname: loc.pathname, search: `?${next.toString()}` }, { replace: false });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    if (!manageFromUrl) {
      setErr("Missing manage code in URL (?code=...)");
      return;
    }

    setErr(null);
    setSaving(true);
    try {
      const payload: UpdateSessionInput = {
        ...form,
        date_time: form.date_time ? new Date(form.date_time).toISOString() : "",
        description: form.description || "",
        location_text: form.location_text || "",
        lat: form.lat == null ? null : Number(form.lat),
        lng: form.lng == null ? null : Number(form.lng),
      };

      const updated = await patchSession(data.id, manageFromUrl, payload);
      setData(updated);

      // reflect saved values back to form (datetime-local shape)
      setForm({
        ...payload,
        date_time: payload.date_time
          ? new Date(payload.date_time).toISOString().slice(0, 16)
          : "",
      });

      alert("Saved!");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!data) return;
    if (!manageFromUrl) {
      setErr("Missing manage code in URL (?code=...)");
      return;
    }
    if (!confirm("Delete this session? This cannot be undone.")) return;

    setErr(null);
    setSaving(true);
    try {
      await deleteSession(data.id, manageFromUrl);
      alert("Deleted.");
      nav("/");
    } catch (e: any) {
      setErr(e?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  const capacityBadge = useMemo(() => {
    if (!data) return null;
    const count = attendees.length;
    const isOver = count > data.max_participants;
    const isFull = count === data.max_participants;

    if (isOver) {
      return (
        <span
          title="More attendees than capacity"
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            background: "#fef3c7",
            color: "#92400e",
            fontSize: 12,
            fontWeight: 600,
            marginLeft: 8,
          }}
        >
          Over capacity
        </span>
      );
    }
    if (isFull) {
      return (
        <span
          title="At capacity"
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 12,
            fontWeight: 600,
            marginLeft: 8,
          }}
        >
          Full
        </span>
      );
    }
    return null;
  }, [data, attendees]);

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

  const needsManagePrompt = data.type === "private" && !manageFromUrl;

  return (
    <main className="page">
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 className="h2" style={{ margin: 0 }}>Manage session</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={() => nav(-1)}>← Back</button>
            <Link className="btn btn-outline" to={`/session/${data.id}`}>View public page</Link>
          </div>
        </div>

        {/* Read-only header card */}
        <article className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <h3 className="h2" style={{ margin: 0 }}>{data.title}</h3>
            <span className="badge">{data.type}</span>
          </div>

          <div className="form-grid two" style={{ marginTop: 8 }}>
            <div>
              <div>📚 <b>Hobby:</b> {data.hobby}</div>
              {data.location_text && <div>📍 <b>Where:</b> {data.location_text}</div>}
            </div>
            <div>
              <div>📅 <b>When:</b> {formatISOToLocal(data.date_time)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div>👥 <b>Capacity:</b> {attendees.length} / {data.max_participants}</div>
                {capacityBadge}
              </div>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            <div><strong>ID:</strong> {data.id}</div>
            <div><Link to={`/session/${data.id}`}>Open public page</Link></div>
          </div>
        </article>

        {/* Manage code prompt (only when private + missing code) */}
        {needsManagePrompt && (
          <article className="card" style={{ marginTop: 12 }}>
            <form onSubmit={onSubmitCode}>
              <label>Enter manage code</label>
              <input
                className="input"
                placeholder="Paste the manage code here"
                value={manageCodeInput}
                onChange={(e) => setManageCodeInput(e.target.value)}
                style={{ maxWidth: 360 }}
              />
              <div className="actions">
                <button className="btn btn-primary" type="submit">Continue</button>
              </div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                Or open directly: <code>/session/{data.id}/manage?code=&lt;YOUR_MANAGE_CODE&gt;</code>
              </div>
            </form>
          </article>
        )}

        {/* Participants (creator-only list; public sessions don't need code) */}
        <section style={{ marginTop: 16 }}>
          <h3 className="h2" style={{ marginTop: 0 }}>Participants</h3>
          <div className="card" style={{ padding: 12 }}>
            {data.type === "private" && !manageFromUrl ? (
              <div className="muted">
                Enter your manage code above to view/remove attendees.
              </div>
            ) : attendees.length === 0 ? (
              <div className="muted">No participants yet.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {attendees.map((a) => (
                  <li
                    key={a.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "center",
                      padding: "6px 0",
                    }}
                  >
                    <span>{a.display_name || "Anonymous"}</span>
                    <button
                      className="btn btn-outline"
                      disabled={removingId === a.id || (data.type === "private" && !manageFromUrl)}
                      onClick={async () => {
                        if (data.type === "private" && !manageFromUrl) return;
                        if (!confirm(`Remove "${a.display_name || "this attendee"}" from this session?`)) return;
                        try {
                          setRemovingId(a.id);
                          await removeAttendeeManage(data.id, a.id, manageFromUrl);
                          setAttendees((prev) => prev.filter((x) => x.id !== a.id));
                        } catch (e: any) {
                          alert(e?.message || "Failed to remove attendee");
                        } finally {
                          setRemovingId(null);
                        }
                      }}
                      style={{ minWidth: 112 }}
                      title="Remove participant"
                    >
                      {removingId === a.id ? "Removing…" : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <button
              className="link"
              onClick={() => {
                if (!data) return;
                listAttendees(
                  data.id,
                  data.type === "private" ? manageFromUrl : undefined
                )
                  .then(setAttendees)
                  .catch(() => setAttendees([]));
              }}
            >
              Refresh list
            </button>
          </div>
        </section>

        {/* EDIT FORM — same look as Create page */}
        <form className="form" onSubmit={onSave} style={{ marginTop: 16 }}>
          <div className="form-grid two">
            <div>
              <label>Hobby</label>
              <select
                className="select"
                value={form.hobby}
                onChange={(e) => set("hobby", e.target.value as any)}
              >
                {HOBBIES.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Max participants</label>
              <input
                className="input"
                type="number"
                value={form.max_participants}
                onChange={(e) => set("max_participants", Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., Reading Circle — Chapter 3"
              required
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <label>
              Description <span className="help">(optional)</span>
            </label>
            <textarea
              className="input"
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="form-grid two" style={{ marginTop: 8 }}>
            <div>
              <label>Date &amp; time</label>
              <input
                className="input"
                type="datetime-local"
                value={form.date_time}
                onChange={(e) => set("date_time", (e.target as HTMLInputElement).value)}
                required
              />
            </div>

            <div>
              <label>Type</label>
              <select
                className="select"
                value={form.type}
                onChange={(e) => set("type", e.target.value as any)}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 12, marginTop: 8 }}>
            <div className="form-grid two">
              <div>
                <label>
                  Location (text) <span className="help">(optional)</span>
                </label>
                <input
                  className="input"
                  value={form.location_text || ""}
                  onChange={(e) => set("location_text", e.target.value)}
                  placeholder="Oulu Library"
                />
              </div>

              <div className="form-grid two">
                <div>
                  <label>Latitude (optional)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.0000001"
                    value={form.lat ?? ""}
                    onChange={(e) =>
                      set("lat", e.target.value === "" ? null : Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label>Longitude (optional)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.0000001"
                    value={form.lng ?? ""}
                    onChange={(e) =>
                      set("lng", e.target.value === "" ? null : Number(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="actions">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onDelete}
              disabled={saving}
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
