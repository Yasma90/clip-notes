import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  content: string
  visible: boolean
  onToggle: () => void
}

export default function NotePreview({ content, visible, onToggle }: Props) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-tag-bg text-text-muted hover:text-accent hover:bg-sidebar-hover transition-colors z-10"
        title={visible ? 'Ocultar preview' : 'Mostrar preview'}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>

      {visible && (
        <div className="w-[45%] min-w-72 border-l border-border bg-editor overflow-y-auto">
          <div className="p-5">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-3 block">
              Preview
            </span>
            {content.trim() ? (
              <div className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-text-muted/50 italic">
                El preview aparecerá aquí...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
