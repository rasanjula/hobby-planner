-- 1) Table
CREATE TABLE IF NOT EXISTS sessions (
  id               VARCHAR(20)  PRIMARY KEY,
  hobby            VARCHAR(50)  NOT NULL,
  title            VARCHAR(120) NOT NULL,
  description      TEXT,
  date_time        TIMESTAMPTZ  NOT NULL,
  max_participants INT          NOT NULL,
  type             TEXT         NOT NULL DEFAULT 'public' CHECK (type IN ('public','private')),
  private_url_code VARCHAR(20)  UNIQUE,
  management_code  VARCHAR(20)  NOT NULL,
  location_text    VARCHAR(120),
  lat              DECIMAL(10,7),
  lng              DECIMAL(10,7),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2) Helpful index
CREATE INDEX IF NOT EXISTS idx_sessions_public ON sessions(type, date_time);

-- 3) updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Trigger
DROP TRIGGER IF EXISTS trg_sessions_updated_at ON sessions;
CREATE TRIGGER trg_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
