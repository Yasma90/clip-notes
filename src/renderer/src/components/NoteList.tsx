import { format, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { FileText, Trash2, FolderOpen } from 'lucide-react'
import type { NoteMeta } from '../types'

interface Props {
  notes: NoteMeta[]
  loading: boolean
  onSelect: (filePath: string) => void
  onDelete: (filePath: string) => void
  onOpenInExplorer: (filePath: string) => void
}

export default function NoteList({
  notes,
  loading,
  onSelect,
  onDelete,
  onOpenInExplorer
}: Props) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-text-muted">Loading notes...</p>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <FileText size={40} className="text-text-muted/30" />
        <p className="text-sm text-text-muted">No notes</p>
        <p className="text-xs text-text-muted/60 text-center">
          Create a new note with the + button or press Ctrl+N
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid gap-2">
        {notes.map((note) => {
          let dateStr = ''
          try {
            dateStr = format(parseISO(note.date), "MMM d yyyy, HH:mm", { locale: enUS })
          } catch {
            dateStr = note.date
          }

          return (
            <button
              key={note.filePath}
              onClick={() => onSelect(note.filePath)}
              className="w-full text-left p-3 bg-sidebar rounded-lg border border-border hover:border-accent/40 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-bright truncate">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-tag-bg text-tag-text rounded">
                      {note.topic}
                    </span>
                    <span className="text-[10px] text-text-muted">{dateStr}</span>
                  </div>
                  {note.excerpt && (
                    <p className="text-xs text-text-muted mt-1.5 line-clamp-2">
                      {note.excerpt}
                    </p>
                  )}
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1 py-0.5 bg-surface text-text-muted rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenInExplorer(note.filePath)
                    }}
                    className="p-1 rounded hover:bg-sidebar-hover text-text-muted hover:text-accent transition-colors"
                    title="Open in explorer"
                  >
                    <FolderOpen size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(note.filePath)
                    }}
                    className="p-1 rounded hover:bg-sidebar-hover text-text-muted hover:text-danger transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
