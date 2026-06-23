# StudyTracker

A minimal, offline-first study session tracker built for deep focus. 

## Features
- **Dashboard**: Command center displaying today's operational metrics and a mini momentum grid.
- **Timer**: Keyboard-driven (Spacebar) Pomodoro and Short Break timer.
- **Constitution**: A minimal rules page for your personal axioms.
- **Streaks**: A 52-week GitHub-style contribution grid of your focus time.
- **Todo**: Simple, stripped-down task management.

## Tech Stack
- Electron + React + TypeScript
- better-sqlite3 (Fully Offline)
- Tailwind CSS v4 + Framer Motion
- electron-vite build tooling

## Setup & Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Building & Packaging

The application is configured to build natively for macOS, Windows, and Linux via `electron-builder`.

To compile the React bundle and package the application into a standalone executable:

```bash
npm run build
```

The output artifacts (e.g. `.exe` for Windows) will be located in the `dist` directory.

> **Note**: Building the application compiles native modules (like `better-sqlite3`) for the target architecture. Ensure you have the appropriate C++ build tools installed on your host system if `better-sqlite3` needs to compile from source.
