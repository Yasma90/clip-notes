import { Sparkles, Save, Copy, Check } from 'lucide-react'

interface Props {
  onSynthesize: () => void
  onSave: () => void
  onCopyMd: () => void
  saved: boolean
  hasContent: boolean
}

export default function EditorToolbar({
  onSynthesize,
  onSave,
  onCopyMd,
  saved,
  hasContent
}: Props) {
  return (
    <div className="p-3 border-t border-border flex items-center gap-2">
      <button
        onClick={onSynthesize}
        disabled={!hasContent}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Sintetizar en puntos clave (Ctrl+Shift+S)"
      >
        <Sparkles size={13} />
        Sintetizar
      </button>

      <button
        onClick={onSave}
        disabled={!hasContent}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          saved
            ? 'bg-success/20 text-success'
            : 'bg-accent text-surface hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
        title="Guardar (Ctrl+S)"
      >
        {saved ? <Check size={13} /> : <Save size={13} />}
        {saved ? 'Guardado' : 'Guardar'}
      </button>

      <button
        onClick={onCopyMd}
        disabled={!hasContent}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-tag-bg text-text hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Copiar Markdown"
      >
        <Copy size={13} />
        Copiar MD
      </button>

      <div className="flex-1" />

      <span className="text-[10px] text-text-muted">
        Ctrl+S guardar | Ctrl+Shift+S sintetizar
      </span>
    </div>
  )
}
