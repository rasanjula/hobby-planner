import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app"; // ensure app.ts exports the express app
import { pool } from "../src/db/pool";
describe("sessions API", () => {
  afterAll(async () => { await pool.end(); });
  it("lists public sessions", async () => {
    const res = await request(app).get("/api/sessions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  it("create + guard patch with wrong manage code", async () => {
    const create = await request(app).post("/api/sessions").send({
      hobby: "Reading",
      title: "Test Day5",
      date_time: new Date(Date.now()+3600_000).toISOString(),
      max_participants: 5,
      type: "public"
    });
    expect(create.status).toBe(201);
    const id = create.body.id;
    const patch = await request(app).patch(`/api/sessions/${id}?manage=WRONG`).send({ title: "nope" });
    expect(patch.status).toBe(403);
  });
});