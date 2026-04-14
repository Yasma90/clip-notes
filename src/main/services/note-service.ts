import { app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { format } from 'date-fns'

export interface NoteData {
  title: string
  body: string
  topic: string
  tags: string[]
}

export interface NoteMeta {
  filePath: string
  title: string
  date: string
  topic: string
  tags: string[]
  excerpt: string
}

export interface NoteContent extends NoteMeta {
  body: string
}

export interface NoteFilter {
  topic?: string
  yearMonth?: string
  searchQuery?: string
}

export interface DateGroup {
  year: number
  months: { month: number; count: number }[]
}

function getNotesDir(): string {
  return path.join(app.getPath('documents'), 'clip-notes', 'notes')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'general'
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

async function getAllMdFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...(await getAllMdFiles(full)))
      } else if (entry.name.endsWith('.md')) {
        results.push(full)
      }
    }
  } catch {
    // Directory doesn't exist yet
  }
  return results
}

function parseNoteFile(filePath: string, raw: string): NoteContent {
  const { data, content } = matter(raw)
  const body = content.trim()
  return {
    filePath,
    title: data.title || path.basename(filePath, '.md'),
    date: data.date || '',
    topic: data.topic || 'general',
    tags: Array.isArray(data.tags) ? data.tags : [],
    excerpt: body.slice(0, 150).replace(/\n/g, ' '),
    body
  }
}

export async function saveNote(note: NoteData): Promise<string> {
  const notesDir = getNotesDir()
  const now = new Date()
  const yearMonth = format(now, 'yyyy-MM')
  const timestamp = format(now, 'yyyy-MM-dd_HHmmss')
  const topicSlug = slugify(note.topic || 'general')

  const dir = path.join(notesDir, yearMonth, topicSlug)
  await ensureDir(dir)

  const filePath = path.join(dir, `${timestamp}.md`)

  const frontmatter = {
    title: note.title || 'Sin título',
    date: now.toISOString(),
    tags: note.tags,
    topic: topicSlug
  }

  const fileContent = matter.stringify(note.body, frontmatter)
  await fs.writeFile(filePath, fileContent, 'utf-8')
  return filePath
}

export async function updateNote(filePath: string, note: NoteData): Promise<string> {
  const frontmatter = {
    title: note.title || 'Sin título',
    date: new Date().toISOString(),
    tags: note.tags,
    topic: slugify(note.topic || 'general')
  }

  const fileContent = matter.stringify(note.body, frontmatter)
  await fs.writeFile(filePath, fileContent, 'utf-8')
  return filePath
}

export async function listNotes(filter?: NoteFilter): Promise<NoteMeta[]> {
  const notesDir = getNotesDir()
  const files = await getAllMdFiles(notesDir)

  const notes: NoteMeta[] = []
  for (const filePath of files) {
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const note = parseNoteFile(filePath, raw)
      notes.push(note)
    } catch {
      // Skip unreadable files
    }
  }

  let filtered = notes

  if (filter?.topic) {
    filtered = filtered.filter((n) => n.topic === filter.topic)
  }
  if (filter?.yearMonth) {
    filtered = filtered.filter((n) => n.date.startsWith(filter.yearMonth!))
  }
  if (filter?.searchQuery) {
    const q = filter.searchQuery.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  return filtered.sort((a, b) => (b.date > a.date ? 1 : -1))
}

export async function readNote(filePath: string): Promise<NoteContent> {
  const raw = await fs.readFile(filePath, 'utf-8')
  return parseNoteFile(filePath, raw)
}

export async function deleteNote(filePath: string): Promise<void> {
  await fs.unlink(filePath)
}

export async function getDateGroups(): Promise<DateGroup[]> {
  const notesDir = getNotesDir()
  const files = await getAllMdFiles(notesDir)
  const groupMap = new Map<number, Map<number, number>>()

  for (const filePath of files) {
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const { data } = matter(raw)
      if (data.date) {
        const d = new Date(data.date)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        if (!groupMap.has(year)) groupMap.set(year, new Map())
        const monthMap = groupMap.get(year)!
        monthMap.set(month, (monthMap.get(month) || 0) + 1)
      }
    } catch {
      // Skip
    }
  }

  const groups: DateGroup[] = []
  for (const [year, monthMap] of groupMap) {
    const months = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month - a.month)
    groups.push({ year, months })
  }

  return groups.sort((a, b) => b.year - a.year)
}

export { getNotesDir }
