import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import type { Topic } from '../types'

interface Props {
  topics: Topic[]
  value: string
  onChange: (topicId: string) => void
  onCreateTopic: (name: string) => Promise<Topic>
}

export default function TopicPicker({ topics, value, onChange, onCreateTopic }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = topics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedName = topics.find((t) => t.id === value)?.name || value || 'Seleccionar tema'

  const handleCreate = async () => {
    if (search.trim()) {
      const topic = await onCreateTopic(search.trim())
      onChange(topic.id)
      setSearch('')
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-xs bg-tag-bg text-tag-text rounded-md hover:bg-sidebar-hover transition-colors"
      >
        <span className="truncate max-w-32">{selectedName}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-sidebar border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar o crear tema..."
              className="w-full bg-surface px-2 py-1.5 text-xs rounded border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              autoFocus
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
            {filtered.map((topic) => (
              <button
                key={topic.id}
                onClick={() => {
                  onChange(topic.id)
                  setOpen(false)
                  setSearch('')
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-sidebar-hover transition-colors ${
                  topic.id === value ? 'text-accent bg-accent/10' : 'text-text'
                }`}
              >
                {topic.name}
              </button>
            ))}
          </div>

          {search.trim() && !filtered.some((t) => t.name.toLowerCase() === search.toLowerCase()) && (
            <button
              onClick={handleCreate}
              className="w-full flex items-center gap-1 px-3 py-2 text-xs text-accent hover:bg-sidebar-hover border-t border-border transition-colors"
            >
              <Plus size={12} />
              Crear "{search.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}
