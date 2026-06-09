# md-to-pdf

Electron desktop app for converting Markdown files to PDF. Supports batch conversion, a built-in editor with live preview, CSS theme customization, and version tracking per document.

## Features

- **Batch conversion** — convert one file or a whole folder in one pass
- **Quick Convert** — single-document workflow from the dashboard
- **Editor** — CodeMirror-based Markdown editor with live PDF preview
- **Themes** — CSS-based PDF themes, editable in-app
- **Version history** — per-document conversion history stored in SQLite
- **Offline** — no network required; runs entirely on-device

## Stack

- Electron + electron-vite
- React 19, React Router, Tailwind CSS v4, shadcn/ui (Radix)
- CodeMirror 6 (editor)
- `marked` + `rehype` (Markdown → HTML → PDF)
- `better-sqlite3` (local storage)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run dist        # macOS .dmg
npm run build       # compiled output only (no installer)
```

Requires macOS for the `--mac` build target.

## Project structure

```
src/
├── main/           # Electron main process
│   ├── pdf/        # Markdown → PDF pipeline
│   ├── db/         # SQLite schema and queries
│   └── ipc/        # IPC handlers
└── renderer/       # React frontend
    ├── pages/      # Dashboard, Editor, QuickConvert, Styles, Versions
    ├── components/
    └── hooks/
```
