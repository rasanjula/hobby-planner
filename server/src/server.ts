import app from "./app";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

// AI-Assisted: basic pg pool bootstrap
export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 10
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
