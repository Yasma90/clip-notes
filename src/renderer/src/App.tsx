import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import NoteEditor from './components/NoteEditor'
import NotePreview from './components/NotePreview'
import NoteList from './components/NoteList'
import ResizeDivider from './components/ResizeDivider'
import { useNotes } from './hooks/useNotes'
import { useTopics } from './hooks/useTopics'
import { useDateGroups } from './hooks/useDateGroups'
import type { NoteContent, NoteFilter } from './types'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

type View = 'browse' | 'edit'

const DEFAULT_PREVIEW_WIDTH = 480
const MIN_PREVIEW_WIDTH = 200
const STORAGE_KEY = 'clip-notes.previewWidth'

export default function App() {
  const [view, setView] = useState<View>('browse')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedYearMonth, setSelectedYearMonth] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingNote, setEditingNote] = useState<NoteContent | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [editorBody, setEditorBody] = useState('')

  // Load persisted preview width
  const [previewWidth, setPreviewWidth] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const n = stored ? parseInt(stored, 10) : DEFAULT_PREVIEW_WIDTH
    return Number.isFinite(n) && n >= MIN_PREVIEW_WIDTH ? n : DEFAULT_PREVIEW_WIDTH
  })

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(previewWidth))
  }, [previewWidth])

  const handlePreviewResize = useCallback((delta: number) => {
    // Dragging right (positive delta) shrinks the preview; dragging left grows it
    setPreviewWidth((prev) => {
      const container = containerRef.current
      const maxWidth = container ? container.clientWidth - 320 : 1200
      const next = Math.min(Math.max(prev - delta, MIN_PREVIEW_WIDTH), maxWidth)
      return next
    })
  }, [])

  const resetPreviewWidth = useCallback(() => {
    setPreviewWidth(DEFAULT_PREVIEW_WIDTH)
  }, [])

  // When a specific day is selected, use `date` filter only (it's more
  // specific). When only a month is selected, use `yearMonth`.  Never both.
  const filter = useMemo<NoteFilter>(
    () => ({
      topic: selectedTopic || undefined,
      yearMonth: selectedDate ? undefined : (selectedYearMonth || undefined),
      date: selectedDate || undefined,
      searchQuery: searchQuery || undefined
    }),
    [selectedTopic, selectedYearMonth, selectedDate, searchQuery]
  )

  const { notes, loading, refresh: refreshNotes } = useNotes(filter)
  const { topics, createTopic, refresh: refreshTopics } = useTopics()
  const { dateGroups, refresh: refreshDateGroups } = useDateGroups()

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshNotes(), refreshTopics(), refreshDateGroups()])
  }, [refreshNotes, refreshTopics, refreshDateGroups])

  const handleNewNote = useCallback(() => {
    setEditingNote(null)
    setEditorBody('')
    setView('edit')
  }, [])

  const handleSelectNote = useCallback(async (filePath: string) => {
    try {
      const note = await window.api.readNote(filePath)
      setEditingNote(note)
      setEditorBody(note.body)
      setView('edit')
    } catch (err) {
      console.error('Failed to read note:', err)
    }
  }, [])

  const handleSave = useCallback(
    async (data: { title: string; body: string; topic: string; tags: string[] }) => {
      try {
        if (editingNote?.filePath) {
          await window.api.updateNote(editingNote.filePath, data)
        } else {
          const filePath = await window.api.saveNote(data)
          const saved = await window.api.readNote(filePath)
          setEditingNote(saved)
        }
        setEditorBody(data.body)
        await refreshAll()
      } catch (err) {
        console.error('Failed to save note:', err)
      }
    },
    [editingNote, refreshAll]
  )

  const handleDelete = useCallback(
    async (filePath: string) => {
      try {
        await window.api.deleteNote(filePath)
        await refreshAll()
      } catch (err) {
        console.error('Failed to delete note:', err)
      }
    },
    [refreshAll]
  )

  const handleOpenInExplorer = useCallback((filePath: string) => {
    window.api.openInExplorer(filePath)
  }, [])

  const handleSelectTopic = useCallback((t: string | null) => {
    setSelectedTopic(t)
    setView('browse')
  }, [])

  const handleSelectYearMonth = useCallback((ym: string | null) => {
    setSelectedYearMonth(ym)
    // Clicking on a month always clears the day selection
    setSelectedDate(null)
    setView('browse')
  }, [])

  const handleSelectDate = useCallback((date: string | null) => {
    setSelectedDate(date)
    // Keep the parent month expanded but the filter uses date only
    if (date) setSelectedYearMonth(date.slice(0, 7))
    setView('browse')
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        handleNewNote()
      }
      // Ctrl+P toggle preview
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setShowPreview((p) => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNewNote])

  return (
    <div className="flex h-full">
      <Sidebar
        topics={topics}
        dateGroups={dateGroups}
        selectedTopic={selectedTopic}
        selectedYearMonth={selectedYearMonth}
        selectedDate={selectedDate}
        onSelectTopic={handleSelectTopic}
        onSelectYearMonth={handleSelectYearMonth}
        onSelectDate={handleSelectDate}
        onCreateTopic={async (name) => {
          await createTopic(name)
        }}
        onNewNote={handleNewNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main content area */}
      <div ref={containerRef} className="flex-1 flex relative min-w-0">
        {view === 'browse' ? (
          <NoteList
            notes={notes}
            loading={loading}
            onSelect={handleSelectNote}
            onDelete={handleDelete}
            onOpenInExplorer={handleOpenInExplorer}
          />
        ) : (
          <>
            {/* Top bar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <button
                onClick={() => {
                  setView('browse')
                  setEditingNote(null)
                }}
                className="pointer-events-auto flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-accent bg-tag-bg rounded-md hover:bg-sidebar-hover transition-colors"
              >
                <ArrowLeft size={12} />
                Back
              </button>
              <button
                onClick={() => setShowPreview((p) => !p)}
                className="pointer-events-auto p-1.5 rounded-md bg-tag-bg text-text-muted hover:text-accent hover:bg-sidebar-hover transition-colors"
                title={showPreview ? 'Hide preview (Ctrl+Shift+P)' : 'Show preview (Ctrl+Shift+P)'}
              >
                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 min-w-0 pt-8 bg-editor">
              <NoteEditor
                topics={topics}
                editingNote={editingNote}
                onSave={handleSave}
                onCreateTopic={createTopic}
                onBodyChange={setEditorBody}
              />
            </div>

            {/* Resizable Preview */}
            {showPreview && (
              <>
                <ResizeDivider
                  onResize={handlePreviewResize}
                  onDoubleClick={resetPreviewWidth}
                />
                <NotePreview content={editorBody} width={previewWidth} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
