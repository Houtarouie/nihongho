'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Play,
  Pause,
  Settings,
  BookOpen,
  CheckCircle2,
  Plus,
  Languages,
} from 'lucide-react'
import {
  getReadingPassage,
  type ReadingPassage,
  type ReadingGrammarNote,
} from '@/data/bunpro-reading'
import {
  addCustomSRSCard,
  loadUserStats,
  saveUserStats,
  speakJapanese,
  stopJapaneseSpeech,
} from '@/data/srs-deck'
import { toast } from 'sonner'

const JLPT_LEVELS: ('N5' | 'N4' | 'N3' | 'N2' | 'N1')[] = [
  'N5',
  'N4',
  'N3',
  'N2',
  'N1',
]
const LESSON_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

type FuriganaMode = 'all' | 'hover' | 'none'

function renderJapaneseWithFurigana(
  text: string,
  furiganaMode: FuriganaMode
): React.ReactNode {
  const rubyRegex = /([^\s\[\]。、！？「」『』（）]+)\[([^\]]+)\]/g
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = rubyRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index))
    }
    const base = match[1]
    const rt = match[2]
    if (furiganaMode === 'none') {
      parts.push(base)
    } else {
      parts.push(
        <ruby
          key={`rb-${match.index}`}
          className={`mx-0.5 ${
            furiganaMode === 'hover'
              ? '[&>rt]:opacity-0 hover:[&>rt]:opacity-100 [&>rt]:transition-opacity'
              : ''
          }`}
        >
          {base}
          <rt className="text-[0.58em] font-normal text-muted-foreground select-none">
            {rt}
          </rt>
        </ruby>
      )
    }
    lastIdx = rubyRegex.lastIndex
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx))
  }
  return parts
}

export function BunproReadingPractice() {
  const [selectedPassage, setSelectedPassage] =
    useState<ReadingPassage | null>(null)
  const [isVertical, setIsVertical] = useState(false)
  const [showAllTranslations, setShowAllTranslations] = useState(false)
  const [revealedLineIds, setRevealedLineIds] = useState<string[]>([])
  const [furiganaMode, setFuriganaMode] = useState<FuriganaMode>('all')
  const [highlightGrammar, setHighlightGrammar] = useState(true)
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(2) // Default highlight line 3 like Screenshot 1
  const [isPlaying, setIsPlaying] = useState(false)
  const [speechRate, setSpeechRate] = useState<number>(0.9)
  const [selectedGrammarNote, setSelectedGrammarNote] =
    useState<ReadingGrammarNote | null>(null)
  const [completedPassages, setCompletedPassages] = useState<string[]>([])
  const [quizAnswerIdx, setQuizAnswerIdx] = useState<number | null>(null)

  useEffect(() => {
    const stats = loadUserStats()
    setCompletedPassages(stats.completedLessons || [])
  }, [])

  // Stop speech when leaving passage
  useEffect(() => {
    return () => {
      stopJapaneseSpeech()
    }
  }, [selectedPassage])

  function playSentenceAtIndex(
    passage: ReadingPassage,
    idx: number,
    autoContinue: boolean
  ) {
    const sentence = passage.sentences[idx]
    if (!sentence) {
      setIsPlaying(false)
      return
    }
    setActiveSentenceIdx(idx)
    setIsPlaying(true)
    const cleanText = sentence.japanese.replace(/\[[^\]]+\]/g, '').trim()
    speakJapanese(cleanText, {
      rate: speechRate,
      onEnd: () => {
        if (autoContinue && idx + 1 < passage.sentences.length) {
          playSentenceAtIndex(passage, idx + 1, true)
        } else {
          setIsPlaying(false)
        }
      },
      onError: () => setIsPlaying(false),
    })
  }

  function togglePlayAll() {
    if (!selectedPassage) return
    if (isPlaying) {
      stopJapaneseSpeech()
      setIsPlaying(false)
    } else {
      const startIdx =
        activeSentenceIdx >= selectedPassage.sentences.length
          ? 0
          : activeSentenceIdx
      playSentenceAtIndex(selectedPassage, startIdx, true)
    }
  }

  function toggleLineTranslation(lineId: string) {
    setRevealedLineIds((prev) =>
      prev.includes(lineId)
        ? prev.filter((id) => id !== lineId)
        : [...prev, lineId]
    )
  }

  function markPassageCompleted(passageId: string) {
    const key = `reading-${passageId}`
    const stats = loadUserStats()
    const already = stats.completedLessons.includes(key)
    const nextCompleted = already
      ? stats.completedLessons
      : [...stats.completedLessons, key]
    saveUserStats({
      completedLessons: nextCompleted,
      xp: already ? stats.xp : stats.xp + 35,
      reading_mins: 10,
    } as Partial<ReturnType<typeof loadUserStats>>)
    setCompletedPassages(nextCompleted)
    toast.success(
      already
        ? 'Passage already marked completed!'
        : 'Reading Passage completed! +35 XP 📖'
    )
  }

  // VIEW 1: PASSAGE READER (Matches Screenshot 1: [N5] Lesson 1 《本について話す》)
  if (selectedPassage) {
    const totalSentences = selectedPassage.sentences.length
    const progressPct =
      totalSentences > 0
        ? Math.min(
            100,
            Math.round(((activeSentenceIdx + 1) / totalSentences) * 100)
          )
        : 0
    const isDone = completedPassages.includes(`reading-${selectedPassage.id}`)

    return (
      <div className="space-y-6">
        {/* Top Bar: <- [N5] Lesson 1 & Horizontal / Vertical Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={() => {
              stopJapaneseSpeech()
              setIsPlaying(false)
              setSelectedPassage(null)
              setQuizAnswerIdx(null)
            }}
            className="flex items-center gap-2.5 text-lg sm:text-xl font-bold hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
            <span>
              [{selectedPassage.level}] Lesson {selectedPassage.lessonNumber}
            </span>
          </button>

          {/* Horizontal | Vertical (Tategaki) Toggle Pill */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsVertical(false)}
              className={`transition-colors ${
                !isVertical
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Horizontal
            </button>
            <button
              type="button"
              onClick={() => setIsVertical((v) => !v)}
              aria-label="Toggle Horizontal or Vertical Japanese text"
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-muted-foreground/30 p-0.5 transition-colors"
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-foreground transition-transform ${
                  isVertical ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => setIsVertical(true)}
              className={`transition-colors ${
                isVertical
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Vertical
            </button>
          </div>
        </div>

        {/* Main Bunpro Reader Container */}
        <Card className="border-border/80 shadow-md overflow-hidden">
          <CardContent className="p-5 sm:p-8 space-y-6">
            {/* Title with Furigana & Footnote Marker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">
                {renderJapaneseWithFurigana(
                  selectedPassage.titleJp,
                  furiganaMode
                )}
                {highlightGrammar && (
                  <sup className="text-xs font-semibold text-primary ml-1">
                    (1)
                  </sup>
                )}
              </h2>
              {showAllTranslations && (
                <span className="text-sm text-muted-foreground italic">
                  {selectedPassage.titleEn}
                </span>
              )}
            </div>

            {/* Reader Controls Toolbar: Show All Translations | User Furigana | Highlight Target Grammar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAllTranslations((v) => !v)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  showAllTranslations
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'bg-muted/40 hover:bg-muted'
                }`}
              >
                {showAllTranslations
                  ? 'Hide All Translations'
                  : 'Show All Translations'}
              </button>

              <select
                value={furiganaMode}
                onChange={(e) =>
                  setFuriganaMode(e.target.value as FuriganaMode)
                }
                aria-label="Furigana visibility mode"
                className="rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium outline-none"
              >
                <option value="all">User Furigana (All On)</option>
                <option value="hover">Furigana on Hover</option>
                <option value="none">Hide Furigana</option>
              </select>

              <label className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium cursor-pointer select-none hover:bg-muted">
                <span>Highlight Target Grammar</span>
                <input
                  type="checkbox"
                  checked={highlightGrammar}
                  onChange={(e) => setHighlightGrammar(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary rounded"
                />
              </label>
            </div>

            {/* Bunpro Segmented Audio Scrubber Bar */}
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={togglePlayAll}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-white transition-colors"
                title={isPlaying ? 'Pause audio' : 'Play passage audio'}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>

              {/* Segmented Track with Sentence Tick Marks */}
              <div className="relative flex-1 h-2.5 rounded-full bg-muted overflow-visible flex items-center">
                <div
                  className="h-full rounded-l-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
                {/* Sentence segment dividers */}
                {selectedPassage.sentences.map((s, idx) => {
                  if (idx === 0) return null
                  const leftPct = Math.round((idx / totalSentences) * 100)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        playSentenceAtIndex(selectedPassage, idx, false)
                      }
                      style={{ left: `${leftPct}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-background/70 hover:bg-white"
                      title={`Jump to sentence ${idx + 1}`}
                    />
                  )
                })}
                {/* Scrubber Thumb */}
                <div
                  className="absolute h-4 w-4 -translate-x-1/2 rounded-full bg-primary shadow ring-2 ring-background transition-all duration-300"
                  style={{ left: `${progressPct}%` }}
                />
              </div>

              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {selectedPassage.durationLabel}
              </span>

              <button
                type="button"
                onClick={() => {
                  const nextRate =
                    speechRate === 0.9 ? 0.75 : speechRate === 0.75 ? 1.15 : 0.9
                  setSpeechRate(nextRate)
                  toast.info(`Audio speed set to ${nextRate}x`)
                }}
                className="text-muted-foreground hover:text-foreground"
                title={`Audio Speed (${speechRate}x)`}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            {/* Passage Sentences (Supports Both Horizontal Yokogaki and Vertical Tategaki!) */}
            <div
              className={
                isVertical
                  ? 'overflow-x-auto py-4 border rounded-xl p-6 bg-muted/10 flex justify-end'
                  : 'space-y-5 pt-2'
              }
            >
              <div
                className={
                  isVertical
                    ? '[writing-mode:vertical-rl] min-h-[320px] space-x-reverse space-x-6 leading-loose text-lg sm:text-xl font-medium'
                    : 'space-y-4'
                }
              >
                {selectedPassage.sentences.map((s, idx) => {
                  const isActive = activeSentenceIdx === idx
                  const showTrans =
                    showAllTranslations || revealedLineIds.includes(s.id)

                  return (
                    <div
                      key={s.id}
                      onClick={() =>
                        playSentenceAtIndex(selectedPassage, idx, false)
                      }
                      className={`group cursor-pointer rounded-lg p-2 transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary dark:text-rose-400'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {!isVertical && (
                          <span
                            className={`text-xs transition-opacity ${
                              isActive
                                ? 'opacity-100 text-primary'
                                : 'opacity-0 group-hover:opacity-60'
                            }`}
                          >
                            ▶
                          </span>
                        )}
                        <span className="text-lg sm:text-xl font-medium leading-relaxed tracking-wide">
                          {renderJapaneseWithFurigana(s.japanese, furiganaMode)}
                        </span>

                        {/* Target Grammar Footnote Superscripts */}
                        {highlightGrammar &&
                          s.grammarRefs.map((refNum) => {
                            const note = selectedPassage.grammarNotes.find(
                              (n) => n.num === refNum
                            )
                            return (
                              <button
                                key={refNum}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (note) setSelectedGrammarNote(note)
                                }}
                                className="text-xs font-bold text-primary hover:underline px-0.5"
                                title={
                                  note
                                    ? `${note.grammar}: ${note.meaning}`
                                    : undefined
                                }
                              >
                                ({refNum})
                              </button>
                            )
                          })}

                        {/* Per-Line Translation Toggle Icon (文A) */}
                        {!isVertical && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLineTranslation(s.id)
                            }}
                            className="ml-1 inline-flex items-center text-xs text-muted-foreground opacity-60 hover:opacity-100 hover:text-primary"
                            title="Toggle English translation for this sentence"
                          >
                            <Languages className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {showTrans && !isVertical && (
                        <p className="text-sm text-muted-foreground pl-5 pt-1 animate-in fade-in duration-150">
                          {s.english}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Target Grammar Footnotes Bar (Interactive when Highlight Target Grammar is checked) */}
            {highlightGrammar && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Target Grammar in [{selectedPassage.level}] Lesson{' '}
                    {selectedPassage.lessonNumber}
                  </span>
                  {selectedGrammarNote && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        const res = addCustomSRSCard({
                          front: selectedGrammarNote.grammar,
                          reading: selectedGrammarNote.grammar,
                          meaning: selectedGrammarNote.meaning,
                          category: 'grammar',
                          jlptLevel: selectedPassage.level,
                        })
                        if (res.added) {
                          toast.success(
                            `Added "${selectedGrammarNote.grammar}" to your SRS Deck!`
                          )
                        } else {
                          toast.info(
                            `"${selectedGrammarNote.grammar}" is already in your SRS Deck.`
                          )
                        }
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add &ldquo;
                      {selectedGrammarNote.grammar}&rdquo; to SRS
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPassage.grammarNotes.map((g) => (
                    <button
                      key={g.num}
                      type="button"
                      onClick={() => setSelectedGrammarNote(g)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs text-left transition-all ${
                        selectedGrammarNote?.num === g.num
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'bg-background hover:border-primary/40'
                      }`}
                    >
                      <span className="font-bold text-primary mr-1">
                        ({g.num}) {g.grammar}
                      </span>
                      <span className="text-muted-foreground">
                        — {g.meaning}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider & Scene Illustration Panel (Matches Screenshot 1's Classroom Illustration Box) */}
            <div className="border-t pt-6 flex flex-col items-center space-y-3">
              <div className="w-full max-w-md rounded-xl border-2 bg-muted/20 p-6 flex flex-col items-center text-center space-y-3">
                {/* Clean Manga-Style Scene Illustration SVG */}
                <svg
                  viewBox="0 0 360 200"
                  className="w-full h-44 rounded-lg bg-background border p-2 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {/* Classroom Blackboard / Window Background */}
                  <rect x="20" y="15" width="130" height="80" rx="4" className="stroke-muted-foreground/50" />
                  <rect x="190" y="15" width="150" height="80" rx="4" className="stroke-muted-foreground/50" />
                  <line x1="40" y1="35" x2="110" y2="35" className="stroke-muted-foreground/40" />
                  <line x1="40" y1="55" x2="95" y2="55" className="stroke-muted-foreground/40" />
                  {/* Desk & Stack of Books */}
                  <line x1="60" y1="150" x2="300" y2="150" strokeWidth="2.5" />
                  <rect x="150" y="138" width="60" height="12" rx="2" className="fill-primary/20 stroke-primary" />
                  <rect x="154" y="126" width="54" height="12" rx="2" className="fill-primary/10" />
                  <rect x="152" y="114" width="58" height="12" rx="2" className="fill-primary/20 stroke-primary" />
                  <rect x="156" y="102" width="50" height="12" rx="2" className="fill-primary/10" />
                  {/* Left Student */}
                  <circle cx="105" cy="82" r="20" />
                  <path d="M85 150 L90 105 L120 105 L125 150" />
                  <path d="M120 115 L145 125" />
                  {/* Right Student */}
                  <circle cx="255" cy="82" r="20" />
                  <path d="M235 150 L240 105 L270 105 L275 150" />
                  <path d="M240 115 L215 125" />
                </svg>
                <p className="text-xs text-muted-foreground">
                  {selectedPassage.sceneCaption}
                </p>
              </div>
            </div>

            {/* Reading Comprehension Check & Complete Button */}
            <div className="rounded-xl border bg-muted/20 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Badge variant="secondary" className="mb-1">
                    Reading Comprehension Check
                  </Badge>
                  <h3 className="font-bold text-base">
                    {selectedPassage.comprehensionQuestion.question}
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant={isDone ? 'secondary' : 'default'}
                  onClick={() => markPassageCompleted(selectedPassage.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {isDone ? 'Completed ✓' : 'Mark Passage Read (+35 XP)'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedPassage.comprehensionQuestion.options.map(
                  (opt, oIdx) => {
                    const isCorrect =
                      oIdx ===
                      selectedPassage.comprehensionQuestion.correctIndex
                    const isSelected = quizAnswerIdx === oIdx
                    let variant: 'outline' | 'default' | 'destructive' =
                      'outline'
                    if (quizAnswerIdx !== null) {
                      if (isCorrect) variant = 'default'
                      else if (isSelected) variant = 'destructive'
                    }
                    return (
                      <Button
                        key={opt}
                        variant={variant}
                        className="justify-start h-auto py-2.5 text-left whitespace-normal"
                        onClick={() => {
                          setQuizAnswerIdx(oIdx)
                          if (isCorrect) {
                            toast.success('Correct comprehension answer! 🎉')
                          } else {
                            toast.error('Try checking the passage text again!')
                          }
                        }}
                      >
                        {opt}
                      </Button>
                    )
                  }
                )}
              </div>

              {quizAnswerIdx !== null && (
                <p className="text-xs text-muted-foreground bg-background p-3 rounded-lg border">
                  💡 {selectedPassage.comprehensionQuestion.explanation}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // VIEW 2: JLPT READING PRACTICE INDEX GRID (Matches Screenshot 2: N5..N1 Lesson 1..10 Grid)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">
          JLPT Reading Practice
        </h2>
      </div>

      {/* Bunpro Info Banner (Exact match to Screenshot 2) */}
      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2 leading-relaxed">
        <p>
          Below you will find graded reading practices that are divided by JLPT level.
        </p>
        <p>
          If you&apos;re learning via the{' '}
          <span className="text-primary font-medium">
            default JLPT grammar Decks
          </span>
          , only the grammar taught in each of their respective Lessons will show up on each page. This ensures that whether you&apos;re doing beginner or high-level practice, you&apos;ll never encounter items that you have not learned yet.
        </p>
      </div>

      {/* N5, N4, N3, N2, N1 Lesson 1-10 Grids */}
      <div className="space-y-8">
        {JLPT_LEVELS.map((level) => (
          <div key={level} className="space-y-3">
            <h3 className="text-lg font-bold tracking-tight">{level}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {LESSON_NUMBERS.map((lessonNum) => {
                const passageId = `${level}-${lessonNum}`
                const isDone = completedPassages.includes(
                  `reading-${passageId}`
                )
                return (
                  <button
                    key={passageId}
                    type="button"
                    onClick={() => {
                      const p = getReadingPassage(level, lessonNum)
                      setSelectedPassage(p)
                      setActiveSentenceIdx(0)
                      setSelectedGrammarNote(p.grammarNotes[0] || null)
                    }}
                    className="group flex items-center justify-between rounded-lg border bg-card px-4 py-4 text-left font-bold text-sm shadow-sm transition-all hover:border-primary/60 hover:bg-muted/40"
                  >
                    <span className="group-hover:text-primary transition-colors">
                      [{level}] Lesson {lessonNum}
                    </span>
                    {isDone && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
