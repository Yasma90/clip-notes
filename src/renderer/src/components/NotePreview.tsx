import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
  width: number
}

export default function NotePreview({ content, width }: Props) {
  return (
    <div
      style={{ width: `${width}px`, minWidth: '180px' }}
      className="border-l border-border bg-editor overflow-y-auto flex-shrink-0"
    >
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
  )
}
