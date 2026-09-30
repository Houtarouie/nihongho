'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Undo2,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Play,
  ListFilter,
  CheckCheck,
  Layers,
  Volume2,
  ExternalLink,
} from 'lucide-react'
import {
  getGrammarPointDetail,
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
import { toast } from 'sonner'

interface GrammarPointInspectorProps {
  item: GrammarPointSummary
  allGrammar: GrammarPointSummary[]
  onSelectGrammar: (target: GrammarPointSummary) => void
  onBack: () => void
  historyTrail: GrammarPointSummary[]
}

const MASTERED_GRAMMAR_KEY = 'nihongo_mastered_grammar_v1'

export function GrammarPointInspector({
  item,
  allGrammar,
  onSelectGrammar,
  onBack,
  historyTrail,
}: GrammarPointInspectorProps) {
  const detail = getGrammarPointDetail(item)

  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [typedValue, setTypedValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showInfo, setShowInfo] = useState(false)
  const [showAltHint, setShowAltHint] = useState(false)
  const [isMastered, setIsMastered] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const examples = detail.allExamples
  const currentEx = examples[sentenceIdx % examples.length]

  useEffect(() => {
    setSentenceIdx(0)
    setTypedValue('')
    setStatus('idle')
    setShowInfo(false)
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
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [item.grammar])

  function handleUndo() {
    setTypedValue('')
    setStatus('idle')
    setShowAltHint(false)
    setTimeout(() => inputRef.current?.focus(), 40)
  }

  function handleSubmitOrNext() {
    if (!currentEx) return

    // If already answered, advance to next sentence
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
        toast.success(`Completed all sentences for ${detail.displayTitle}!`)
      }
      setTimeout(() => inputRef.current?.focus(), 40)
      return
    }

    const cleanInput = typedValue.trim()
    const expected = currentEx.clozeAnswer.trim()

    if (!cleanInput) {
      // Reveal answer if user clicks -> on empty input
      setTypedValue(expected)
      setStatus('correct')
      speakJapanese(currentEx.plainJapanese)
      return
    }

    if (cleanInput === expected || cleanInput === detail.displayTitle) {
      setStatus('correct')
      setSessionScore((s) => s + 20)
      speakJapanese(currentEx.plainJapanese)
      const stats = loadUserStats()
      saveUserStats({ xp: stats.xp + 10 })
    } else {
      setStatus('wrong')
      speakJapanese(currentEx.plainJapanese)
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
        toast.success(`Marked "${detail.displayTitle}" as Mastered!`)
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
  const altLabel =
    detail.synonyms[0]?.grammar || `${detail.displayTitle}が`

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Minimal Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Grammar Library
        </Button>

        {historyTrail.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            {historyTrail.slice(-3).map((h, i) => (
              <React.Fragment key={`${h.grammar}-${i}`}>
                {i > 0 && <span>/</span>}
                <button
                  type="button"
                  onClick={() => onSelectGrammar(h)}
                  className={`px-1.5 py-0.5 rounded ${
                    h.grammar === item.grammar
                      ? 'text-foreground font-semibold'
                      : 'hover:text-foreground'
                  }`}
                >
                  {h.grammar.split(' ')[0]}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {(sentenceIdx % examples.length) + 1} / {examples.length}
          </span>
          <Badge variant="secondary">{detail.level}</Badge>
        </div>
      </div>

      {/* ULTRA-CLEAN MINIMALIST REVIEW STAGE (Matches Screenshot 1 & 2) */}
      <div className="rounded-2xl border bg-card/60 px-6 py-14 sm:py-20 flex flex-col items-center justify-between min-h-[420px] shadow-sm">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 w-full max-w-xl">
          {/* Register Label above sentence (e.g. Standard / Polite / Casual) */}
          <span className="text-sm sm:text-base font-medium text-muted-foreground">
            {detail.metadata.register}
          </span>

          {/* Sentence with Inline Underline Blank */}
          <div className="text-3xl sm:text-4xl font-medium tracking-wide flex flex-wrap items-baseline justify-center gap-1 leading-relaxed">
            <span>{promptParts[0]}</span>
            <span className="relative inline-flex items-baseline justify-center min-w-[110px] border-b-2 border-foreground/70 px-3 pb-0.5 mx-1">
              <input
                ref={inputRef}
                type="text"
                value={typedValue}
                onChange={(e) => {
                  setTypedValue(e.target.value)
                  if (status !== 'idle') setStatus('idle')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmitOrNext()
                  }
                }}
                placeholder={showAltHint ? currentEx.clozeAnswer : ''}
                className={`w-28 sm:w-36 bg-transparent text-center focus:outline-none font-medium ${
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

          {/* English Translation with highlighted target meaning */}
          <div
            className="text-base sm:text-lg text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: currentEx?.englishHtml || '',
            }}
          />
        </div>

        {/* Bottom Control Cluster: [Undo] [Show Info] [No Alts.] + Rounded Action Bar */}
        <div className="w-full max-w-md space-y-3 pt-12">
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
              onClick={() => setShowInfo((v) => !v)}
              className="flex items-center justify-center gap-1.5 rounded-lg border bg-background hover:bg-muted/60 py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showInfo ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
              {showInfo ? 'Hide Info' : 'Show Info'}
            </button>

            <button
              type="button"
              onClick={() => setShowAltHint((v) => !v)}
              className="flex items-center justify-center gap-1.5 rounded-lg border bg-background hover:bg-muted/60 py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ListFilter className="h-3.5 w-3.5" />
              {showAltHint ? detail.displayTitle : 'No Alts.'}
            </button>
          </div>

          {/* Wide Rounded Bottom Bar: [Play] | Center Text | [Next Arrow] */}
          <div className="flex items-center justify-between rounded-xl border border-primary/50 bg-background px-4 py-3 shadow-sm">
            <button
              type="button"
              onClick={() =>
                currentEx && speakJapanese(currentEx.plainJapanese)
              }
              className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-85 transition-opacity"
              title="Listen to sentence"
            >
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            </button>

            <button
              type="button"
              onClick={handleSubmitOrNext}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {status === 'correct'
                ? altLabel
                : status === 'wrong'
                  ? `Answer: ${currentEx?.clozeAnswer}`
                  : detail.displayTitle}
            </button>

            <button
              type="button"
              onClick={handleSubmitOrNext}
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Submit / Next sentence"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE GRAMMAR INFO DRAWER (Only shown when "Show Info" is clicked) */}
      {showInfo && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Structure & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Structure
                </p>
                <div className="space-y-1 text-sm font-semibold">
                  {detail.structures.map((st, i) => (
                    <div key={i}>{st}</div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Details
                </p>
                <div className="text-xs space-y-1">
                  <p>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    <strong>{detail.metadata.partOfSpeech}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Register:</span>{' '}
                    <strong>{detail.metadata.register}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-center gap-2">
                <Button
                  size="sm"
                  variant={isMastered ? 'default' : 'outline'}
                  onClick={handleToggleMastered}
                  className="w-full gap-1.5"
                >
                  <CheckCheck className="h-4 w-4" />
                  {isMastered ? 'Mastered ✓' : 'Mark as Mastered'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddToAnkiDeck}
                  className="w-full gap-1.5"
                >
                  <Layers className="h-4 w-4" />
                  Add to Anki Deck
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Explanation & Examples */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">
                  About {detail.displayTitle} — {detail.meaning}
                </h3>
                <button
                  type="button"
                  onClick={() => speakJapanese(detail.displayTitle)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium">
                Note: {detail.cautionBanner}
              </p>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                {detail.aboutParagraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              <div className="grid gap-2.5 pt-2">
                {detail.aboutExamples.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => speakJapanese(ex.plainJapanese)}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5 text-primary shrink-0 mr-3" />
                    <div className="flex-1 text-center">
                      <div
                        className="text-base font-medium [&_rt]:text-[10px] [&_rt]:text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: ex.japaneseHtml }}
                      />
                      <div
                        className="text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: ex.englishHtml }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Synonyms & Antonyms */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-base">
                Similar &amp; Opposite Grammar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...detail.synonyms, ...detail.antonyms].map((rel) => (
                  <div
                    key={rel.grammar}
                    onClick={() => handleJumpToRelation(rel)}
                    className="rounded-lg border bg-muted/20 hover:border-primary/50 p-3.5 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary">
                        {rel.grammar}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {rel.level}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs font-medium">{rel.meaning}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {rel.comparisonText}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
