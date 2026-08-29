import { useEffect, useRef } from 'react'

interface Props {
  onResize: (delta: number) => void
  onDoubleClick?: () => void
}

/**
 * Vertical draggable divider. Emits delta in pixels (positive = right).
 * Parent is responsible for applying the delta to a width state.
 */
export default function ResizeDivider({ onResize, onDoubleClick }: Props) {
  const draggingRef = useRef(false)
  const lastXRef = useRef(0)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const delta = e.clientX - lastXRef.current
      lastXRef.current = e.clientX
      if (delta !== 0) onResize(delta)
    }

    const onMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onResize])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    lastXRef.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className="w-1 hover:w-1.5 hover:bg-accent/50 bg-border cursor-col-resize transition-all flex-shrink-0 relative group"
      title="Arrastrar para redimensionar. Doble click para resetear."
    >
      {/* Wider hit area for easier dragging */}
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-accent/10" />
    </div>
  )
}
