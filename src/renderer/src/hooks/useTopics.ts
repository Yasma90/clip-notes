import { useState, useEffect, useCallback } from 'react'
import type { Topic } from '../types'

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])

  const refresh = useCallback(async () => {
    try {
      const result = await window.api.getTopics()
      setTopics(result)
    } catch (err) {
      console.error('Failed to load topics:', err)
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
