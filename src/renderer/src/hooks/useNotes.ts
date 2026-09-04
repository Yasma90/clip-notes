import { useState, useEffect, useCallback, useRef } from 'react'
import type { NoteMeta, NoteFilter } from '../types'

export function useNotes(filter?: NoteFilter) {
  const [notes, setNotes] = useState<NoteMeta[]>([])
  const [loading, setLoading] = useState(true)

  // Serialize filter to a stable string so that ANY change in any field
  // triggers a re-fetch (avoids forgetting new fields in the dep array).
  const filterKey = JSON.stringify(filter ?? {})

  // Generation counter to discard stale async responses when switching
  // filters rapidly.
  const genRef = useRef(0)
  const filterRef = useRef(filter)
  filterRef.current = filter

  // Auto-fetch when filter changes
  useEffect(() => {
    const gen = ++genRef.current
    setLoading(true)
    window.api
      .listNotes(filter)
      .then((result) => {
        if (gen === genRef.current) setNotes(result)
      })
      .catch((err) => {
        if (gen === genRef.current) console.error('Failed to load notes:', err)
      })
      .finally(() => {
        if (gen === genRef.current) setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  // Manual refresh (uses current filter ref, not stale closure)
  const refresh = useCallback(async () => {
    const gen = ++genRef.current
    setLoading(true)
    try {
      const result = await window.api.listNotes(filterRef.current)
      if (gen === genRef.current) setNotes(result)
    } catch (err) {
      if (gen === genRef.current) console.error('Failed to load notes:', err)
    } finally {
      if (gen === genRef.current) setLoading(false)
    }
  }, [])

  return { notes, loading, refresh }
}
