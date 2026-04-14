import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*'
})

// Improve table handling
turndown.addRule('tableCell', {
  filter: ['th', 'td'],
  replacement: (content) => ` ${content.trim()} |`
})

turndown.addRule('tableRow', {
  filter: 'tr',
  replacement: (content) => `|${content}\n`
})

turndown.addRule('table', {
  filter: 'table',
  replacement: (_content, node) => {
    const rows = Array.from((node as HTMLElement).querySelectorAll('tr'))
    if (rows.length === 0) return ''

    const lines: string[] = []
    rows.forEach((row, i) => {
      const cells = Array.from(row.querySelectorAll('th, td'))
      const line = '| ' + cells.map((c) => c.textContent?.trim() || '').join(' | ') + ' |'
      lines.push(line)
      if (i === 0) {
        lines.push('| ' + cells.map(() => '---').join(' | ') + ' |')
      }
    })
    return '\n' + lines.join('\n') + '\n'
  }
})

function looksLikeMarkdown(text: string): boolean {
  const mdPatterns = [
    /^#{1,6}\s/m,       // Headings
    /^\s*[-*+]\s/m,     // Lists
    /^\s*\d+\.\s/m,     // Ordered lists
    /\[.+\]\(.+\)/,     // Links
    /```/,              // Code blocks
    /^\s*>/m,           // Blockquotes
    /\*\*.+\*\*/,       // Bold
    /\|.+\|/m           // Tables
  ]
  return mdPatterns.some((p) => p.test(text))
}

function formatPlainText(text: string): string {
  if (looksLikeMarkdown(text)) return text

  const lines = text.split('\n')
  const result: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      result.push('')
      continue
    }
    result.push(trimmed)
  }

  return result.join('\n')
}

export function processClipboardData(event: ClipboardEvent): string | null {
  const clipboard = event.clipboardData
  if (!clipboard) return null

  const html = clipboard.getData('text/html')
  if (html) {
    const md = turndown.turndown(html)
    return md.trim()
  }

  const text = clipboard.getData('text/plain')
  if (text) {
    return formatPlainText(text.trim())
  }

  return null
}
