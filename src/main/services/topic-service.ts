import { app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'

export interface Topic {
  id: string
  name: string
}

function getTopicsPath(): string {
  return path.join(app.getPath('documents'), 'clip-notes', 'topics.json')
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

async function readTopics(): Promise<Topic[]> {
  try {
    const raw = await fs.readFile(getTopicsPath(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return [{ id: 'general', name: 'General' }]
  }
}

async function writeTopics(topics: Topic[]): Promise<void> {
  const dir = path.dirname(getTopicsPath())
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(getTopicsPath(), JSON.stringify(topics, null, 2), 'utf-8')
}

export async function getTopics(): Promise<(Topic & { noteCount: number })[]> {
  const topics = await readTopics()
  const notesDir = path.join(app.getPath('documents'), 'clip-notes', 'notes')

  const result: (Topic & { noteCount: number })[] = []

  for (const topic of topics) {
    let count = 0
    try {
      const yearMonths = await fs.readdir(notesDir)
      for (const ym of yearMonths) {
        const topicDir = path.join(notesDir, ym, topic.id)
        try {
          const files = await fs.readdir(topicDir)
          count += files.filter((f) => f.endsWith('.md')).length
        } catch {
          // Topic directory doesn't exist for this month
        }
      }
    } catch {
      // Notes directory doesn't exist yet
    }
    result.push({ ...topic, noteCount: count })
  }

  return result
}

export async function createTopic(name: string): Promise<Topic & { noteCount: number }> {
  const topics = await readTopics()
  const id = slugify(name)

  const existing = topics.find((t) => t.id === id)
  if (existing) {
    return { ...existing, noteCount: 0 }
  }

  const newTopic: Topic = { id, name }
  topics.push(newTopic)
  await writeTopics(topics)
  return { ...newTopic, noteCount: 0 }
}

/**
 * Ensures a topic exists in topics.json. Creates it if missing.
 * Used to auto-register topics when saving notes.
 * Accepts either a topic id (slug) or a display name.
 */
export async function ensureTopicExists(nameOrId: string): Promise<void> {
  if (!nameOrId) return
  const topics = await readTopics()
  const id = slugify(nameOrId)

  if (topics.find((t) => t.id === id)) return

  // Use the original name if it differs from the slug; otherwise capitalize
  const displayName = nameOrId === id
    ? nameOrId.charAt(0).toUpperCase() + nameOrId.slice(1)
    : nameOrId

  topics.push({ id, name: displayName })
  await writeTopics(topics)
}
