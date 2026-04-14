import { useState, useEffect, useCallback } from 'react'
import type { NoteMeta, NoteFilter } from '../types'

export function useNotes(filter?: NoteFilter) {
  const [notes, setNotes] = useState<NoteMeta[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.listNotes(filter)
      setNotes(result)
    } catch (err) {
      console.error('Failed to load notes:', err)
    } finally {
      setLoading(false)
    }
  }, [filter?.topic, filter?.yearMonth, filter?.searchQuery])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { notes, loading, refresh }
}
