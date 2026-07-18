export const migration003 = `
CREATE TABLE IF NOT EXISTS feedback (
  id                  TEXT PRIMARY KEY,
  category            TEXT NOT NULL DEFAULT 'general'
                        CHECK (category IN ('bug', 'feature', 'general')),
  message             TEXT NOT NULL,
  app_version         TEXT NOT NULL DEFAULT '',
  platform            TEXT NOT NULL DEFAULT '',
  submitted_to_github INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
`
