# clip-notes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Desktop app for capturing, formatting, and organizing notes in Markdown.

Paste text from anywhere (web, email, Word) and it auto-converts to Markdown. Synthesize the content into key points with one click. Everything is saved as `.md` files automatically organized by date and topic.

## Stack

- **Electron 32** + **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS v4** (Catppuccin-style dark theme)
- **Turndown** (HTML &rarr; Markdown)
- **gray-matter** (YAML frontmatter)
- **react-markdown** + **remark-gfm** (preview)
- **electron-builder** (Windows packaging)

## Run in development

```bash
git clone https://github.com/Yasma90/clip-notes.git
cd clip-notes
npm install
npm run dev
```

## Generate Windows binary

```bash
npm run build
# Portable (dist/win-unpacked/clip-notes.exe)
npx electron-builder --win dir
# NSIS Installer (requires terminal as Administrator)
npx electron-builder --win
```

> **Note**: The NSIS installer needs `SeCreateSymbolicLinkPrivilege` (create symlinks). Run the terminal as administrator or enable Windows developer mode.

## Features

- **Paste & Format**: Paste HTML from any source &rarr; converts to Markdown
- **Synthesize**: Extracts key points into bullets (local algorithm, no external API). Re-synthesizing **replaces** the previous section.
- **Smart Save**: `Documents/clip-notes/notes/YYYY-MM/topic/YYYY-MM-DD_HHmmss.md` with YAML frontmatter (title, date, tags, topic)
- **Auto-topic detection**: Suggests a topic based on text when pasting. New topics are automatically registered.
- **Navigation**:
  - By topics (with note count)
  - By hierarchical date: year > month > day
- **Live Preview** resizable (drag divider, double click to reset)
- **Tags** per note
- **Search** by title, content, or tags
- **Local Filters** (date/topic use local time, not UTC)

## Shortcuts

| Action                     | Shortcut        |
|----------------------------|-----------------|
| New note                   | `Ctrl+N`        |
| Save                       | `Ctrl+S`        |
| Synthesize key points      | `Ctrl+Shift+S`  |
| Toggle preview             | `Ctrl+Shift+P`  |

## Structure

```
src/
  main/                    Electron main process
    index.ts               Window, lifecycle
    ipc-handlers.ts        IPC main<->renderer
    services/
      note-service.ts      Notes CRUD, frontmatter, paths
      topic-service.ts     topics.json management
  preload/
    index.ts               Typed bridge (contextBridge)
  renderer/src/
    App.tsx                3-panel layout + global state
    components/            Sidebar, NoteEditor, NotePreview,
                          NoteList, TopicPicker, EditorToolbar,
                          ResizeDivider
    hooks/                 useNotes, useTopics, useDateGroups
    lib/                   clipboard-processor, synthesizer,
                          topic-detector
    types/                 Shared types
```

## Storage

Everything in `Documents/clip-notes/`:
- `notes/YYYY-MM/topic-slug/YYYY-MM-DD_HHmmss.md` &mdash; notes
- `topics.json` &mdash; topics with display name

Each note starts with frontmatter:
```yaml
---
title: "Note title"
date: "2026-04-15T11:30:22.000Z"
tags: ["tag1", "tag2"]
topic: "topic-slug"
---
```

## Git workflow

- `main` &mdash; production
- `develop` &mdash; development
- `feature/*` &mdash; new features
- `hotfix/*` &mdash; production bugs

Never commit directly to `main` or `develop`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
