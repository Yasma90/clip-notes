import { useState } from 'react'
import {
  FolderOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  FileText
} from 'lucide-react'
import type { Topic, DateGroup } from '../types'

interface Props {
  topics: Topic[]
  dateGroups: DateGroup[]
  selectedTopic: string | null
  selectedYearMonth: string | null
  selectedDate: string | null
  onSelectTopic: (topic: string | null) => void
  onSelectYearMonth: (ym: string | null) => void
  onSelectDate: (date: string | null) => void
  onCreateTopic: (name: string) => void
  onNewNote: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export default function Sidebar({
  topics,
  dateGroups,
  selectedTopic,
  selectedYearMonth,
  selectedDate,
  onSelectTopic,
  onSelectYearMonth,
  onSelectDate,
  onCreateTopic,
  onNewNote,
  searchQuery,
  onSearchChange
}: Props) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev)
      next.has(year) ? next.delete(year) : next.add(year)
      return next
    })
  }

  const toggleMonth = (ym: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev)
      next.has(ym) ? next.delete(ym) : next.add(ym)
      return next
    })
  }

  const handleCreateTopic = () => {
    if (newTopicName.trim()) {
      onCreateTopic(newTopicName.trim())
      setNewTopicName('')
      setShowNewTopic(false)
    }
  }

  return (
    <aside className="w-64 min-w-56 bg-sidebar flex flex-col border-r border-border h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-bold text-text-bright tracking-wide">clip-notes</h1>
          <button
            onClick={onNewNote}
            className="p-1.5 rounded-md bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
            title="New note (Ctrl+N)"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface pl-8 pr-3 py-2 text-xs rounded-md border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Topics */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Topics
            </span>
            <button
              onClick={() => setShowNewTopic(!showNewTopic)}
              className="text-text-muted hover:text-accent transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          {showNewTopic && (
            <div className="mb-2 flex gap-1">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
                placeholder="Topic name"
                className="flex-1 bg-surface px-2 py-1 text-xs rounded border border-border text-text focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>
          )}

          <button
            onClick={() => onSelectTopic(null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
              selectedTopic === null
                ? 'bg-accent/20 text-accent'
                : 'text-text hover:bg-sidebar-hover'
            }`}
          >
            <FileText size={13} />
            <span>All</span>
          </button>

          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                selectedTopic === topic.id
                  ? 'bg-accent/20 text-accent'
                  : 'text-text hover:bg-sidebar-hover'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen size={13} />
                <span className="truncate">{topic.name}</span>
              </div>
              {topic.noteCount > 0 && (
                <span className="text-text-muted text-[10px]">{topic.noteCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Dates */}
        <div className="p-3 border-t border-border">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
            Dates
          </span>

          {dateGroups.map((group) => (
            <div key={group.year}>
              <button
                onClick={() => toggleYear(group.year)}
                className="w-full flex items-center gap-1 px-2 py-1.5 text-xs text-text hover:bg-sidebar-hover rounded-md transition-colors"
              >
                {expandedYears.has(group.year) ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
                <Calendar size={12} />
                <span>{group.year}</span>
              </button>

              {expandedYears.has(group.year) &&
                group.months.map((m) => {
                  const ym = `${group.year}-${String(m.month).padStart(2, '0')}`
                  const hasDays = m.days && m.days.length > 0
                  return (
                    <div key={ym}>
                      <div
                        className={`flex items-center rounded-md transition-colors ${
                          selectedYearMonth === ym
                            ? 'bg-accent/20 text-accent'
                            : 'hover:bg-sidebar-hover'
                        }`}
                      >
                        <button
                          onClick={() => hasDays && toggleMonth(ym)}
                          className="pl-5 pr-1 py-1 text-text-muted hover:text-text"
                        >
                          {hasDays ? (
                            expandedMonths.has(ym) ? (
                              <ChevronDown size={10} />
                            ) : (
                              <ChevronRight size={10} />
                            )
                          ) : (
                            <span className="inline-block w-[10px]" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            onSelectYearMonth(selectedYearMonth === ym ? null : ym)
                          }
                          className={`flex-1 flex items-center justify-between pr-2 py-1 text-xs transition-colors ${
                            selectedYearMonth === ym
                              ? 'text-accent'
                              : 'text-text-muted hover:text-text'
                          }`}
                        >
                          <span>{MONTH_NAMES[m.month]}</span>
                          <span className="text-[10px]">{m.count}</span>
                        </button>
                      </div>

                      {expandedMonths.has(ym) &&
                        m.days.map((d) => {
                          const dateStr = `${ym}-${String(d.day).padStart(2, '0')}`
                          return (
                            <button
                              key={dateStr}
                              onClick={() =>
                                onSelectDate(selectedDate === dateStr ? null : dateStr)
                              }
                              className={`w-full flex items-center justify-between pl-11 pr-2 py-1 text-xs rounded-md transition-colors ${
                                selectedDate === dateStr
                                  ? 'bg-accent/20 text-accent'
                                  : 'text-text-muted hover:bg-sidebar-hover hover:text-text'
                              }`}
                            >
                              <span>Day {d.day}</span>
                              <span className="text-[10px]">{d.count}</span>
                            </button>
                          )
                        })}
                    </div>
                  )
                })}
            </div>
          ))}

          {dateGroups.length === 0 && (
            <p className="text-[11px] text-text-muted px-2">No notes yet</p>
          )}
        </div>
      </div>
    </aside>
  )
}
