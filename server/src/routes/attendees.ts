// server/src/routes/attendees.ts
import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import { pool } from "../db/pool";

const makeId = (len = 12) =>
  crypto.randomBytes(Math.ceil(len * 0.75)).toString("base64url").slice(0, len);

export function registerAttendeeRoutes(app: Express) {
  /**
   * B1 — Join session with capacity guard
   * POST /api/sessions/:id/attendees
   * Body: { display_name?: string }
   * 201 -> { attendeeId, attendanceCode }
   * 404 -> session not found
   * 409 -> { error: "Session is full" }
   */
  app.post("/api/sessions/:id/attendees", async (req: Request, res: Response) => {
    const sessionId = req.params.id; // VARCHAR(20)
    const displayName =
      (req.body?.display_name ?? "").toString().trim().slice(0, 60) || null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lock session to avoid overbooking
      const s = await client.query(
        "SELECT id, max_participants FROM sessions WHERE id = $1 FOR UPDATE",
        [sessionId]
      );
      if (s.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Session not found" });
      }
      const max = s.rows[0].max_participants as number;

      const c = await client.query(
        "SELECT COUNT(*)::int AS count FROM attendees WHERE session_id = $1",
        [sessionId]
      );
      const count = c.rows[0].count as number;
      if (count >= max) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Session is full" });
      }

      const attendeeId = makeId(12);
      const attendanceCode = makeId(12);

      await client.query(
        `INSERT INTO attendees (id, session_id, attendance_code, display_name)
         VALUES ($1, $2, $3, $4)`,
        [attendeeId, sessionId, attendanceCode, displayName]
      );

      await client.query("COMMIT");
      return res.status(201).json({ attendeeId, attendanceCode });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("Join failed:", e);
      return res.status(500).json({ error: "Join failed" });
    } finally {
      client.release();
    }
  });

  /**
   * B4 — Counts for UI
   * GET /api/sessions/:id/attendees/count
   * 200 -> { count, max }
   * 404 -> session not found
   */
  app.get("/api/sessions/:id/attendees/count", async (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const s = await pool.query(
      "SELECT max_participants FROM sessions WHERE id = $1",
      [sessionId]
    );
    if (s.rowCount === 0) return res.status(404).json({ error: "Session not found" });

    const c = await pool.query(
      "SELECT COUNT(*)::int AS count FROM attendees WHERE session_id = $1",
      [sessionId]
    );
    res.json({ count: c.rows[0].count as number, max: s.rows[0].max_participants as number });
  });

  /**
   * B2 — Self leave
   * DELETE /api/sessions/:id/attendees/:aid?attendance=CODE
   * 204 -> ok
   * 404 -> not found or wrong code
   */
  app.delete("/api/sessions/:id/attendees/:aid", async (req: Request, res: Response) => {
    const { id: sessionId, aid: attendeeId } = req.params;
    const attendanceCode = req.query.attendance?.toString();

    if (!attendanceCode)
      return res.status(400).json({ error: "Missing attendance code" });

    try {
      const del = await pool.query(
        "DELETE FROM attendees WHERE id = $1 AND session_id = $2 AND attendance_code = $3",
        [attendeeId, sessionId, attendanceCode]
      );
      if (del.rowCount === 0) return res.status(404).json({ error: "Not found or wrong code" });
      return res.sendStatus(204);
    } catch (err) {
      console.error("Self-leave error:", err);
      return res.status(500).json({ error: "Leave failed" });
    }
  });

  /**
   * B5 — List attendees
   * GET /api/sessions/:id/attendees[?manage=CODE]
   * 200 -> [{ id, display_name, created_at }]
   * public: open
   * private: require manage code
   */
  app.get("/api/sessions/:id/attendees", async (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const manageCode = req.query.manage?.toString();

    try {
      const s = await pool.query(
        "SELECT type, management_code FROM sessions WHERE id = $1",
        [sessionId]
      );
      if (s.rowCount === 0) return res.status(404).json({ error: "Session not found" });

      const { type, management_code } = s.rows[0] as { type: "public" | "private"; management_code: string };

      if (type === "private") {
        if (!manageCode || manageCode !== management_code) {
          return res.status(403).json({ error: "Manage code required" });
        }
      }

      const rows = await pool.query(
        `SELECT id, display_name, created_at
         FROM attendees
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [sessionId]
      );

      return res.json(rows.rows);
    } catch (e) {
      console.error("List attendees error:", e);
      return res.status(500).json({ error: "Failed to list attendees" });
    }
  });

  /**
   * B3 — Creator remove (kick)
   * DELETE /api/sessions/:id/attendees/:aid?manage=CODE
   * 204 -> ok
   * 403 -> wrong manage code
   * 404 -> attendee/session not found
   */
  app.delete("/api/sessions/:id/attendees/:aid", async (req: Request, res: Response) => {
    const { id: sessionId, aid: attendeeId } = req.params;
    const manageCode = req.query.manage?.toString();

    if (!manageCode) return res.status(400).json({ error: "Missing manage code" });

    try {
      const s = await pool.query(
        "SELECT management_code FROM sessions WHERE id = $1",
        [sessionId]
      );
      if (s.rowCount === 0) return res.status(404).json({ error: "Session not found" });

      const { management_code } = s.rows[0] as { management_code: string };
      if (manageCode !== management_code) return res.status(403).json({ error: "Forbidden" });

      const del = await pool.query(
        "DELETE FROM attendees WHERE id = $1 AND session_id = $2",
        [attendeeId, sessionId]
      );
      if (del.rowCount === 0) return res.status(404).json({ error: "Attendee not found" });

      return res.sendStatus(204);
    } catch (e) {
      console.error("Creator remove error:", e);
      return res.status(500).json({ error: "Remove failed" });
    }
  });
}
