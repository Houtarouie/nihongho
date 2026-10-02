'use client'

import React, { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  BookMarked,
  Search,
  ChevronRight,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { KanaChart } from '@/components/kana/kana-chart'
import { BunproVocabLists } from '@/components/bunpro/vocab-lists'
import { BunproReadingPractice } from '@/components/bunpro/reading-practice'
import { GrammarPointInspector } from '@/components/bunpro/grammar-point-inspector'
import referenceGrammarData from '@/data/grammar.json'
import curatedGrammarData from '@/data/user-grammar-curated.json'
import type { GrammarPointSummary } from '@/data/bunpro-grammar-details'
import { speakJapanese } from '@/data/srs-deck'

type LibraryTab = 'grammar' | 'kana' | 'vocab' | 'reading'

const JLPT_LEVELS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1', 'Non-JLPT', '関西弁'] as const

const coreGrammarList: GrammarPointSummary[] = curatedGrammarData.grammar.map((item) => ({
  grammar: item.grammar,
  title: item.title,
  meaning: item.meaning,
  level: item.level,
  lesson: item.lesson,
  track: 'core',
}))

const referenceGrammarList: GrammarPointSummary[] = (
  referenceGrammarData as GrammarPointSummary[]
).map((item) => ({
  ...item,
  track: 'reference',
}))

const combinedList: GrammarPointSummary[] = [
  ...coreGrammarList,
  ...referenceGrammarList.filter(
    (ref) => !coreGrammarList.some((c) => c.grammar === ref.grammar && c.level === ref.level)
  ),
]

function LibraryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab: LibraryTab =
    rawTab === 'kana' || rawTab === 'vocab' || rawTab === 'reading' ? rawTab : 'grammar'

  // Grammar sub-state
  const [grammarSearch, setGrammarSearch] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('N5')
  const [catalogTrack, setCatalogTrack] = useState<'core' | 'reference' | 'all'>('core')
  const [activeGrammarPoint, setActiveGrammarPoint] = useState<GrammarPointSummary | null>(null)

  function setTab(tab: LibraryTab) {
    router.replace(`/library?tab=${tab}`)
  }

  // Active grammar list based on track
  const currentCatalog = useMemo(() => {
    if (catalogTrack === 'core') return coreGrammarList
    if (catalogTrack === 'reference') return referenceGrammarList
    return combinedList
  }, [catalogTrack])

  // Filtered grammar points
  const filteredGrammar = useMemo(() => {
    const q = grammarSearch.trim().toLowerCase()
    return currentCatalog.filter((item) => {
      const matchesLevel = selectedLevel === 'All' || item.level === selectedLevel
      if (!matchesLevel) return false
      if (!q) return true
      return (
        item.grammar.toLowerCase().includes(q) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        item.meaning.toLowerCase().includes(q)
      )
    })
  }, [currentCatalog, selectedLevel, grammarSearch])

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Library &amp; Reference</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Curated dictionary, kana charts, vocabulary lists, and graded reading passages.
          </p>
        </div>
      </div>

      {/* Segmented Top Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setTab('grammar')}
          className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'grammar'
              ? 'bg-primary/10 border-primary text-primary shadow-xs'
              : 'bg-card border-border/70 hover:border-primary/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Grammar (204+)</span>
        </button>

        <button
          onClick={() => setTab('kana')}
          className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'kana'
              ? 'bg-primary/10 border-primary text-primary shadow-xs'
              : 'bg-card border-border/70 hover:border-primary/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Kana Tables</span>
        </button>

        <button
          onClick={() => setTab('vocab')}
          className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'vocab'
              ? 'bg-primary/10 border-primary text-primary shadow-xs'
              : 'bg-card border-border/70 hover:border-primary/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Vocabulary</span>
        </button>

        <button
          onClick={() => setTab('reading')}
          className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'reading'
              ? 'bg-primary/10 border-primary text-primary shadow-xs'
              : 'bg-card border-border/70 hover:border-primary/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookMarked className="h-4 w-4" />
          <span>Graded Reading</span>
        </button>
      </div>

      {/* 1. GRAMMAR TAB */}
      {activeTab === 'grammar' && (
        <div className="space-y-4">
          {activeGrammarPoint ? (
            <GrammarPointInspector
              item={activeGrammarPoint}
              allGrammar={combinedList}
              onSelectGrammar={(target) => setActiveGrammarPoint(target)}
              onBack={() => setActiveGrammarPoint(null)}
              historyTrail={[]}
            />
          ) : (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search grammar point or English meaning..."
                    value={grammarSearch}
                    onChange={(e) => setGrammarSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Track selector */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setCatalogTrack('core')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      catalogTrack === 'core'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Curated (204)
                  </button>
                  <button
                    onClick={() => setCatalogTrack('reference')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      catalogTrack === 'reference'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Reference (979)
                  </button>
                </div>
              </div>

              {/* JLPT Level Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {JLPT_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
                      selectedLevel === lvl
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Grammar Cards List */}
              <div className="rounded-2xl border divide-y overflow-hidden bg-card">
                {filteredGrammar.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No grammar points found matching &ldquo;{grammarSearch}&rdquo; in {selectedLevel}.
                  </div>
                ) : (
                  filteredGrammar.map((item) => (
                    <div
                      key={`${item.grammar}-${item.level}`}
                      onClick={() => setActiveGrammarPoint(item)}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold font-japanese text-foreground">
                            {item.grammar}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary">
                            {item.level}
                          </Badge>
                          {item.track === 'core' && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              Validated Cloze
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.meaning}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            speakJapanese(item.grammar)
                          }}
                          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                          aria-label="Play audio"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. KANA TAB */}
      {activeTab === 'kana' && <KanaChart />}

      {/* 3. VOCABULARY TAB */}
      {activeTab === 'vocab' && <BunproVocabLists />}

      {/* 4. READING TAB */}
      {activeTab === 'reading' && <BunproReadingPractice />}
    </div>
  )
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading library...</div>}>
      <LibraryContent />
    </Suspense>
  )
}
