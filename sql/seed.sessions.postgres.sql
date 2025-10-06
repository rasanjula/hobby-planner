-- sql/seed.sessions.postgres.sql
INSERT INTO sessions
  (id, hobby, title, description, date_time, max_participants, type,
   private_url_code, management_code, location_text, lat, lng)
VALUES
  ('s1abcd123', 'Reading', 'Evening Book Club', 'Discuss short stories.',
   NOW() + INTERVAL '2 day', 12, 'public', NULL, 'mgmtA1B2C3', 'Oulu Library', 65.0120000, 25.4650000),
  ('s2abcd456', 'Hiking', 'Sunday Forest Walk', 'Easy 5km loop.',
   NOW() + INTERVAL '5 day', 20, 'public', NULL, 'mgmtD4E5F6', 'Hupisaaret', 65.0170000, 25.4730000)
ON CONFLICT (id) DO NOTHING;
