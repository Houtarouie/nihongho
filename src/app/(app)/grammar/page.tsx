'use client'

import { useState, useMemo, useEffect } from 'react'
import grammarData from '@/data/grammar.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  Volume2,
  Plus,
  BookOpen,
  CheckCheck,
  Sparkles,
  LayoutGrid,
  ListTree,
} from 'lucide-react'
import { addCustomSRSCard, speakJapanese } from '@/data/srs-deck'
import { GrammarPointInspector } from '@/components/bunpro/grammar-point-inspector'
import type { GrammarPointSummary } from '@/data/bunpro-grammar-details'
import { toast } from 'sonner'

const LEVELS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1', 'Non-JLPT', '関西弁'] as const
const MASTERED_GRAMMAR_KEY = 'nihongo_bunpro_mastered_grammar_v1'

export default function GrammarPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('N5')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'lessons' | 'grid'>('lessons')
  const [activeGrammar, setActiveGrammar] =
    useState<GrammarPointSummary | null>(null)
  const [historyTrail, setHistoryTrail] = useState<GrammarPointSummary[]>([])
  const [masteredSet, setMasteredSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(MASTERED_GRAMMAR_KEY)
      if (raw) {
        setMasteredSet(new Set(JSON.parse(raw)))
      }
    } catch {
      // ignore
    }
  }, [activeGrammar])

  const filteredPoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return (grammarData as GrammarPointSummary[]).filter((item) => {
      const matchesLevel =
        selectedLevel === 'All' || item.level === selectedLevel
      if (!matchesLevel) return false
      if (!q) return true
      return (
        item.grammar.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        (item.lesson && item.lesson.toLowerCase().includes(q))
      )
    })
  }, [selectedLevel, searchQuery])

  // Group filtered points by Lesson when in 'lessons' mode
  const groupedByLesson = useMemo(() => {
    const groups: { lessonTitle: string; items: GrammarPointSummary[] }[] = []
    const map = new Map<string, GrammarPointSummary[]>()
    filteredPoints.forEach((pt) => {
      const key = pt.lesson || `${pt.level} Grammar Points`
      const existing = map.get(key)
      if (existing) {
        existing.push(pt)
      } else {
        const arr = [pt]
        map.set(key, arr)
        groups.push({ lessonTitle: key, items: arr })
      }
    })
    return groups
  }, [filteredPoints])

  function handleSelectGrammar(target: GrammarPointSummary) {
    setActiveGrammar(target)
    setHistoryTrail((prev) => {
      const filtered = prev.filter((p) => p.grammar !== target.grammar)
      return [...filtered, target]
    })
  }

  function handleAddGrammarToSRS(
    e: React.MouseEvent,
    item: GrammarPointSummary
  ) {
    e.stopPropagation()
    const res = addCustomSRSCard({
      front: item.grammar.split(' ')[0],
      reading: item.grammar.split(' ')[0],
      meaning: item.meaning,
      category: 'grammar',
      jlptLevel: item.level,
      exampleSentence: item.lesson || undefined,
    })
    if (res.added) {
      toast.success(`Added "${item.grammar}" to your SRS Practice deck!`)
    } else {
      toast.info(`"${item.grammar}" is already in your SRS deck!`)
    }
  }

  // If a grammar point is selected, show the full Bunpro 3-Tab Structured Inspector
  if (activeGrammar) {
    return (
      <GrammarPointInspector
        item={activeGrammar}
        allGrammar={grammarData as GrammarPointSummary[]}
        onSelectGrammar={handleSelectGrammar}
        onBack={() => setActiveGrammar(null)}
        historyTrail={historyTrail}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header + Quick Demo Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Bunpro Grammar Curriculum & Dictionary
          </h1>
          <p className="text-muted-foreground text-sm">
            Click any of the {grammarData.length} grammar points to open its
            structured Details, Nuance Graph (Synonyms/Antonyms + Cram!), Vocab
            Coverage, and Audio Examples.
          </p>
        </div>

        <Button
          onClick={() => {
            const desu =
              (grammarData as GrammarPointSummary[]).find(
                (g) => g.grammar === 'です'
              ) || (grammarData[1] as GrammarPointSummary)
            handleSelectGrammar(desu)
          }}
          className="bg-[#e15b64] hover:bg-[#d04a53] text-white shrink-0 gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          Inspect 「です」 (Full Demo)
        </Button>
      </div>

      {/* Search, Level Filter & View Mode Toggle */}
      <div className="space-y-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-3 border-b">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search grammar point, meaning, or lesson (e.g. です, だ, たい, Lesson 1)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="inline-flex rounded-md border bg-muted/40 p-1 self-start">
            <button
              type="button"
              onClick={() => setViewMode('lessons')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'lessons'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              By Lesson
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Compact Grid
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((level) => {
            const count =
              level === 'All'
                ? grammarData.length
                : grammarData.filter((g) => g.level === level).length
            return (
              <Button
                key={level}
                size="sm"
                variant={selectedLevel === level ? 'default' : 'outline'}
                onClick={() => setSelectedLevel(level)}
                className={`h-8 text-xs ${
                  selectedLevel === level
                    ? 'bg-[#e15b64] hover:bg-[#d04a53] text-white'
                    : ''
                }`}
              >
                {level}{' '}
                <span className="ml-1 opacity-75 text-[11px]">({count})</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredPoints.length} grammar points ·{' '}
          <strong className="text-emerald-600 dark:text-emerald-400">
            {masteredSet.size} Mastered
          </strong>
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-primary hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Grammar Cards View */}
      {filteredPoints.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No grammar points matched &ldquo;{searchQuery}&rdquo; in{' '}
          {selectedLevel}.
        </Card>
      ) : viewMode === 'lessons' ? (
        <div className="space-y-6">
          {groupedByLesson.map((group) => (
            <div key={group.lessonTitle} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded bg-[#e15b64]/15 text-[#e15b64] flex items-center justify-center text-xs font-bold">
                    文
                  </span>
                  <h2 className="font-bold text-base sm:text-lg">
                    {group.lessonTitle}
                  </h2>
                </div>
                <Badge variant="outline" className="text-xs">
                  {group.items.length} points
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {group.items.map((item, index) => {
                  const isMastered = masteredSet.has(item.grammar)
                  return (
                    <Card
                      key={`${item.level}-${item.grammar}-${index}`}
                      onClick={() => handleSelectGrammar(item)}
                      className={`cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${
                        isMastered
                          ? 'border-emerald-500/50 bg-emerald-500/[0.03]'
                          : 'hover:border-[#e15b64]/60'
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg font-bold leading-snug text-foreground group-hover:text-[#e15b64]">
                            {item.grammar}
                          </CardTitle>
                          <div className="flex items-center gap-1 shrink-0">
                            {isMastered && (
                              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5">
                                <CheckCheck className="h-3 w-3 mr-0.5" />
                                Mastered
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[11px]">
                              {item.level}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground line-clamp-2">
                          {item.meaning}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs font-semibold text-[#e15b64] flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            Inspect Details &rarr;
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                speakJapanese(item.grammar.split(' ')[0])
                              }}
                              title="Listen"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => handleAddGrammarToSRS(e, item)}
                              title="Add to SRS Practice Deck"
                            >
                              <Plus className="h-3 w-3 mr-1" /> SRS
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPoints.map((item, index) => {
            const isMastered = masteredSet.has(item.grammar)
            return (
              <Card
                key={`${item.level}-${item.grammar}-${index}`}
                onClick={() => handleSelectGrammar(item)}
                className={`cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${
                  isMastered
                    ? 'border-emerald-500/50 bg-emerald-500/[0.03]'
                    : 'hover:border-[#e15b64]/60'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-bold leading-snug">
                      {item.grammar}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {item.level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    {item.meaning}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-[#e15b64] font-semibold">
                      {item.lesson ? item.lesson.split(' – ')[0] : item.level}{' '}
                      &rarr;
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          speakJapanese(item.grammar.split(' ')[0])
                        }}
                        title="Listen"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => handleAddGrammarToSRS(e, item)}
                        title="Add to SRS Practice Deck"
                      >
                        <Plus className="h-3 w-3 mr-1" /> SRS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
