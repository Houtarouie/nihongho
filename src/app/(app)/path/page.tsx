'use client'

import React, { useState, useEffect } from 'react'
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
  Lock,
  Plus,
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
import { MasteryPips } from '@/components/kana/mastery-pips'
import { GrammarPointInspector } from '@/components/bunpro/grammar-point-inspector'
import curatedGrammarData from '@/data/user-grammar-curated.json'
import referenceGrammarData from '@/data/grammar.json'
import type { GrammarPointSummary } from '@/data/bunpro-grammar-details'
import { convertRomajiToKana } from '@/lib/kana-ime'
import {
  getUnit0Lessons,
  getUnitState,
  getNextCurriculumStep,
  isLessonComplete,
  buildPlacementQuiz,
  evaluatePlacementQuiz,
  type Unit0Lesson,
} from '@/lib/curriculum/curriculum-engine'
import { makeKanaId, detectKanaScript } from '@/lib/kana/mastery-engine'
import type { KanaScript } from '@/lib/kana/types'
import type { SRSCard } from '@/data/srs-deck'
import { toast } from 'sonner'

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
  const { stats, kanaMastery, upsertCards, saveKanaMasteryBatch } = useProgress()
  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('N5')
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    'unit-0': true,
    'unit-1': true,
    'unit-8': true,
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Placement Test Out State
  const [placementScript, setPlacementScript] = useState<KanaScript | null>(null)

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [quizItems, setQuizItems] = useState<KanaItem[]>([])
  const [quizTitle, setQuizTitle] = useState('Lesson Quiz')

  // Grammar Point Inspector Modal State
  const [inspectingGrammar, setInspectingGrammar] = useState<GrammarPointSummary | null>(null)

  const completedLessonIds = new Set(stats.completedLessons || [])
  const nextStep = getNextCurriculumStep(kanaMastery)
  const unit0Lessons = getUnit0Lessons()

  function toggleUnit(unitId: string) {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }))
  }

  function handleStartLessonQuiz(lessonId: string, title: string) {
    const pool = KANA_LESSON_POOLS[lessonId]
    if (pool && pool.length > 0) {
      setPlacementScript(null)
      setQuizItems(pool)
      setQuizTitle(`${title} Recall Quiz`)
      setIsQuizOpen(true)
    }
  }

  function handleStartCustomKanaQuiz(items: KanaItem[], title: string) {
    setPlacementScript(null)
    setQuizItems(items)
    setQuizTitle(title)
    setIsQuizOpen(true)
  }

  function handleStartPlacementQuiz(script: KanaScript) {
    const sample = buildPlacementQuiz(script)
    setPlacementScript(script)
    setQuizItems(sample)
    setQuizTitle(`Test Out: ${script === 'hiragana' ? 'Hiragana' : 'Katakana'} Placement (20 Questions)`)
    setIsQuizOpen(true)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const placement = params.get('placement')
    if (placement === 'hiragana') {
      handleStartPlacementQuiz('hiragana')
    } else if (placement === 'katakana' || placement === 'both') {
      handleStartPlacementQuiz('katakana')
    }
  }, [])

  async function handleQuizComplete(results: { kana: string; correct: boolean }[]) {
    if (placementScript) {
      const evaluated = evaluatePlacementQuiz(placementScript, results)
      if (evaluated.passed && evaluated.recordsToUpdate) {
        await saveKanaMasteryBatch(evaluated.recordsToUpdate)
        toast.success(
          `🎉 Passed with ${evaluated.accuracy}% (${evaluated.score}/${evaluated.total})! All ${
            placementScript === 'hiragana' ? 'Hiragana' : 'Katakana'
          } marked Solid (Stage 3). Unit 1 is unlocked!`
        )
      } else {
        toast.error(
          `Placement quiz: scored ${evaluated.accuracy}% (${evaluated.score}/${evaluated.total}). 90% required to test out. Keep practicing!`
        )
      }
      setPlacementScript(null)
    }
  }

  async function handleAddLessonToSRS(lesson: Unit0Lesson) {
    const now = Date.now()
    const newCards: SRSCard[] = lesson.items.map((it) => ({
      id: `kana_${detectKanaScript(it.kana)}_${it.kana}`,
      front: it.kana,
      back: it.romaji,
      reading: it.romaji,
      meaning: `${lesson.script === 'hiragana' ? 'Hiragana' : 'Katakana'} character for "${it.romaji}"`,
      category: 'kana',
      jlptLevel: 'N5',
      cardType: 'kana',
      tags: ['kana', lesson.script, `${it.row}-row`],
      exampleSentence: it.example,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: now,
      status: 'new',
      queue: 'active',
      lapses: 0,
    }))
    const res = await upsertCards(newCards)
    toast.success(`Added ${res.addedCount} cards from ${lesson.title} to Daily SRS Reviews!`)
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

      {/* Hero Next Step Banner */}
      <Card className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 gap-1">
                <Zap className="h-3 w-3" />
                Current Curriculum Goal
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {nextStep.unitId === 'unit-0' ? 'Unit 0 • Kana Foundations' : 'Unit 1 • Core Grammar'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Continue: Lesson {nextStep.lessonNumber}, {nextStep.rowName} row
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {nextStep.title} — Practice these characters until Familiar (Stage 2) to advance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {nextStep.items.length > 0 && (
              <Button
                onClick={() => handleStartCustomKanaQuiz(nextStep.items, `Lesson ${nextStep.lessonNumber} Quiz`)}
                className="rounded-xl gap-2 font-semibold shadow-xs"
              >
                <Zap className="h-4 w-4" />
                Start Lesson {nextStep.lessonNumber} Quiz
              </Button>
            )}
            <div className="flex items-center gap-1.5 border-l pl-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartPlacementQuiz('hiragana')}
                className="h-9 text-xs rounded-xl border-dashed hover:border-primary font-medium"
              >
                Test Out: Hiragana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartPlacementQuiz('katakana')}
                className="h-9 text-xs rounded-xl border-dashed hover:border-primary font-medium"
              >
                Test Out: Katakana
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
            Found <strong>{filteredUnits.reduce((acc, u) => acc + (u.unitNumber === 0 ? unit0Lessons.length : u.lessons.length), 0)}</strong> lesson{filteredUnits.reduce((acc, u) => acc + (u.unitNumber === 0 ? unit0Lessons.length : u.lessons.length), 0) === 1 ? '' : 's'} matching &ldquo;{searchQuery}&rdquo;
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
          const unitState = getUnitState(unit.id, kanaMastery, completedLessonIds)
          const isUnit0 = unit.unitNumber === 0
          const unitLessonCount = isUnit0 ? unit0Lessons.length : unit.lessons.length

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
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Unit {unit.unitNumber}
                      </span>
                      <Badge variant="secondary" className="text-[10px] py-0 font-semibold">
                        {unit.jlptLevel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {unitLessonCount} Lessons
                      </span>

                      {/* Derived Unit State Badge */}
                      {unitState.status === 'completed' && (
                        <Badge variant="outline" className="text-[10px] py-0 gap-1 text-emerald-600 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Completed
                        </Badge>
                      )}
                      {unitState.status === 'in_progress' && (
                        <Badge variant="outline" className="text-[10px] py-0 text-blue-500 border-blue-500/30">
                          In Progress ({unitState.progressPct}%)
                        </Badge>
                      )}
                      {unitState.status === 'available' && (
                        <Badge variant="outline" className="text-[10px] py-0 text-primary border-primary/30">
                          Available
                        </Badge>
                      )}
                      {unitState.status === 'locked' && (
                        <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground border-muted-foreground/30 gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{unit.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{unit.subtitle}</CardDescription>

                    {/* Unit Progress Bar */}
                    <div
                      className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden mt-2"
                      role="progressbar"
                      aria-valuenow={unitState.progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${unit.title} progress: ${unitState.progressPct}%`}
                    >
                      <div
                        className={`h-full transition-all ${
                          unitState.status === 'completed'
                            ? 'bg-emerald-500'
                            : unitState.status === 'in_progress'
                            ? 'bg-blue-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${unitState.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 rounded-lg">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-2 pb-5 border-t bg-muted/10 space-y-3">
                  {/* Soft gate locked explanation banner */}
                  {unitState.status === 'locked' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>{unitState.lockedReason || 'Complete prerequisite units to unlock.'}</span>
                      </div>
                      {unit.id === 'unit-1' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartPlacementQuiz('hiragana')}
                          className="h-7 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10 shrink-0 font-medium"
                        >
                          Test Out of Hiragana
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3">
                    {isUnit0 ? (
                      /* Unit 0: Dynamic row-by-row lessons with <= 5 kana each */
                      unit0Lessons.map((lesson) => {
                        const isDone = isLessonComplete(lesson, kanaMastery)
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
                                <Badge variant="outline" className="text-[10px] py-0 px-2 uppercase font-semibold border text-blue-500 bg-blue-500/10 border-blue-500/20">
                                  <GraduationCap className="h-2.5 w-2.5 mr-1" />
                                  kana
                                </Badge>
                                <h4 className="text-sm font-bold text-foreground">{lesson.title}</h4>
                              </div>

                              {/* Character chips with live Mastery Pips */}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {lesson.items.map((it) => {
                                  const id = makeKanaId(it.kana, lesson.script)
                                  const stage = kanaMastery[id]?.stage ?? 0
                                  return (
                                    <div
                                      key={it.kana}
                                      className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/70 px-2 py-1 rounded-lg border text-xs transition-colors"
                                    >
                                      <span className="font-japanese font-bold text-sm text-foreground">{it.kana}</span>
                                      <span className="text-[10px] text-muted-foreground font-mono">({it.romaji})</span>
                                      <MasteryPips stage={stage} className="scale-75 origin-left" />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                              {isDone && (
                                <Badge variant="outline" className="text-xs text-emerald-600 gap-1 border-emerald-500/20 py-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Familiar
                                </Badge>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartCustomKanaQuiz(lesson.items, `${lesson.title} Recall Quiz`)}
                                className="h-8 text-xs rounded-xl gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/10"
                              >
                                <Zap className="h-3.5 w-3.5" />
                                Quiz
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAddLessonToSRS(lesson)}
                                className="h-8 text-xs rounded-xl gap-1 text-muted-foreground hover:text-foreground"
                                title="Add lesson characters to Daily SRS review deck"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                SRS
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      /* Other Units (1 to 8) */
                      unit.lessons.map((lesson) => {
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
                      })
                    )}
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
        onClose={() => {
          setIsQuizOpen(false)
          setPlacementScript(null)
        }}
        items={quizItems}
        title={quizTitle}
        initialMode="kana-to-romaji"
        onComplete={handleQuizComplete}
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
