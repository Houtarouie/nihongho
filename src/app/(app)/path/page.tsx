'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
  Search,
  Zap,
  X,
} from 'lucide-react'
import { useProgress } from '@/lib/progress'
import { CURRICULUM_PATH, type CurriculumUnit, type CurriculumLessonItem } from '@/data/curriculum-path'
import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  KATAKANA_GOJUON,
  type KanaItem,
} from '@/data/kana'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { KanaQuizModal } from '@/components/quiz/kana-quiz-modal'
import { GrammarPointInspector } from '@/components/bunpro/grammar-point-inspector'
import curatedGrammarData from '@/data/user-grammar-curated.json'
import referenceGrammarData from '@/data/grammar.json'
import type { GrammarPointSummary } from '@/data/bunpro-grammar-details'
import { convertRomajiToKana } from '@/lib/kana-ime'

const ALL_GRAMMAR_POINTS: GrammarPointSummary[] = [
  ...curatedGrammarData.grammar.map((g) => ({
    grammar: g.grammar,
    title: g.title,
    meaning: g.meaning,
    level: g.level,
    lesson: g.lesson,
    track: 'core' as const,
  })),
  ...(referenceGrammarData as GrammarPointSummary[]).map((r) => ({
    grammar: r.grammar,
    meaning: r.meaning,
    level: r.level,
    lesson: r.lesson,
    title: r.title || r.grammar,
    track: 'reference' as const,
  })),
]

const TYPE_ICONS = {
  kana: GraduationCap,
  grammar: BookOpen,
  vocab: Sparkles,
  review: Layers,
}

const TYPE_COLORS = {
  kana: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  grammar: 'text-primary bg-primary/10 border-primary/20',
  vocab: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  review: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
}

// Pre-defined kana pools for Unit 0 lessons
const KANA_LESSON_POOLS: Record<string, KanaItem[]> = {
  'kana-0-1': HIRAGANA_GOJUON.slice(0, 5)
    .flatMap((r) => r.items)
    .filter((it): it is KanaItem => Boolean(it)),
  'kana-0-2': HIRAGANA_GOJUON.slice(5)
    .flatMap((r) => r.items)
    .filter((it): it is KanaItem => Boolean(it)),
  'kana-0-3': HIRAGANA_DAKUTEN.flatMap((r) => r.items).filter(
    (it): it is KanaItem => Boolean(it)
  ),
  'kana-0-4': KATAKANA_GOJUON.flatMap((r) => r.items).filter(
    (it): it is KanaItem => Boolean(it)
  ),
}

const JLPT_LEVELS = [
  { id: 'ALL', label: 'All' },
  { id: 'N5', label: 'N5 (Beginner)' },
  { id: 'N4', label: 'N4 (Elementary)' },
  { id: 'N3', label: 'N3 (Intermediate)' },
  { id: 'N2', label: 'N2 (Pre-Advanced)' },
  { id: 'N1', label: 'N1 (Advanced)' },
] as const

type LevelFilter = (typeof JLPT_LEVELS)[number]['id']

export default function PathPage() {
  const router = useRouter()
  const { stats } = useProgress()
  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('N5')
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    'unit-0': true,
    'unit-1': true,
    'unit-8': true,
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [quizItems, setQuizItems] = useState<KanaItem[]>([])
  const [quizTitle, setQuizTitle] = useState('Lesson Quiz')

  // Grammar Point Inspector Modal State
  const [inspectingGrammar, setInspectingGrammar] = useState<GrammarPointSummary | null>(null)

  const completedLessonIds = new Set(stats.completedLessons || [])

  function toggleUnit(unitId: string) {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }))
  }

  function handleStartLessonQuiz(lessonId: string, title: string) {
    const pool = KANA_LESSON_POOLS[lessonId]
    if (pool && pool.length > 0) {
      setQuizItems(pool)
      setQuizTitle(`${title} Recall Quiz`)
      setIsQuizOpen(true)
    }
  }

  function handleStudyLesson(lesson: CurriculumLessonItem) {
    if (lesson.type === 'grammar') {
      const titleLower = lesson.title.toLowerCase()
      const match = ALL_GRAMMAR_POINTS.find(
        (g) =>
          lesson.title.includes(g.grammar) ||
          g.title?.toLowerCase().includes(titleLower) ||
          lesson.keyPoints.some((k) => k.includes(g.grammar))
      )
      if (match) {
        setInspectingGrammar(match)
        return
      }
    }

    if (lesson.type === 'kana') {
      const pool = KANA_LESSON_POOLS[lesson.id]
      if (pool && pool.length > 0) {
        setQuizItems(pool)
        setQuizTitle(`${lesson.title} Practice`)
        setIsQuizOpen(true)
        return
      }
    }

    router.push(lesson.actionUrl)
  }

  // Filter lessons by level & search
  const levelFilteredUnits = CURRICULUM_PATH.filter(
    (unit) => selectedLevel === 'ALL' || unit.jlptLevel === selectedLevel
  )

  const filteredUnits = levelFilteredUnits
    .map((unit) => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return unit

      const kanaQ =
        q === 'wa' ? 'は' : q === 'e' ? 'へ' : q === 'o' || q === 'wo' ? 'を' : convertRomajiToKana(q)

      const matchingLessons = unit.lessons.filter((l) => {
        const titleLower = l.title.toLowerCase()
        if (titleLower.includes(q) || (kanaQ && titleLower.includes(kanaQ))) {
          if (q.length <= 2 && /^[a-z]+$/.test(q)) {
            const wordBound = new RegExp(`\\b${q}\\b`, 'i')
            if (wordBound.test(titleLower) || titleLower.startsWith(q)) return true
          } else {
            return true
          }
        }

        if (
          l.keyPoints.some(
            (kp) => kp.toLowerCase().includes(q) || (kanaQ && kp.includes(kanaQ))
          )
        ) {
          return true
        }

        const descLower = l.description.toLowerCase()
        if (descLower.includes(q)) {
          if (q.length <= 2 && /^[a-z]+$/.test(q)) {
            const wordBound = new RegExp(`\\b${q}\\b`, 'i')
            return wordBound.test(descLower)
          }
          return true
        }

        return false
      })

      return {
        ...unit,
        lessons: matchingLessons,
      }
    })
    .filter((unit) => unit.lessons.length > 0)

  const currentLevelLessons = levelFilteredUnits.flatMap((u) => u.lessons)
  const totalLessons = currentLevelLessons.length
  const completedCount = currentLevelLessons.filter((l) => completedLessonIds.has(l.id)).length

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 gap-1.5">
              <Compass className="h-3.5 w-3.5 text-primary" />
              {selectedLevel === 'ALL' ? 'Complete Syllabus (N5–N1)' : `JLPT ${selectedLevel} Curriculum`}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {completedCount} / {totalLessons} Lessons Done
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Learning Path</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step-by-step sequential syllabus from absolute beginner to advanced proficiency.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics (e.g. te-form, wa, kanji)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* JLPT Level Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {JLPT_LEVELS.map((lvl) => {
          const isSelected = selectedLevel === lvl.id
          const count =
            lvl.id === 'ALL'
              ? CURRICULUM_PATH.length
              : CURRICULUM_PATH.filter((u) => u.jlptLevel === lvl.id).length
          return (
            <button
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              <span>{lvl.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted-foreground/15 text-muted-foreground'
                }`}
              >
                {count} {count === 1 ? 'unit' : 'units'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search Result Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between text-xs px-3 py-2 text-muted-foreground bg-muted/40 rounded-xl border">
          <span>
            Found <strong>{filteredUnits.reduce((acc, u) => acc + u.lessons.length, 0)}</strong> lesson{filteredUnits.reduce((acc, u) => acc + u.lessons.length, 0) === 1 ? '' : 's'} matching &ldquo;{searchQuery}&rdquo;
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.dispatchEvent(new CustomEvent('open-omni-search'))}
              className="h-6 text-[11px] rounded-lg gap-1 font-normal"
            >
              <Search className="h-3 w-3" />
              Search Dictionary
            </Button>
            <button
              onClick={() => setSearchQuery('')}
              className="text-primary hover:underline font-medium text-[11px]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Units Roadmap */}
      <div className="space-y-4">
        {filteredUnits.map((unit: CurriculumUnit) => {
          const isExpanded = expandedUnits[unit.id] ?? false
          const unitCompletedCount = unit.lessons.filter((l) => completedLessonIds.has(l.id)).length
          const isUnitFullyDone = unitCompletedCount === unit.lessons.length && unit.lessons.length > 0

          return (
            <Card
              key={unit.id}
              className={`rounded-2xl transition-all overflow-hidden border ${
                unit.unitNumber === 0 || unit.unitNumber === 1
                  ? 'border-primary/30 shadow-xs'
                  : 'border-border/80'
              }`}
            >
              <CardHeader
                className="cursor-pointer select-none pb-3 hover:bg-muted/30 transition-colors"
                onClick={() => toggleUnit(unit.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Unit {unit.unitNumber}
                      </span>
                      <Badge variant="secondary" className="text-[10px] py-0 font-semibold">
                        {unit.jlptLevel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {unit.lessons.length} Lesson{unit.lessons.length === 1 ? '' : 's'}
                      </span>
                      {isUnitFullyDone && (
                        <Badge variant="outline" className="text-[10px] py-0 gap-1 text-emerald-600 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{unit.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{unit.subtitle}</CardDescription>
                  </div>

                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 rounded-lg">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-2 pb-5 border-t bg-muted/10 space-y-3">
                  <div className="grid gap-3">
                    {unit.lessons.map((lesson) => {
                      const Icon = TYPE_ICONS[lesson.type] || BookOpen
                      const typeClass = TYPE_COLORS[lesson.type] || 'text-primary bg-primary/10'
                      const isCompleted = completedLessonIds.has(lesson.id)
                      const hasKanaQuiz = Boolean(KANA_LESSON_POOLS[lesson.id])

                      return (
                        <div
                          key={lesson.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-background hover:border-primary/30 transition-colors"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-muted-foreground">
                                {lesson.lessonNumber}
                              </span>
                              <Badge variant="outline" className={`text-[10px] py-0 px-2 uppercase font-semibold border ${typeClass}`}>
                                <Icon className="h-2.5 w-2.5 mr-1" />
                                {lesson.type}
                              </Badge>
                              <h4 className="text-sm font-bold text-foreground">{lesson.title}</h4>
                            </div>

                            <p className="text-xs text-muted-foreground">{lesson.description}</p>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {lesson.keyPoints.map((point, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] font-japanese bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md"
                                >
                                  {point}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                            {isCompleted ? (
                              <Badge variant="outline" className="text-xs text-emerald-600 gap-1 border-emerald-500/20 py-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Done
                              </Badge>
                            ) : null}

                            {hasKanaQuiz && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartLessonQuiz(lesson.id, lesson.title)}
                                className="h-8 text-xs rounded-xl gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/10"
                              >
                                <Zap className="h-3.5 w-3.5" />
                                Quiz
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant={isCompleted ? 'outline' : 'default'}
                              onClick={() => handleStudyLesson(lesson)}
                              className="h-8 text-xs rounded-xl gap-1.5"
                            >
                              Study Lesson
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Lesson Quiz Modal */}
      <KanaQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        items={quizItems}
        title={quizTitle}
        initialMode="kana-to-romaji"
      />

      {/* Grammar Lesson Inspection Modal */}
      {inspectingGrammar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border-2 shadow-2xl bg-card p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Grammar Lesson Inspection
              </span>
              <button
                onClick={() => setInspectingGrammar(null)}
                className="p-1 rounded-xl text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <GrammarPointInspector
              item={inspectingGrammar}
              allGrammar={ALL_GRAMMAR_POINTS}
              onSelectGrammar={(g) => setInspectingGrammar(g)}
              onBack={() => setInspectingGrammar(null)}
              historyTrail={[]}
              initialTab="study"
            />
          </div>
        </div>
      )}
    </div>
  )
}
