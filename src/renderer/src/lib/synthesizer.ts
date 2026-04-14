const SIGNAL_WORDS = new Set([
  'importante', 'clave', 'debe', 'necesita', 'critical', 'principal',
  'conclusion', 'resultado', 'objetivo', 'meta', 'prioridad',
  'important', 'key', 'must', 'should', 'note', 'critical',
  'main', 'primary', 'result', 'therefore', 'conclusion',
  'essential', 'required', 'significant', 'fundamental',
  'destacar', 'resumen', 'esencial', 'requerido', 'significativo'
])

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'con', 'por',
  'para', 'es', 'son', 'fue', 'ser', 'que', 'se', 'su', 'al', 'lo', 'como',
  'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'si', 'porque', 'esta',
  'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay',
  'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'ni',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'it', 'its', 'this', 'that',
  'these', 'those', 'i', 'we', 'you', 'he', 'she', 'they', 'them', 'not'
])

interface ScoredSentence {
  text: string
  score: number
  originalIndex: number
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15)
}

function scoreSentence(
  sentence: string,
  index: number,
  totalInParagraph: number
): number {
  let score = 0

  // Position: first and last sentences score higher
  if (index === 0) score += 3
  if (index === totalInParagraph - 1) score += 2

  const words = sentence.toLowerCase().split(/\s+/)

  // Signal words
  for (const word of words) {
    if (SIGNAL_WORDS.has(word)) score += 2
  }

  // Contains numbers/data (factual content)
  if (/\d+/.test(sentence)) score += 1.5

  // Length preference: mid-length sentences
  if (words.length >= 8 && words.length <= 30) score += 1
  if (words.length < 5) score -= 2

  // Contains a colon (often introduces key info)
  if (sentence.includes(':')) score += 1

  return score
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter((w) => !STOPWORDS.has(w)))
  const setB = new Set(b.toLowerCase().split(/\s+/).filter((w) => !STOPWORDS.has(w)))
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return union.size === 0 ? 0 : intersection.size / union.size
}

function removeDuplicates(sentences: ScoredSentence[]): ScoredSentence[] {
  const result: ScoredSentence[] = []
  for (const s of sentences) {
    const isDuplicate = result.some((r) => jaccardSimilarity(r.text, s.text) > 0.65)
    if (!isDuplicate) result.push(s)
  }
  return result
}

export function synthesize(markdown: string, maxPoints: number = 7): string {
  // Remove frontmatter if present
  const content = markdown.replace(/^---[\s\S]*?---\s*/, '')

  // Check if content has headings for section-aware synthesis
  const sections = content.split(/^(#{1,3}\s.+)$/m)

  const allScored: ScoredSentence[] = []
  let globalIndex = 0

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim()
    if (!section || /^#{1,3}\s/.test(section)) continue

    const sentences = splitSentences(section)
    for (let j = 0; j < sentences.length; j++) {
      allScored.push({
        text: sentences[j],
        score: scoreSentence(sentences[j], j, sentences.length),
        originalIndex: globalIndex++
      })
    }
  }

  if (allScored.length === 0) {
    // Fallback: split by lines and use non-empty ones
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 10 && !l.startsWith('#'))
    return lines.slice(0, maxPoints).map((l) => `- ${l}`).join('\n')
  }

  // Sort by score descending
  allScored.sort((a, b) => b.score - a.score)

  // Remove duplicates among top candidates
  const deduped = removeDuplicates(allScored)

  // Take top N and restore original order
  const top = deduped.slice(0, maxPoints).sort((a, b) => a.originalIndex - b.originalIndex)

  return top
    .map((s) => {
      let text = s.text
      // Clean up: remove leading markdown artifacts
      text = text.replace(/^[-*]\s+/, '')
      // Ensure clean ending
      if (!/[.!?]$/.test(text)) text += '.'
      return `- ${text}`
    })
    .join('\n')
}
