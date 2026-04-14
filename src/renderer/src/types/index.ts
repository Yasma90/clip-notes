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

export interface NoteData {
  title: string
  body: string
  topic: string
  tags: string[]
}

export interface NoteFilter {
  topic?: string
  yearMonth?: string
  searchQuery?: string
}

export interface Topic {
  id: string
  name: string
  noteCount: number
}

export interface DateGroup {
  year: number
  months: { month: number; count: number }[]
}

export interface ClipNotesAPI {
  saveNote(note: NoteData): Promise<string>
  updateNote(filePath: string, note: NoteData): Promise<string>
  listNotes(filter?: NoteFilter): Promise<NoteMeta[]>
  readNote(filePath: string): Promise<NoteContent>
  deleteNote(filePath: string): Promise<void>
  getTopics(): Promise<Topic[]>
  createTopic(name: string): Promise<Topic>
  getDateGroups(): Promise<DateGroup[]>
  getNotesDir(): Promise<string>
  openInExplorer(filePath: string): Promise<void>
}

declare global {
  interface Window {
    api: ClipNotesAPI
  }
}
