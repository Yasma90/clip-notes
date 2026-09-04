import { app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { format } from 'date-fns'
import { ensureTopicExists } from './topic-service'

const DEFAULT_TITLE = 'Untitled'
const DEFAULT_TOPIC = 'general'

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
  date?: string // YYYY-MM-DD for day-level filtering
  searchQuery?: string
}

export interface DateGroup {
  year: number
  months: {
    month: number
    count: number
    days: { day: number; count: number }[]
  }[]
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
    || DEFAULT_TOPIC
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** Local (not UTC) `YYYY-MM` key so grouping matches getDateGroups(). */
function toLocalYearMonth(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

/** Local (not UTC) `YYYY-MM-DD` key so filtering matches getDateGroups(). */
function toLocalDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
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
  const topicName = note.topic || DEFAULT_TOPIC
  const topicSlug = slugify(topicName)

  // Auto-register topic in topics.json so it shows up in sidebar
  await ensureTopicExists(topicName)

  const dir = path.join(notesDir, yearMonth, topicSlug)
  await ensureDir(dir)

  const filePath = path.join(dir, `${timestamp}.md`)

  const frontmatter = {
    title: note.title || DEFAULT_TITLE,
    date: now.toISOString(),
    tags: note.tags,
    topic: topicSlug
  }

  const fileContent = matter.stringify(note.body, frontmatter)
  await fs.writeFile(filePath, fileContent, 'utf-8')
  return filePath
}

export async function updateNote(filePath: string, note: NoteData): Promise<string> {
  const topicName = note.topic || DEFAULT_TOPIC
  await ensureTopicExists(topicName)

  const frontmatter = {
    title: note.title || DEFAULT_TITLE,
    date: new Date().toISOString(),
    tags: note.tags,
    topic: slugify(topicName)
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
  // Compare against LOCAL date components (not the UTC ISO prefix) so that
  // day/month grouping matches what getDateGroups() produces.
  if (filter?.yearMonth) {
    filtered = filtered.filter((n) => n.date && toLocalYearMonth(n.date) === filter.yearMonth)
  }
  if (filter?.date) {
    filtered = filtered.filter((n) => n.date && toLocalDate(n.date) === filter.date)
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

  // year -> month -> day -> count
  const groupMap = new Map<number, Map<number, Map<number, number>>>()

  for (const filePath of files) {
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const { data } = matter(raw)
      if (data.date) {
        const d = new Date(data.date)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const day = d.getDate()

        if (!groupMap.has(year)) groupMap.set(year, new Map())
        const monthMap = groupMap.get(year)!

        if (!monthMap.has(month)) monthMap.set(month, new Map())
        const dayMap = monthMap.get(month)!

        dayMap.set(day, (dayMap.get(day) || 0) + 1)
      }
    } catch {
      // Skip
    }
  }

  const groups: DateGroup[] = []
  for (const [year, monthMap] of groupMap) {
    const months = Array.from(monthMap.entries())
      .map(([month, dayMap]) => {
        const days = Array.from(dayMap.entries())
          .map(([day, count]) => ({ day, count }))
          .sort((a, b) => b.day - a.day)
        const count = days.reduce((sum, d) => sum + d.count, 0)
        return { month, count, days }
      })
      .sort((a, b) => b.month - a.month)
    groups.push({ year, months })
  }

  return groups.sort((a, b) => b.year - a.year)
}

export { getNotesDir }
