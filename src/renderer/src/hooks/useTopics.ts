import { useState, useEffect, useCallback, useRef } from 'react'
import type { Topic } from '../types'

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const genRef = useRef(0)

  const refresh = useCallback(async () => {
    const gen = ++genRef.current
    try {
      const result = await window.api.getTopics()
      if (gen === genRef.current) setTopics(result)
    } catch (err) {
      if (gen === genRef.current) console.error('Failed to load topics:', err)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createTopic = useCallback(
    async (name: string) => {
      const topic = await window.api.createTopic(name)
      await refresh()
      return topic
    },
    [refresh]
  )

  return { topics, createTopic, refresh }
}
