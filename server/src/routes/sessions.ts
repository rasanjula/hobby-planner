import { Router, type Request, type Response } from "express";
import type { QueryResult } from "pg";
import { pool } from "../db/pool";
import { nanoid } from "nanoid";

const router = Router();

/* =========================
   Types
   ========================= */
interface SessionRow {
  id: string;
  hobby: string;
  title: string;
  description: string | null;
  date_time: string;          // timestamptz → string
  max_participants: number;
  type: "public" | "private";
  location_text: string | null;
  lat: string | null;         // DECIMAL → string
  lng: string | null;
}

/* =========================
   Sessions: list (public)
   ========================= */
const LIST_PUBLIC_SQL = `
SELECT id, hobby, title, description, date_time, max_participants,
       type, location_text, lat, lng
FROM sessions
WHERE type = 'public'
ORDER BY date_time DESC
`;

router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<SessionRow>(LIST_PUBLIC_SQL);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/sessions failed:", err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

/* =========================
   Sessions: get by ID
   ========================= */
const GET_BY_ID_SQL = `
SELECT id, hobby, title, description, date_time, max_participants,
       type, location_text, lat, lng
FROM sessions
WHERE id = $1
`;

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<SessionRow>(GET_BY_ID_SQL, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/sessions/:id failed:", err);
    res.status(500).json({ error: "Failed to load session" });
  }
});

/* =========================
   Sessions: get by private_url_code
   ========================= */
const GET_BY_CODE_SQL = `
SELECT id, hobby, title, description, date_time, max_participants,
       type, location_text, lat, lng
FROM sessions
WHERE private_url_code = $1
`;

router.get("/code/:code", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<SessionRow>(GET_BY_CODE_SQL, [req.params.code]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/sessions/code/:code failed:", err);
    res.status(500).json({ error: "Failed to load session" });
  }
});

/* =========================
   Sessions: create
   ========================= */
const INSERT_SQL = `
INSERT INTO sessions
  (id, hobby, title, description, date_time, max_participants, type,
   private_url_code, management_code, location_text, lat, lng)
VALUES
  ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
RETURNING id, private_url_code, management_code
`;

type CreateBody = {
  hobby: string;
  title: string;
  description?: string | null;
  date_time: string; // ISO
  max_participants: number;
  type: "public" | "private";
  location_text?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

router.post("/", async (req: Request<{}, {}, CreateBody>, res: Response) => {
  try {
    const b = req.body;
    if (!b?.hobby || !b?.title || !b?.date_time || !b?.max_participants || !b?.type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["public","private"].includes(b.type)) {
      return res.status(400).json({ error: "type must be 'public' or 'private'" });
    }

    const id = nanoid(10);
    const managementCode = nanoid(12);
    const privateUrlCode = b.type === "private" ? nanoid(12) : null;

    const description = b.description ?? null;
    const locationText = b.location_text ?? null;
    const lat = b.lat ?? null;
    const lng = b.lng ?? null;

    const params = [
      id, b.hobby, b.title, description,
      b.date_time, b.max_participants, b.type,
      privateUrlCode, managementCode, locationText, lat, lng
    ];

    const { rows } = await pool.query(INSERT_SQL, params);
    const out = rows[0];

    res.status(201).json({
      id,
      managementCode: out.management_code,
      privateUrlCode: out.private_url_code ?? undefined,
      manageUrl: `/session/${id}/manage?code=${managementCode}`,
    });
  } catch (err) {
    console.error("POST /api/sessions failed:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

/* =========================
   Attendance: join
   ========================= */
/**
 * POST /api/sessions/:id/attendees
 * body: { display_name?: string }
 * returns: { attendeeId, attendanceCode }
 */
type JoinBody = { display_name?: string | null };

const GET_SESSION_SQL = `
SELECT id, max_participants, management_code, type
FROM sessions
WHERE id = $1
`;

const COUNT_ATTENDEES_SQL = `
SELECT COUNT(*)::int AS count
FROM attendees
WHERE session_id = $1
`;

const INSERT_ATTENDEE_SQL = `
INSERT INTO attendees (id, session_id, attendance_code, display_name)
VALUES ($1, $2, $3, $4)
RETURNING id
`;

router.post("/:id/attendees", async (req: Request<{id: string}, {}, JoinBody>, res: Response) => {
  try {
    const sid = req.params.id;

    const sRes = await pool.query(GET_SESSION_SQL, [sid]);
    if (sRes.rowCount === 0) return res.status(404).json({ error: "Session not found" });

    const session = sRes.rows[0] as { id: string; max_participants: number; management_code: string };
    const cRes: QueryResult<{ count: number }> = await pool.query(COUNT_ATTENDEES_SQL, [sid]);
    const current = cRes.rows[0]?.count ?? 0;

    if (current >= session.max_participants) {
      return res.status(409).json({ error: "Session is full" });
    }

    const attendeeId = nanoid(10);
    const attendanceCode = nanoid(12);
    const displayName = req.body?.display_name ?? null;

    const iRes = await pool.query(INSERT_ATTENDEE_SQL, [attendeeId, sid, attendanceCode, displayName]);
    if (iRes.rowCount !== 1) {
      return res.status(500).json({ error: "Failed to join" });
    }

    res.status(201).json({ attendeeId, attendanceCode });
  } catch (err) {
    console.error("POST /api/sessions/:id/attendees failed:", err);
    res.status(500).json({ error: "Join failed" });
  }
});

/* =========================
   Attendance: list (names only) with visibility rules
   ========================= */
/**
 * GET /api/sessions/:id/attendees
 * Public sessions: anyone can see names
 * Private sessions: require ?manage=CODE (creator only)
 * Returns: [{ id, display_name, created_at }]
 */
router.get("/:id/attendees", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sid = req.params.id;

    const sRes = await pool.query(
      `SELECT type, management_code FROM sessions WHERE id = $1`,
      [sid]
    );
    if (sRes.rowCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const { type, management_code } = sRes.rows[0] as {
      type: "public" | "private";
      management_code: string;
    };

    if (type === "private") {
      const manage = (req.query.manage as string) || "";
      if (manage !== management_code) {
        return res
          .status(403)
          .json({ error: "Manage code required for private session attendees" });
      }
    }

    const aRes = await pool.query(
      `SELECT id, display_name, created_at
       FROM attendees
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sid]
    );

    res.json(
      aRes.rows.map((r) => ({
        id: r.id,
        display_name: r.display_name || "(anonymous)",
        created_at: r.created_at,
      }))
    );
  } catch (err) {
    console.error("GET /api/sessions/:id/attendees failed:", err);
    res.status(500).json({ error: "Failed to load attendees" });
  }
});

/* =========================
   Attendance: self leave / manager remove
   ========================= */
/**
 * DELETE /api/sessions/:id/attendees/:aid?attendance=CODE
 * or      /api/sessions/:id/attendees/:aid?manage=CODE
 */
const DELETE_SELF_SQL = `
DELETE FROM attendees
WHERE session_id = $1 AND id = $2 AND attendance_code = $3
`;

router.delete("/:id/attendees/:aid", async (req: Request<{id: string, aid: string}, {}, {}>, res: Response) => {
  try {
    const sid = req.params.id;
    const aid = req.params.aid;
    const attendanceCode = (req.query.attendance as string) || null;
    const manageCode = (req.query.manage as string) || null;

    if (attendanceCode) {
      const dRes = await pool.query(DELETE_SELF_SQL, [sid, aid, attendanceCode]);
      if (dRes.rowCount === 0) return res.status(404).json({ error: "Not found or code mismatch" });
      return res.status(204).send();
    }

    if (manageCode) {
      const sRes = await pool.query(GET_SESSION_SQL, [sid]);
      if (sRes.rowCount === 0) return res.status(404).json({ error: "Session not found" });
      const session = sRes.rows[0] as { management_code: string };
      if (session.management_code !== manageCode) {
        return res.status(403).json({ error: "Invalid manage code" });
      }
      const dRes = await pool.query(`DELETE FROM attendees WHERE session_id=$1 AND id=$2`, [sid, aid]);
      if (dRes.rowCount === 0) return res.status(404).json({ error: "Attendee not found" });
      return res.status(204).send();
    }

    return res.status(400).json({ error: "Provide attendance=CODE or manage=CODE" });
  } catch (err) {
    console.error("DELETE /api/sessions/:id/attendees/:aid failed:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

/* =========================
   Attendance: count
   ========================= */
/**
 * GET /api/sessions/:id/attendees/count  -> { count, max }
 */
router.get("/:id/attendees/count", async (req: Request<{id: string}>, res: Response) => {
  try {
    const sid = req.params.id;
    const sRes = await pool.query(GET_SESSION_SQL, [sid]);
    if (sRes.rowCount === 0) return res.status(404).json({ error: "Session not found" });
    const max = sRes.rows[0].max_participants as number;
    const cRes: QueryResult<{ count: number }> = await pool.query(COUNT_ATTENDEES_SQL, [sid]);
    const count = cRes.rows[0]?.count ?? 0;
    res.json({ count, max });
  } catch (err) {
    console.error("GET /api/sessions/:id/attendees/count failed:", err);
    res.status(500).json({ error: "Count failed" });
  }
});

/* =========================
   Manage: patch
   ========================= */
type PatchBody = Partial<{
  hobby: string;
  title: string;
  description: string | null;
  date_time: string; // ISO
  max_participants: number;
  type: "public" | "private";
  location_text: string | null;
  lat: number | string | null;
  lng: number | string | null;
}>;

const GET_MANAGE_SQL = `
SELECT id, management_code
FROM sessions
WHERE id = $1
`;

router.patch("/:id", async (req: Request<{id: string}, {}, PatchBody>, res: Response) => {
  try {
    const sid = req.params.id;
    const manage = req.query.manage as string | undefined;
    if (!manage) return res.status(400).json({ error: "Missing manage code" });

    const sRes = await pool.query(GET_MANAGE_SQL, [sid]);
    if (sRes.rowCount === 0) return res.status(404).json({ error: "Session not found" });

    const { management_code } = sRes.rows[0] as { management_code: string };
    if (management_code !== manage) return res.status(403).json({ error: "Invalid manage code" });

    const allowed: (keyof PatchBody)[] = [
      "hobby","title","description","date_time","max_participants","type","location_text","lat","lng"
    ];

    const body = req.body || {};
    const entries = Object.entries(body).filter(([k,v]) => allowed.includes(k as keyof PatchBody) && v !== undefined);
    if (entries.length === 0) return res.status(400).json({ error: "No valid fields to update" });

    const sets: string[] = [];
    const params: any[] = [];
    entries.forEach(([k,v], i) => {
      sets.push(`${k} = $${i+1}`);
      params.push(v);
    });
    params.push(sid);

    const UPDATE_SQL = `UPDATE sessions SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING
      id, hobby, title, description, date_time, max_participants, type, location_text, lat, lng
    `;

    const uRes = await pool.query(UPDATE_SQL, params);
    res.json(uRes.rows[0]);
  } catch (err) {
    console.error("PATCH /api/sessions/:id failed:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

/* =========================
   Manage: delete
   ========================= */
/**
 * DELETE /api/sessions/:id?manage=CODE
 */
router.delete("/:id", async (req: Request<{id: string}>, res: Response) => {
  try {
    const sid = req.params.id;
    const manage = req.query.manage as string | undefined;
    if (!manage) return res.status(400).json({ error: "Missing manage code" });

    const sRes = await pool.query(GET_MANAGE_SQL, [sid]);
    if (sRes.rowCount === 0) return res.status(404).json({ error: "Session not found" });

    const { management_code } = sRes.rows[0] as { management_code: string };
    if (management_code !== manage) return res.status(403).json({ error: "Invalid manage code" });

    const dRes = await pool.query(`DELETE FROM sessions WHERE id = $1`, [sid]);
    if (dRes.rowCount === 0) return res.status(404).json({ error: "Not deleted" });

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/sessions/:id failed:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
