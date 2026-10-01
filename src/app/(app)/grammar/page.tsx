'use client'

import { useState, useMemo, useEffect } from 'react'
import referenceGrammarData from '@/data/grammar.json'
import curatedGrammarData from '@/data/user-grammar-curated.json'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  Volume2,
  Plus,
  CheckCheck,
  Sparkles,
  LayoutGrid,
  ListTree,
  BookOpen,
  Layers,
} from 'lucide-react'
import { addCustomSRSCard, speakJapanese } from '@/data/srs-deck'
import { GrammarPointInspector } from '@/components/bunpro/grammar-point-inspector'
import type { GrammarPointSummary } from '@/data/bunpro-grammar-details'
import { toast } from 'sonner'

const LEVELS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1', 'Non-JLPT', '関西弁'] as const
const MASTERED_GRAMMAR_KEY = 'nihongo_bunpro_mastered_grammar_v1'

const coreGrammarList: GrammarPointSummary[] = curatedGrammarData.grammar.map(
  (item) => ({
    grammar: item.grammar,
    title: item.title,
    meaning: item.meaning,
    level: item.level,
    lesson: item.lesson,
    track: 'core',
  })
)

const referenceGrammarList: GrammarPointSummary[] = (
  referenceGrammarData as GrammarPointSummary[]
).map((item) => ({
  ...item,
  track: 'reference',
}))

const combinedList: GrammarPointSummary[] = [
  ...coreGrammarList,
  ...referenceGrammarList.filter(
    (ref) =>
      !coreGrammarList.some(
        (c) => c.grammar === ref.grammar && c.level === ref.level
      )
  ),
]

export default function GrammarPage() {
  const [catalogMode, setCatalogMode] = useState<'core' | 'reference' | 'all'>('core')
  const [selectedLevel, setSelectedLevel] = useState<string>('N5')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'lessons' | 'grid'>('lessons')
  const [activeGrammar, setActiveGrammar] =
    useState<GrammarPointSummary | null>(null)
  const [inspectorTab, setInspectorTab] = useState<'study' | 'quiz'>('study')
  const [historyTrail, setHistoryTrail] = useState<GrammarPointSummary[]>([])
  const [masteredSet, setMasteredSet] = useState<Set<string>>(new Set())

  const activeCatalog = useMemo(() => {
    if (catalogMode === 'core') return coreGrammarList
    if (catalogMode === 'reference') return referenceGrammarList
    return combinedList
  }, [catalogMode])

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
    return activeCatalog.filter((item) => {
      const matchesLevel =
        selectedLevel === 'All' || item.level === selectedLevel
      if (!matchesLevel) return false
      if (!q) return true
      return (
        item.grammar.toLowerCase().includes(q) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        item.meaning.toLowerCase().includes(q) ||
        (item.lesson && item.lesson.toLowerCase().includes(q))
      )
    })
  }, [activeCatalog, selectedLevel, searchQuery])

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

  function handleSelectGrammar(target: GrammarPointSummary, tab: 'study' | 'quiz' = 'study') {
    setActiveGrammar(target)
    setInspectorTab(tab)
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
      toast.success(`Added "${item.grammar}" to your Anki Deck!`)
    } else {
      toast.info(`"${item.grammar}" is already in your Anki Deck!`)
    }
  }

  if (activeGrammar) {
    return (
      <GrammarPointInspector
        item={activeGrammar}
        allGrammar={activeCatalog}
        onSelectGrammar={(target) => handleSelectGrammar(target, 'study')}
        onBack={() => setActiveGrammar(null)}
        historyTrail={historyTrail}
        initialTab={inspectorTab}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header + Quick Demo Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Grammar Path
          </h1>
          <p className="text-muted-foreground text-sm">
            {catalogMode === 'core'
              ? `Core Curriculum (${coreGrammarList.length} points) · Structured study path with authentic explanations, nuances & fill-in-the-blank practice.`
              : catalogMode === 'reference'
                ? `Reference Dictionary (${referenceGrammarList.length} points) · Comprehensive grammar dictionary covering all JLPT levels, Kansai-ben, and idioms.`
                : `Combined Grammar Library (${combinedList.length} points) · Browse all core points and reference dictionary items together.`}
          </p>
        </div>

        <Button
          onClick={() => {
            const desu =
              activeCatalog.find((g) => g.grammar === 'です' || g.grammar.startsWith('です')) ||
              activeCatalog[0]
            if (desu) handleSelectGrammar(desu)
          }}
          className="shrink-0 gap-1.5 font-bold border-b-4"
        >
          <Sparkles className="h-4 w-4" />
          Start with 「です」
        </Button>
      </div>

      {/* Catalog Selector Tabs: Core Curriculum vs Complete Reference vs All */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/60 rounded-2xl border">
        <button
          type="button"
          onClick={() => {
            setCatalogMode('core')
            if (['Non-JLPT', '関西弁'].includes(selectedLevel)) {
              setSelectedLevel('N5')
            }
          }}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            catalogMode === 'core'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Core Curriculum ({coreGrammarList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCatalogMode('reference')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            catalogMode === 'reference'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span>Reference Dictionary ({referenceGrammarList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCatalogMode('all')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            catalogMode === 'all'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4 text-purple-500" />
          <span>All Combined ({combinedList.length})</span>
        </button>
      </div>

      {/* Search, Level Filter & View Mode Toggle */}
      <div className="space-y-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-3 border-b">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder={
                catalogMode === 'core'
                  ? 'Search Core Curriculum (e.g. は, です, たい, Unit 1)...'
                  : 'Search Reference Dictionary (e.g. です, だ, Lesson 1)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="inline-flex rounded-xl border bg-muted/40 p-1 self-start">
            <button
              type="button"
              onClick={() => setViewMode('lessons')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'lessons'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              Units
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              All Cards
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((level) => {
            const count =
              level === 'All'
                ? activeCatalog.length
                : activeCatalog.filter((g) => g.level === level).length
            return (
              <Button
                key={level}
                size="sm"
                variant={selectedLevel === level ? 'default' : 'outline'}
                onClick={() => setSelectedLevel(level)}
                className="h-8 text-xs font-bold"
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
          <strong className="text-primary">{masteredSet.size} Mastered</strong>
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
        <div className="space-y-8">
          {groupedByLesson.map((group, gIdx) => (
            <div key={group.lessonTitle} className="space-y-3">
              {/* Duolingo-Style Unit Banner */}
              <div className="rounded-2xl bg-primary/10 border border-primary/20 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xs font-extrabold">
                    {gIdx + 1}
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base">
                    {group.lessonTitle}
                  </h2>
                </div>
                <Badge variant="secondary" className="text-xs font-bold">
                  {group.items.length} steps
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {group.items.map((item, index) => {
                  const isMastered = masteredSet.has(item.grammar)
                  return (
                    <Card
                      key={`${item.level}-${item.grammar}-${index}`}
                      onClick={() => handleSelectGrammar(item)}
                      className={`cursor-pointer transition-all hover:border-primary/60 border-b-4 flex flex-col justify-between ${
                        isMastered
                          ? 'border-emerald-500/50 bg-emerald-500/[0.03]'
                          : ''
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg font-extrabold leading-snug">
                            {item.title || item.grammar}
                          </CardTitle>
                          <div className="flex items-center gap-1 shrink-0">
                            {isMastered && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCheck className="h-3 w-3 mr-0.5" />
                                Done
                              </Badge>
                            )}
                            {item.track === 'core' && (
                              <Badge variant="outline" className="text-[10px] px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">
                                Core
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
                          <span className="text-xs font-extrabold text-primary flex items-center gap-1 group-hover:underline">
                            <BookOpen className="h-3.5 w-3.5" />
                            Guide &amp; Examples
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 px-2 text-[11px] font-bold gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectGrammar(item, 'quiz')
                              }}
                              title="Jump directly to practice quiz"
                            >
                              ⚡ Quiz
                            </Button>
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
                              title="Add to Anki Deck"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Deck
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
                className={`cursor-pointer transition-all hover:border-primary/60 border-b-4 flex flex-col justify-between ${
                  isMastered
                    ? 'border-emerald-500/50 bg-emerald-500/[0.03]'
                    : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-extrabold leading-snug">
                      {item.title || item.grammar}
                    </CardTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      {isMastered && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCheck className="h-3 w-3 mr-0.5" />
                          Done
                        </Badge>
                      )}
                      {item.track === 'core' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">
                          Core
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[11px]">
                        {item.level}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    {item.meaning}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-primary font-extrabold flex items-center gap-1 group-hover:underline">
                      <BookOpen className="h-3.5 w-3.5" />
                      Guide
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 text-[11px] font-bold gap-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectGrammar(item, 'quiz')
                        }}
                        title="Jump directly to practice quiz"
                      >
                        ⚡ Quiz
                      </Button>
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
                        title="Add to Anki Deck"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Deck
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
