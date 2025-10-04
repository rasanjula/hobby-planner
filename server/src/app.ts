// server/src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173"
  })
);

// health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// TODO: add routes here later, e.g.:
// import sessions from "./routes/sessions";
// app.use("/api/sessions", sessions);

export default app;
