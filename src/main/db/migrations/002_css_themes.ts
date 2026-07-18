export const migration002 = `
CREATE TABLE IF NOT EXISTS css_themes (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  css        TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_css_themes_name ON css_themes(name);
`
