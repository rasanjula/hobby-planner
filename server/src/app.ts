// server/src/app.ts
import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import sessionsRouter from "./routes/sessions";
import { registerAttendeeRoutes } from "./routes/attendees"; // ⬅️ NEW

dotenv.config();

const app = express();

// middleware (order matters)
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// mount existing session routes under /api/sessions
app.use("/api/sessions", sessionsRouter);

// mount attendee routes (they register absolute paths like /api/sessions/:id/attendees)
registerAttendeeRoutes(app); // ⬅️ NEW

export default app;
