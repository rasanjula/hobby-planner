import { Router, type Request, type Response } from "express";
import { pool } from "../db/pool";
import { nanoid } from "nanoid";
const router = Router();
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
/** LIST public */
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
/** GET by ID */
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
/** GET by private_url_code */
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
/** POST create */
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
export default router;
