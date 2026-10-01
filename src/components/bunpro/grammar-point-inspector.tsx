'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Undo2,
  ArrowRight,
  Play,
  ListFilter,
  CheckCheck,
  Layers,
  Volume2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Zap,
  Lightbulb,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  getGrammarPointDetail,
  getWhyAnswerExplanation,
  type GrammarPointSummary,
  type GrammarRelationCard,
} from '@/data/bunpro-grammar-details'
import {
  addCustomSRSCard,
  loadUserStats,
  saveUserStats,
  speakJapanese,
} from '@/data/srs-deck'
import { recordQuizRun } from '@/data/quiz-leaderboard'
import { addWeakPoint } from '@/data/weak-points'
import { convertRomajiToKana, isAnswerMatching } from '@/lib/kana-ime'
import { toast } from 'sonner'

interface GrammarPointInspectorProps {
  item: GrammarPointSummary
  allGrammar: GrammarPointSummary[]
  onSelectGrammar: (target: GrammarPointSummary) => void
  onBack: () => void
  historyTrail: GrammarPointSummary[]
  initialTab?: 'study' | 'quiz'
}

const MASTERED_GRAMMAR_KEY = 'nihongo_mastered_grammar_v1'

export function GrammarPointInspector({
  item,
  allGrammar,
  onSelectGrammar,
  onBack,
  historyTrail,
  initialTab = 'study',
}: GrammarPointInspectorProps) {
  const detail = getGrammarPointDetail(item)

  const [activeTab, setActiveTab] = useState<'study' | 'quiz'>(initialTab)
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [typedValue, setTypedValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showAltHint, setShowAltHint] = useState(false)
  const [isMastered, setIsMastered] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const examples = detail.allExamples
  const currentEx = examples[sentenceIdx % Math.max(1, examples.length)]

  useEffect(() => {
    setActiveTab(initialTab)
    setSentenceIdx(0)
    setTypedValue('')
    setStatus('idle')
    setShowAltHint(false)
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(MASTERED_GRAMMAR_KEY)
        const list: string[] = raw ? JSON.parse(raw) : []
        setIsMastered(list.includes(item.grammar))
      } catch {
        // ignore
      }
    }
  }, [item.grammar, initialTab])

  useEffect(() => {
    if (activeTab === 'quiz') {
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [activeTab, sentenceIdx])

  const whyExplanation = useMemo(() => {
    if (!currentEx) return null
    return getWhyAnswerExplanation(detail, currentEx)
  }, [detail, currentEx])

  function handleUndo() {
    setTypedValue('')
    setStatus('idle')
    setShowAltHint(false)
    setTimeout(() => inputRef.current?.focus(), 40)
  }

  function handleSubmitOrNext() {
    if (!currentEx) return

    // If already answered correctly, advance to next sentence
    if (status === 'correct') {
      const nextIdx = sentenceIdx + 1
      setSentenceIdx(nextIdx)
      setTypedValue('')
      setStatus('idle')
      setShowAltHint(false)
      if (nextIdx % examples.length === 0) {
        recordQuizRun({
          modeName: `Grammar: ${detail.displayTitle} (${detail.level})`,
          score: sessionScore + 20,
          accuracy: 100,
          xpEarned: 20,
          streak: examples.length,
        })
        toast.success(`Completed all sentences for ${detail.displayTitle}! 🎉`)
      }
      setTimeout(() => inputRef.current?.focus(), 40)
      return
    }

    const cleanInput = convertRomajiToKana(typedValue.trim(), {
      finalizeTrailingN: true,
    })
    const expected = currentEx.clozeAnswer.trim()

    if (!cleanInput) {
      // Reveal answer if user clicks check on empty input
      setTypedValue(expected)
      setStatus('wrong')
      speakJapanese(currentEx.plainJapanese)
      addWeakPoint({
        id: `grammar-${item.grammar}-${sentenceIdx}`,
        type: 'grammar',
        front: currentEx.plainJapanese,
        reading: expected,
        meaning: `${detail.displayTitle}: ${detail.meaning}`,
        notes: whyExplanation?.reason,
      })
      toast.info(`Answer revealed: ${expected}. Saved to Weak Points for review!`)
      return
    }

    setTypedValue(cleanInput)

    if (
      isAnswerMatching(cleanInput, expected, [
        detail.displayTitle,
        ...(detail.reading ? [detail.reading] : []),
      ])
    ) {
      setStatus('correct')
      setSessionScore((s) => s + 20)
      speakJapanese(currentEx.plainJapanese)
      const stats = loadUserStats()
      saveUserStats({ xp: stats.xp + 10 })
      toast.success(`Spot on! "${expected}" is correct 🎯`)
    } else {
      setStatus('wrong')
      speakJapanese(currentEx.plainJapanese)
      addWeakPoint({
        id: `grammar-${item.grammar}-${sentenceIdx}`,
        type: 'grammar',
        front: currentEx.plainJapanese,
        reading: expected,
        meaning: `${detail.displayTitle}: ${detail.meaning}`,
        notes: whyExplanation?.reason,
      })
      toast.error(`Not quite! Expected "${expected}". Saved to your Weak Points list.`)
    }
  }

  function handleToggleMastered() {
    const next = !isMastered
    setIsMastered(next)
    try {
      const raw = localStorage.getItem(MASTERED_GRAMMAR_KEY)
      const list: string[] = raw ? JSON.parse(raw) : []
      const updated = next
        ? Array.from(new Set([...list, item.grammar]))
        : list.filter((g) => g !== item.grammar)
      localStorage.setItem(MASTERED_GRAMMAR_KEY, JSON.stringify(updated))
      if (next) {
        const stats = loadUserStats()
        saveUserStats({
          xp: stats.xp + 25,
          grammarCount: Math.max(stats.grammarCount, updated.length),
        })
        toast.success(`Marked "${detail.displayTitle}" as Mastered! ✓`)
      }
    } catch {
      // ignore
    }
  }

  function handleAddToAnkiDeck() {
    const res = addCustomSRSCard({
      front: detail.displayTitle,
      reading: detail.reading || detail.displayTitle,
      meaning: detail.meaning,
      category: 'grammar',
      jlptLevel: detail.level,
      exampleSentence: currentEx
        ? `${currentEx.plainJapanese} — ${currentEx.plainEnglish}`
        : undefined,
    })
    if (res.added) {
      toast.success(`Added "${detail.displayTitle}" to your Anki Deck!`)
    } else {
      toast.info(`"${detail.displayTitle}" is already in your Anki Deck.`)
    }
  }

  function handleJumpToRelation(rel: GrammarRelationCard) {
    const cleanRel = rel.grammar.replace(/^〜/, '')
    const found =
      allGrammar.find((g) => g.grammar === rel.grammar) ||
      allGrammar.find((g) => g.grammar.split(' ')[0] === rel.grammar) ||
      allGrammar.find((g) => g.grammar.includes(cleanRel))

    if (found) {
      onSelectGrammar(found)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      onSelectGrammar({
        grammar: rel.grammar,
        meaning: rel.meaning,
        level: rel.level,
        lesson: `${rel.level} Grammar`,
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const promptParts = currentEx
    ? currentEx.clozePrompt.split('____')
    : ['', '']

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 text-muted-foreground hover:text-foreground font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Grammar Library
          </Button>

          {historyTrail.length > 1 && (
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
              {historyTrail.slice(-3).map((h, i) => (
                <React.Fragment key={`${h.grammar}-${i}`}>
                  {i > 0 && <span>/</span>}
                  <button
                    type="button"
                    onClick={() => onSelectGrammar(h)}
                    className={`px-1.5 py-0.5 rounded ${
                      h.grammar === item.grammar
                        ? 'text-foreground font-bold'
                        : 'hover:text-foreground'
                    }`}
                  >
                    {h.grammar.split(' ')[0]}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Toggle: [ 📖 Lesson & Detailed Guide ] | [ ⚡ Practice Quiz ] */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border bg-muted p-1">
            <button
              type="button"
              onClick={() => setActiveTab('study')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'study'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Lesson &amp; Guide
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'quiz'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Practice Quiz ({examples.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {item.track === 'core' && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold">
                Core
              </Badge>
            )}
            <Badge variant="secondary" className="font-bold">{detail.level}</Badge>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: DETAILED LESSON & GUIDE VIEW (Default on card click) */}
      {/* ========================================================== */}
      {activeTab === 'study' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Banner with Key Title, Pronunciation, Meaning, & Action Row */}
          <Card className="border-primary/30 bg-card/80 shadow-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-amber-500 to-primary/60" />
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-2">
                      <span>{detail.displayTitle}</span>
                      <button
                        type="button"
                        onClick={() => speakJapanese(detail.displayTitle.split(' ')[0])}
                        className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        title="Listen to pronunciation"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </h1>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {detail.metadata.partOfSpeech}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {detail.metadata.register}
                    </Badge>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                    {detail.meaning}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detail.lesson}
                  </p>
                </div>

                {/* Primary CTA Buttons */}
                <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="font-bold gap-1.5 shadow-sm"
                    onClick={() => setActiveTab('quiz')}
                  >
                    <Zap className="h-4 w-4 fill-current" />
                    Start Practice Quiz ({examples.length})
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      onClick={handleAddToAnkiDeck}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Add to Deck
                    </Button>
                    <Button
                      size="sm"
                      variant={isMastered ? 'default' : 'outline'}
                      className="gap-1 text-xs"
                      onClick={handleToggleMastered}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {isMastered ? 'Mastered ✓' : 'Mark Mastered'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Grammar Formation & Structure Blocks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Grammar Structure &amp; Formation
              </CardTitle>
              <CardDescription className="text-xs">
                How to attach and connect this grammar point in natural Japanese.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {detail.structures.map((st, i) => (
                  <div
                    key={i}
                    className="rounded-xl border bg-muted/30 px-4 py-3 font-mono font-bold text-sm text-foreground flex items-center gap-2"
                  >
                    <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-[10px] font-sans flex items-center justify-center font-extrabold">
                      {i + 1}
                    </span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deep Explanation & Why / When to Use It */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Explanation &amp; Function
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
                {detail.aboutParagraphs.map((p, idx) => (
                  <p key={idx} className="text-foreground/90 font-medium">
                    {p}
                  </p>
                ))}
              </div>

              {/* Nuance & Common Pitfall Alert Callout */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-600 dark:text-amber-400">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                  Key Nuance &amp; Comparison Note
                </div>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pl-6">
                  {detail.cautionBanner}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Authentic Example Sentences with Audio & Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary" />
                    Curated Example Sentences ({examples.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tap any sentence to hear authentic native pronunciation.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Audio Enabled
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {examples.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  onClick={() => speakJapanese(ex.plainJapanese)}
                  className="group rounded-xl border bg-card hover:bg-muted/40 p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-primary/50"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <div
                        className="text-base sm:text-lg font-bold text-foreground [&_rt]:text-[10px] [&_rt]:text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: ex.japaneseHtml || ex.plainJapanese }}
                      />
                    </div>
                    <p
                      className="text-xs sm:text-sm text-muted-foreground pl-6"
                      dangerouslySetInnerHTML={{ __html: ex.englishHtml || ex.plainEnglish }}
                    />
                    {ex.registerNote && (
                      <p className="text-[11px] text-muted-foreground/80 pl-6 italic">
                        💡 {ex.registerNote}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      speakJapanese(ex.plainJapanese)
                    }}
                    className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shrink-0 self-end sm:self-center"
                    title="Play sound"
                  >
                    <Play className="h-4 w-4 ml-0.5 fill-current" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Similar & Confusing Grammar (Synonyms / Antonyms) */}
          {(detail.synonyms.length > 0 || detail.antonyms.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-primary" />
                  Compare: Similar &amp; Contrast Grammar
                </CardTitle>
                <CardDescription className="text-xs">
                  Avoid common JLPT traps by comparing how similar particles and structures differ.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...detail.synonyms, ...detail.antonyms].map((rel, idx) => (
                  <div
                    key={`${rel.grammar}-${idx}`}
                    onClick={() => handleJumpToRelation(rel)}
                    className="rounded-xl border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 p-4 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-primary group-hover:underline">
                        {rel.grammar}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {rel.level}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-foreground">{rel.meaning}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {rel.comparisonText}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bottom Action Footer */}
          <div className="rounded-2xl border bg-primary/5 border-primary/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base">Ready to test your understanding?</h3>
              <p className="text-xs text-muted-foreground">
                Practice fill-in-the-blank sentences for {detail.displayTitle} with instant answer feedback!
              </p>
            </div>
            <Button
              size="lg"
              className="font-bold gap-2 shrink-0"
              onClick={() => {
                setActiveTab('quiz')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <Zap className="h-4 w-4 fill-current" />
              Start Practice Quiz &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: INTERACTIVE PRACTICE QUIZ (Cloze review with why)   */}
      {/* ========================================================== */}
      {activeTab === 'quiz' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Review Stage Card */}
          <div className="rounded-2xl border bg-card px-6 py-12 sm:py-16 flex flex-col items-center justify-between min-h-[380px] shadow-sm relative">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 w-full max-w-xl">
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground pb-2">
                <span className="font-bold uppercase tracking-wide">
                  Sentence {(sentenceIdx % examples.length) + 1} of {examples.length}
                </span>
                <span className="font-medium">{detail.metadata.register}</span>
              </div>

              {/* Sentence with Inline Underline Blank */}
              <div className="text-3xl sm:text-4xl font-medium tracking-wide flex flex-wrap items-baseline justify-center gap-1 leading-relaxed py-4">
                <span>{promptParts[0]}</span>
                <span className="relative inline-flex items-baseline justify-center min-w-[110px] border-b-2 border-foreground/70 px-3 pb-0.5 mx-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedValue}
                    onChange={(e) => {
                      setTypedValue(convertRomajiToKana(e.target.value))
                      if (status !== 'idle') setStatus('idle')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSubmitOrNext()
                      }
                    }}
                    placeholder={showAltHint ? currentEx?.clozeAnswer : ''}
                    className={`w-28 sm:w-36 bg-transparent text-center focus:outline-none font-bold ${
                      status === 'correct'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : status === 'wrong'
                          ? 'text-destructive'
                          : 'text-foreground'
                    }`}
                  />
                </span>
                <span>{promptParts[1]}</span>
              </div>

              {/* English Translation */}
              <div
                className="text-base sm:text-lg text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: currentEx?.englishHtml || currentEx?.plainEnglish || '',
                }}
              />
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-md space-y-3 pt-8">
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="flex items-center justify-center gap-1.5 rounded-lg border bg-background hover:bg-muted/60 py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Undo
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('study')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border bg-background hover:bg-muted/60 py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Read Guide
                </button>

                <button
                  type="button"
                  onClick={() => setShowAltHint((v) => !v)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border bg-background hover:bg-muted/60 py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  {showAltHint ? currentEx?.clozeAnswer : 'Hint'}
                </button>
              </div>

              {/* Action Bar: Audio | Action Text | Submit Arrow */}
              <div className="flex items-center justify-between rounded-xl border border-primary/50 bg-background px-4 py-3 shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    currentEx && speakJapanese(currentEx.plainJapanese)
                  }
                  className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-85 transition-opacity"
                  title="Listen to sentence"
                >
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOrNext}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {status === 'correct'
                    ? 'Next Challenge →'
                    : status === 'wrong'
                      ? `Answer: ${currentEx?.clozeAnswer} (Next →)`
                      : 'Check / Press Enter'}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOrNext}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Submit / Next sentence"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* THE "WHY IS THIS THE ANSWER?" AUTO-FEEDBACK CARD          */}
          {/* (Shown automatically whenever user answers or reveals!)    */}
          {/* ========================================================== */}
          {status !== 'idle' && whyExplanation && currentEx && (
            <Card className={`border-2 animate-in fade-in duration-200 ${
              status === 'correct'
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-destructive/40 bg-destructive/5'
            }`}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {status === 'correct' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    <CardTitle className="text-base font-extrabold">
                      {whyExplanation.headline} — Grammatical Rationale
                    </CardTitle>
                  </div>
                  <Badge variant={status === 'correct' ? 'default' : 'destructive'} className="text-xs">
                    {status === 'correct' ? 'Correct ✓' : 'Answer Revealed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3.5 text-xs sm:text-sm">
                {/* 1. Clear Reason Why it has to be this answer */}
                <div className="space-y-1">
                  <span className="font-bold text-foreground uppercase tracking-wide text-[11px]">
                    Why {currentEx.clozeAnswer} is used here:
                  </span>
                  <p className="text-foreground/90 font-medium leading-relaxed">
                    {whyExplanation.reason}
                  </p>
                </div>

                {/* 2. Formation Pattern Rule */}
                <div className="rounded-lg border bg-background/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-muted-foreground text-xs">
                    Pattern Rule:
                  </span>
                  <span className="font-mono font-bold text-primary text-xs sm:text-sm">
                    {whyExplanation.rule}
                  </span>
                </div>

                {/* 3. Nuance & Particle Comparison */}
                <div className="flex items-start gap-2 text-muted-foreground leading-relaxed border-t pt-2.5">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground">Nuance Insight: </span>
                    <span>{whyExplanation.nuance}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1"
                    onClick={() => setActiveTab('study')}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Review Full Grammar Guide
                  </Button>
                  <Button
                    size="sm"
                    className="font-bold gap-1 text-xs"
                    onClick={handleSubmitOrNext}
                  >
                    Next Question <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
