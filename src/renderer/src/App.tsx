import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import NoteEditor from './components/NoteEditor'
import NotePreview from './components/NotePreview'
import NoteList from './components/NoteList'
import { useNotes } from './hooks/useNotes'
import { useTopics } from './hooks/useTopics'
import type { NoteContent, NoteFilter } from './types'
import { ArrowLeft } from 'lucide-react'

type View = 'browse' | 'edit'

export default function App() {
  const [view, setView] = useState<View>('browse')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedYearMonth, setSelectedYearMonth] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingNote, setEditingNote] = useState<NoteContent | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [editorBody, setEditorBody] = useState('')

  const filter = useMemo<NoteFilter>(
    () => ({
      topic: selectedTopic || undefined,
      yearMonth: selectedYearMonth || undefined,
      searchQuery: searchQuery || undefined
    }),
    [selectedTopic, selectedYearMonth, searchQuery]
  )

  const { notes, loading, refresh: refreshNotes } = useNotes(filter)
  const { topics, createTopic, refresh: refreshTopics } = useTopics()

  // New note
  const handleNewNote = useCallback(() => {
    setEditingNote(null)
    setEditorBody('')
    setView('edit')
  }, [])

  // Open existing note
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

  // Save note
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
        await refreshNotes()
        await refreshTopics()
      } catch (err) {
        console.error('Failed to save note:', err)
      }
    },
    [editingNote, refreshNotes, refreshTopics]
  )

  // Delete note
  const handleDelete = useCallback(
    async (filePath: string) => {
      try {
        await window.api.deleteNote(filePath)
        await refreshNotes()
        await refreshTopics()
      } catch (err) {
        console.error('Failed to delete note:', err)
      }
    },
    [refreshNotes, refreshTopics]
  )

  // Open in explorer
  const handleOpenInExplorer = useCallback((filePath: string) => {
    window.api.openInExplorer(filePath)
  }, [])

  // Global keyboard shortcut: Ctrl+N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        handleNewNote()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNewNote])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar
        topics={topics}
        selectedTopic={selectedTopic}
        selectedYearMonth={selectedYearMonth}
        onSelectTopic={(t) => {
          setSelectedTopic(t)
          setView('browse')
        }}
        onSelectYearMonth={(ym) => {
          setSelectedYearMonth(ym)
          setView('browse')
        }}
        onCreateTopic={async (name) => {
          await createTopic(name)
        }}
        onNewNote={handleNewNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main content area */}
      <div className="flex-1 flex relative">
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
            {/* Back button */}
            <div className="absolute top-3 left-3 z-10">
              <button
                onClick={() => {
                  setView('browse')
                  setEditingNote(null)
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-accent bg-tag-bg rounded-md hover:bg-sidebar-hover transition-colors"
              >
                <ArrowLeft size={12} />
                Volver
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 pt-8 bg-editor">
              <NoteEditor
                topics={topics}
                editingNote={editingNote}
                onSave={handleSave}
                onCreateTopic={createTopic}
                onBodyChange={setEditorBody}
              />
            </div>

            {/* Preview */}
            <NotePreview
              content={editorBody}
              visible={showPreview}
              onToggle={() => setShowPreview(!showPreview)}
            />
          </>
        )}
      </div>
    </div>
  )
}
