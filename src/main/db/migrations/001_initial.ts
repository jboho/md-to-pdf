export const migration001 = `
CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'archived')),
  custom_css  TEXT NOT NULL DEFAULT '',
  theme       TEXT NOT NULL DEFAULT 'github'
                CHECK (theme IN ('github', 'academic', 'minimal', 'manuscript')),
  page_size   TEXT NOT NULL DEFAULT 'A4'
                CHECK (page_size IN ('A4', 'Letter', 'Legal', 'A3')),
  margin_top    REAL NOT NULL DEFAULT 20.0,
  margin_right  REAL NOT NULL DEFAULT 20.0,
  margin_bottom REAL NOT NULL DEFAULT 20.0,
  margin_left   REAL NOT NULL DEFAULT 20.0,
  output_dir  TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'editing', 'ready', 'converting', 'converted', 'error')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_files_task_id ON files(task_id);
CREATE INDEX IF NOT EXISTS idx_files_task_status ON files(task_id, status);

CREATE TABLE IF NOT EXISTS file_versions (
  id         TEXT PRIMARY KEY,
  file_id    TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_versions_file_created ON file_versions(file_id, created_at);
`
