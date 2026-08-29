import { useState, useRef, useCallback, useEffect } from 'react'
import { processClipboardData } from '../lib/clipboard-processor'
import { synthesize } from '../lib/synthesizer'
import { detectTopic } from '../lib/topic-detector'
import type { Topic, NoteContent } from '../types'
import EditorToolbar from './EditorToolbar'
import TopicPicker from './TopicPicker'

interface Props {
  topics: Topic[]
  editingNote: NoteContent | null
  onSave: (data: { title: string; body: string; topic: string; tags: string[] }) => void
  onCreateTopic: (name: string) => Promise<Topic>
  onBodyChange?: (body: string) => void
}

export default function NoteEditor({ topics, editingNote, onSave, onCreateTopic, onBodyChange }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [topic, setTopic] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load existing note data
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title)
      setBody(editingNote.body)
      setTopic(editingNote.topic)
      setTags(editingNote.tags)
      onBodyChange?.(editingNote.body)
    } else {
      setTitle('')
      setBody('')
      setTopic('')
      setTags([])
      onBodyChange?.('')
    }
    setSaved(false)
  }, [editingNote])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const processed = processClipboardData(e.nativeEvent)
      if (processed) {
        e.preventDefault()
        const textarea = textareaRef.current
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const newBody = body.slice(0, start) + processed + body.slice(end)
          setBody(newBody)
          onBodyChange?.(newBody)

          // Auto-detect topic if empty
          if (!topic) {
            const detected = detectTopic(processed, topics)
            if (detected.existing) {
              setTopic(detected.existing.id)
            } else if (detected.suggested) {
              setTopic(detected.suggested)
            }
          }

          // Auto-set title from first line if empty
          if (!title) {
            const firstLine = processed.split('\n')[0]
              .replace(/^#{1,6}\s+/, '')
              .slice(0, 80)
            if (firstLine) setTitle(firstLine)
          }
        }
      }
    },
    [body, topic, title, topics]
  )

  const handleSynthesize = () => {
    if (!body.trim()) return
    const separator = '\n\n---\n\n## Puntos Clave\n\n'
    // If a previous synthesis section exists, strip it so we synthesize from
    // the original content only and replace (not concatenate) the bullets.
    const existingIdx = body.indexOf(separator.trim())
    const baseContent = existingIdx >= 0 ? body.slice(0, existingIdx).trimEnd() : body
    const bullets = synthesize(baseContent)
    const newBody = baseContent + separator + bullets
    setBody(newBody)
    onBodyChange?.(newBody)
  }

  const handleSave = () => {
    onSave({
      title: title || 'Sin título',
      body,
      topic: topic || 'general',
      tags
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopyMd = () => {
    navigator.clipboard.writeText(body)
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        handleSynthesize()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <div className="p-4 pb-2">
        <input
          type="text"
          placeholder="Título de la nota..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-lg font-semibold text-text-bright placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {/* Topic + Tags */}
      <div className="px-4 pb-3 flex flex-wrap gap-2 items-center">
        <TopicPicker
          topics={topics}
          value={topic}
          onChange={setTopic}
          onCreateTopic={onCreateTopic}
        />

        <div className="flex items-center gap-1 flex-wrap flex-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-tag-bg text-tag-text text-[11px] rounded-full"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-danger transition-colors"
              >
                x
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="+ tag"
            className="bg-transparent text-xs text-text-muted placeholder:text-text-muted focus:outline-none w-16"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Editor */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => { setBody(e.target.value); onBodyChange?.(e.target.value) }}
          onPaste={handlePaste}
          placeholder="Pega o escribe tu contenido aquí...&#10;&#10;Puedes pegar texto de cualquier sitio web, documento o email y se convertirá automáticamente a Markdown."
          className="w-full h-full bg-transparent text-sm text-text leading-relaxed resize-none focus:outline-none font-mono placeholder:text-text-muted/50"
          spellCheck={false}
        />
      </div>

      {/* Toolbar */}
      <EditorToolbar
        onSynthesize={handleSynthesize}
        onSave={handleSave}
        onCopyMd={handleCopyMd}
        saved={saved}
        hasContent={body.trim().length > 0}
      />
    </div>
  )
}
