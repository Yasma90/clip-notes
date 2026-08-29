import { useState, useEffect, useCallback, useRef } from 'react'
import type { DateGroup } from '../types'

export function useDateGroups() {
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([])
  const genRef = useRef(0)

  const refresh = useCallback(async () => {
    const gen = ++genRef.current
    try {
      const result = await window.api.getDateGroups()
      if (gen === genRef.current) setDateGroups(result)
    } catch (err) {
      if (gen === genRef.current) console.error('Failed to load date groups:', err)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { dateGroups, refresh }
}
