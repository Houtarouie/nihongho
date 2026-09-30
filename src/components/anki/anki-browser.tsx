'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Flag,
  PauseCircle,
  PlayCircle,
  EyeOff,
  RotateCcw,
  Trash2,
  Volume2,
} from 'lucide-react'
import {
  speakJapanese,
  type SRSCard,
  type AnkiFlag,
} from '@/data/srs-deck'
import { renderAnkiText } from '@/lib/anki/furigana'
import { toast } from 'sonner'

interface AnkiBrowserProps {
  cards: SRSCard[]
  onUpdateCards: (next: SRSCard[]) => void
}

const FLAG_COLORS: Record<AnkiFlag, string> = {
  0: 'text-muted-foreground',
  1: 'text-red-500 fill-red-500',
  2: 'text-orange-500 fill-orange-500',
  3: 'text-green-500 fill-green-500',
  4: 'text-blue-500 fill-blue-500',
}

const FLAG_NAMES: Record<AnkiFlag, string> = {
  0: 'No Flag',
  1: 'Red Flag',
  2: 'Orange Flag',
  3: 'Green Flag',
  4: 'Blue Flag',
}

type BrowserFilter =
  | 'all'
  | 'due'
  | 'new'
  | 'learning'
  | 'mastered'
  | 'suspended'
  | 'buried'
  | 'leech'
  | 'flagged'

export function AnkiBrowser({ cards, onUpdateCards }: AnkiBrowserProps) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<BrowserFilter>('all')

  const filteredCards = useMemo(() => {
    const now = Date.now() + 60 * 1000
    const q = query.trim().toLowerCase()

    return cards.filter((c) => {
      if (activeFilter === 'due' && (c.queue !== 'active' || c.dueDate > now))
        return false
      if (activeFilter === 'new' && c.status !== 'new') return false
      if (activeFilter === 'learning' && c.status !== 'learning') return false
      if (
        activeFilter === 'mastered' &&
        c.status !== 'mastered' &&
        c.interval < 21
      )
        return false
      if (activeFilter === 'suspended' && c.queue !== 'suspended') return false
      if (activeFilter === 'buried' && c.queue !== 'buried') return false
      if (activeFilter === 'leech' && !(c.tags || []).includes('leech'))
        return false
      if (activeFilter === 'flagged' && !c.flag) return false

      if (!q) return true
      return (
        c.front.toLowerCase().includes(q) ||
        c.reading.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        (c.deckName || '').toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [cards, query, activeFilter])

  function cycleFlag(cardId: string) {
    const next = cards.map((c) => {
      if (c.id !== cardId) return c
      const nextFlag = (((c.flag || 0) + 1) % 5) as AnkiFlag
      toast.info(`${FLAG_NAMES[nextFlag]} set`)
      return { ...c, flag: nextFlag }
    })
    onUpdateCards(next)
  }

  function toggleSuspend(cardId: string) {
    const next = cards.map((c) => {
      if (c.id !== cardId) return c
      const nextQueue = c.queue === 'suspended' ? 'active' : 'suspended'
      toast.info(
        nextQueue === 'suspended' ? 'Card suspended (@)' : 'Card unsuspended'
      )
      return { ...c, queue: nextQueue as SRSCard['queue'] }
    })
    onUpdateCards(next)
  }

  function toggleBury(cardId: string) {
    const next = cards.map((c) => {
      if (c.id !== cardId) return c
      const nextQueue = c.queue === 'buried' ? 'active' : 'buried'
      toast.info(nextQueue === 'buried' ? 'Card buried (-)' : 'Card unburied')
      return { ...c, queue: nextQueue as SRSCard['queue'] }
    })
    onUpdateCards(next)
  }

  function resetCard(cardId: string) {
    const next = cards.map((c) => {
      if (c.id !== cardId) return c
      return {
        ...c,
        interval: 0,
        repetition: 0,
        efactor: 2.5,
        stability: 1.0,
        difficulty: 5.0,
        lapses: 0,
        queue: 'active' as const,
        dueDate: Date.now(),
        status: 'new' as const,
      }
    })
    onUpdateCards(next)
    toast.success('Card progress forgotten (reset to New).')
  }

  function deleteCard(cardId: string) {
    const next = cards.filter((c) => c.id !== cardId)
    onUpdateCards(next)
    toast.success('Card deleted from deck.')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg">
            Anki Card Browser ({filteredCards.length} of {cards.length} cards)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const unburied = cards.map((c) => ({
                  ...c,
                  queue: 'active' as const,
                }))
                onUpdateCards(unburied)
                toast.success('All buried & suspended cards restored to active!')
              }}
            >
              Unbury / Unsuspend All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search front, reading, meaning, deck, or tag (e.g. N5, cloze, verb)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Anki Sidebar-Style Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: 'All Cards' },
              { id: 'due', label: 'is:due' },
              { id: 'new', label: 'is:new' },
              { id: 'learning', label: 'is:learn' },
              { id: 'mastered', label: 'is:mature' },
              { id: 'flagged', label: '🚩 Flagged' },
              { id: 'suspended', label: 'is:suspended' },
              { id: 'buried', label: 'is:buried' },
              { id: 'leech', label: '🩸 tag:leech' },
            ] as const
          ).map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={activeFilter === f.id ? 'default' : 'outline'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Responsive Card List */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
            No cards match the current Anki search filter.
          </div>
        ) : (
          <div className="divide-y border rounded-lg overflow-hidden">
            {filteredCards.map((c) => {
              const flag = (c.flag || 0) as AnkiFlag
              const isLeech = (c.tags || []).includes('leech')
              return (
                <div
                  key={c.id}
                  className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-muted/40 ${
                    c.queue === 'suspended'
                      ? 'bg-yellow-500/5 opacity-75'
                      : c.queue === 'buried'
                      ? 'bg-muted/50 opacity-75'
                      : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base">
                        {renderAnkiText(c.front, { isClozeRevealed: true })}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {c.reading}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {c.noteType || 'basic'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {c.jlptLevel}
                      </Badge>
                      {c.queue === 'suspended' && (
                        <Badge variant="destructive" className="text-[10px]">
                          Suspended
                        </Badge>
                      )}
                      {c.queue === 'buried' && (
                        <Badge variant="secondary" className="text-[10px]">
                          Buried
                        </Badge>
                      )}
                      {isLeech && (
                        <Badge variant="destructive" className="text-[10px]">
                          🩸 Leech ({c.lapses} lapses)
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.meaning} · <span className="opacity-80">{c.deckName}</span> ·{' '}
                      <span>
                        Ivl: {c.interval}d | S:{' '}
                        {(c.stability ?? 1).toFixed(1)} | D:{' '}
                        {(c.difficulty ?? 5).toFixed(1)}
                      </span>
                    </p>
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => speakJapanese(c.front)}
                      title="Play Audio"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => cycleFlag(c.id)}
                      title={`Cycle Flag (Current: ${FLAG_NAMES[flag]})`}
                    >
                      <Flag className={`h-4 w-4 ${FLAG_COLORS[flag]}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => toggleBury(c.id)}
                      title={c.queue === 'buried' ? 'Unbury Card' : 'Bury Card (-)'}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => toggleSuspend(c.id)}
                      title={
                        c.queue === 'suspended'
                          ? 'Unsuspend Card'
                          : 'Suspend Card (@)'
                      }
                    >
                      {c.queue === 'suspended' ? (
                        <PlayCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <PauseCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => resetCard(c.id)}
                      title="Forget / Reset Card Progress"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteCard(c.id)}
                      title="Delete Card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
