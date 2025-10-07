-- sql/tables.attendees.postgres.sql
CREATE TABLE IF NOT EXISTS attendees (
  id              VARCHAR(20) PRIMARY KEY,
  session_id      VARCHAR(20) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  attendance_code VARCHAR(20) NOT NULL UNIQUE,
  display_name    VARCHAR(60),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- fast lookups & counts per session
CREATE INDEX IF NOT EXISTS idx_attendees_session_id ON attendees(session_id);
