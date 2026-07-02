# Personal Tracker

Desktop MVP for macOS built with Tauri, React, TypeScript, and SQLite.

## Features

- Todo Kanban with Backlog, Todo, Doing, and Done columns.
- Pomodoro timer with a 50/10 deep-work preset.
- Notes with Plain and JSON modes, including JSON validation and formatting.
- Local-first SQLite storage in the app data directory.

## Development

Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm run tauri dev
```

Verify frontend and backend:

```bash
npm run build
cd src-tauri
cargo check
```
