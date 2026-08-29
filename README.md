# clip-notes

App desktop para capturar, formatear y organizar notas en Markdown.

Peg&aacute; texto desde cualquier sitio (web, email, Word) y se auto-convierte a Markdown. Sintetiz&aacute; el contenido en puntos clave con un click. Todo se guarda como archivos `.md` organizados autom&aacute;ticamente por fecha y tema.

## Stack

- **Electron 32** + **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS v4** (tema oscuro estilo Catppuccin)
- **Turndown** (HTML &rarr; Markdown)
- **gray-matter** (YAML frontmatter)
- **react-markdown** + **remark-gfm** (preview)
- **electron-builder** (empaquetado Windows)

## Ejecutar en desarrollo

```bash
cd c:\Users\Datamart\source\repos\clip-notes
npm install
npm run dev
```

## Generar binario Windows

```bash
npm run build
# Portable (dist/win-unpacked/clip-notes.exe)
npx electron-builder --win dir
# Instalador NSIS (requiere terminal como Administrador)
npx electron-builder --win
```

> **Nota**: El instalador NSIS necesita privilegio `SeCreateSymbolicLinkPrivilege` (crear symlinks). Ejecut&aacute; la terminal como administrador o habilit&aacute; el modo desarrollador de Windows.

## Features

- **Pegar y formatear**: Peg&aacute; HTML desde cualquier fuente &rarr; se convierte a Markdown
- **Sintetizar**: Extrae puntos clave en bullets (algoritmo local, sin API externa). Re-sintetizar **reemplaza** la secci&oacute;n anterior.
- **Guardado inteligente**: `Documentos/clip-notes/notes/YYYY-MM/tema/YYYY-MM-DD_HHmmss.md` con YAML frontmatter (title, date, tags, topic)
- **Auto-detecci&oacute;n de tema**: Al pegar contenido, sugiere un tema basado en el texto. Topics nuevos se registran autom&aacute;ticamente.
- **Navegaci&oacute;n**:
  - Por temas (con conteo de notas)
  - Por fecha jer&aacute;rquica: a&ntilde;o &gt; mes &gt; d&iacute;a
- **Preview en vivo** redimensionable (arrastrar divisor, doble click para resetear)
- **Tags** por nota
- **B&uacute;squeda** por t&iacute;tulo, contenido o tags
- **Filtros locales** (fecha/tema usan tiempo local, no UTC)

## Shortcuts

| Acci&oacute;n              | Tecla           |
|----------------------------|-----------------|
| Nueva nota                 | `Ctrl+N`        |
| Guardar                    | `Ctrl+S`        |
| Sintetizar puntos clave    | `Ctrl+Shift+S`  |
| Toggle preview             | `Ctrl+Shift+P`  |

## Estructura

```
src/
  main/                    Proceso principal Electron
    index.ts               Ventana, lifecycle
    ipc-handlers.ts        IPC main<->renderer
    services/
      note-service.ts      CRUD notas, frontmatter, paths
      topic-service.ts     Gesti&oacute;n de topics.json
  preload/
    index.ts               Bridge tipado (contextBridge)
  renderer/src/
    App.tsx                Layout 3 paneles + estado global
    components/            Sidebar, NoteEditor, NotePreview,
                          NoteList, TopicPicker, EditorToolbar,
                          ResizeDivider
    hooks/                 useNotes, useTopics, useDateGroups
    lib/                   clipboard-processor, synthesizer,
                          topic-detector
    types/                 Tipos compartidos
```

## Almacenamiento

Todo en `Documentos/clip-notes/`:
- `notes/YYYY-MM/topic-slug/YYYY-MM-DD_HHmmss.md` &mdash; notas
- `topics.json` &mdash; temas con display name

Cada nota empieza con frontmatter:
```yaml
---
title: "T&iacute;tulo de la nota"
date: "2026-04-15T11:30:22.000Z"
tags: ["tag1", "tag2"]
topic: "slug-del-tema"
---
```

## Git workflow

- `main` &mdash; producci&oacute;n
- `develop` &mdash; desarrollo
- `feature/*` &mdash; features nuevas
- `hotfix/*` &mdash; bugs de producci&oacute;n

Nunca commit directo a `main` o `develop`.
