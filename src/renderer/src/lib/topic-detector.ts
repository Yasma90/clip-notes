import type { Topic } from '../types'

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'con', 'por',
  'para', 'es', 'son', 'fue', 'ser', 'que', 'se', 'su', 'al', 'lo', 'como',
  'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'si', 'porque', 'esta',
  'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'it', 'its', 'this', 'that',
  'these', 'those', 'not', 'todo', 'cada', 'otro', 'otra', 'todos', 'todas'
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sáéíóúñü]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function getFrequencies(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1)
  }
  return freq
}

function getBigrams(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`
    freq.set(bigram, (freq.get(bigram) || 0) + 1)
  }
  return freq
}

export function detectTopic(
  text: string,
  existingTopics: Topic[]
): { existing?: Topic; suggested?: string } {
  // Clean markdown syntax
  const clean = text
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~\[\]()]/g, '')

  const tokens = tokenize(clean)
  if (tokens.length === 0) return { suggested: 'general' }

  const wordFreq = getFrequencies(tokens)
  const bigramFreq = getBigrams(tokens)

  // Check heading for topic hints (headings are high-signal)
  const headingMatch = text.match(/^#{1,3}\s+(.+)$/m)
  const headingTokens = headingMatch ? tokenize(headingMatch[1]) : []

  // Score existing topics by token overlap
  let bestMatch: { topic: Topic; score: number } | null = null

  for (const topic of existingTopics) {
    const topicTokens = tokenize(topic.name)
    let score = 0

    for (const t of topicTokens) {
      if (wordFreq.has(t)) score += wordFreq.get(t)! * 2
      if (headingTokens.includes(t)) score += 5
    }

    // Also check topic ID
    if (wordFreq.has(topic.id)) score += 3

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { topic, score }
    }
  }

  if (bestMatch && bestMatch.score >= 3) {
    return { existing: bestMatch.topic }
  }

  // Suggest new topic from top keywords
  // Prefer bigrams if frequent enough
  const topBigrams = Array.from(bigramFreq.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])

  if (topBigrams.length > 0) {
    return { suggested: topBigrams[0][0] }
  }

  // Fall back to most frequent single word
  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])

  if (topWords.length > 0) {
    return { suggested: topWords[0][0] }
  }

  return { suggested: 'general' }
}
