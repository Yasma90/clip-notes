# AGENTS.md

Electron desktop notes app (Electron 32 + React 19 + electron-vite 3 + TS). Paste → Markdown, local synthesis, notes saved as `.md` files on disk.

## Commands

- `npm run dev` — dev with HMR (electron-vite)
- `npm run build` — type-check-ish bundle to `out/` (this is the only build; there are **no test or lint scripts** in the repo)
- Package Windows:
  - `npx electron-builder --win dir` — portable exe (safe)
  - `npx electron-builder --win` — NSIS installer; **needs admin symlink privilege** or Windows dev mode enabled
- `npm run postinstall` runs `electron-builder install-app-deps` after `npm install`

## Architecture

- `src/main/` — main process. All disk access lives here (`services/note-service.ts`, `services/topic-service.ts`). IPC registered once in `ipc-handlers.ts`.
- `src/preload/index.ts` — exposes everything as `window.api` via contextBridge. Renderer **never** uses `fs`/Node directly; go through IPC. Type the API in `src/preload/index.d.ts` when adding a channel.
- `src/renderer/src/` — React app; `@` alias → `src/renderer/src` (configured in both `electron.vite.config.ts` for renderer and `tsconfig.web.json` paths).
- `src/renderer/src/lib/` — pure logic: `clipboard-processor` (Turndown HTML→MD with custom table rules), `synthesizer` (local scoring, ES/EN stopword dictionaries), `topic-detector`.
- Two composite tsconfigs: `tsconfig.node.json` (main+preload), `tsconfig.web.json` (renderer). Typecheck all: `npx tsc -b`.
- Tailwind CSS **v4** (CSS-first): theme tokens (Catppuccin palette) are declared in `src/renderer/src/assets/main.css` under `@theme`. No `tailwind.config.js`.

## Storage & gotchas

- Notes write to the **user's real Documents folder**: `Documents/clip-notes/notes/YYYY-MM/<topic-slug>/YYYY-MM-DD_HHmmss.md` + `topics.json`. Dev runs touch real files.
- Date filtering/grouping deliberately uses **local time, not the UTC ISO prefix** (see comments in `note-service.ts`). Don't "fix" this to UTC — README documents it as intended.
- `updateNote` rewrites the frontmatter `date` to now; `saveNote` auto-registers the topic in `topics.json`.
- UI strings, code, comments, and this file are all in English.
- README in English — it's the source of truth for shortcuts/features; update it if you change them.

## Git workflow (from README)

`main` = production, `develop` = development, `feature/*` / `hotfix/*` branches. Never commit directly to `main` or `develop`.
