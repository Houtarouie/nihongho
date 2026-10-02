'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Volume2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
  Plus,
  ArrowRight,
  Headphones,
  Keyboard,
  Check,
} from 'lucide-react'
import { useProgress } from '@/lib/progress'
import type { KanaItem } from '@/data/kana'
import {
  buildSmartDistractors,
  cleanRomaji,
  CONFUSION_MNEMONICS,
} from '@/data/quiz-engine'
import { speakJapanese, type SRSCard } from '@/data/srs-deck'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export type QuizMode = 'kana-to-romaji' | 'romaji-to-kana' | 'listening' | 'typing'

interface KanaQuizModalProps {
  isOpen: boolean
  onClose: () => void
  items: KanaItem[]
  title?: string
  initialMode?: QuizMode
}

export function KanaQuizModal({
  isOpen,
  onClose,
  items,
  title = 'Kana Quiz',
  initialMode = 'kana-to-romaji',
}: KanaQuizModalProps) {
  const { addWeakPoint, upsertCards, stats } = useProgress()

  const [mode, setMode] = useState<QuizMode>(initialMode)
  const [questions, setQuestions] = useState<KanaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [missedItems, setMissedItems] = useState<KanaItem[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [savedToWeak, setSavedToWeak] = useState(false)

  // Shuffle and set questions when modal opens or items change
  useEffect(() => {
    if (!isOpen || items.length === 0) return
    const shuffled = [...items].sort(() => Math.random() - 0.5)
    setQuestions(shuffled)
    setCurrentIndex(0)
    setSelectedOption(null)
    setTypedAnswer('')
    setIsAnswered(false)
    setIsCorrect(false)
    setScore(0)
    setMissedItems([])
    setIsFinished(false)
    setSavedToWeak(false)
  }, [isOpen, items])

  const currentItem = questions[currentIndex]

  // Play audio for listening mode or when question loads
  useEffect(() => {
    if (!isOpen || !currentItem) return
    if (mode === 'listening') {
      speakJapanese(currentItem.kana, { rate: stats.audioSpeed || 1.0 })
    }
  }, [isOpen, currentItem, mode, stats.audioSpeed])

  // Smart options with lookalikes
  const options = useMemo(() => {
    if (!currentItem || questions.length === 0) return []
    const distractorMode = mode === 'kana-to-romaji' ? 'kana-to-romaji' : 'romaji-to-kana'
    return buildSmartDistractors(currentItem, items, distractorMode)
  }, [currentItem, items, mode, questions])

  const handleSelectOption = useCallback(
    async (option: string) => {
      if (isAnswered || !currentItem) return

      setSelectedOption(option)
      setIsAnswered(true)

      const correctAnswer =
        mode === 'kana-to-romaji' ? cleanRomaji(currentItem.romaji) : currentItem.kana
      const correct = option.toLowerCase() === correctAnswer.toLowerCase()
      setIsCorrect(correct)

      if (correct) {
        setScore((prev) => prev + 1)
      } else {
        setMissedItems((prev) => [...prev, currentItem])
        // Automatically register to weak points
        await addWeakPoint({
          id: `kana-${currentItem.kana}`,
          type: 'kana',
          front: currentItem.kana,
          reading: currentItem.romaji,
          meaning: `Sound: ${currentItem.romaji} (e.g. ${currentItem.example})`,
          notes: CONFUSION_MNEMONICS[currentItem.kana] || currentItem.example,
        })
      }
    },
    [isAnswered, currentItem, mode, addWeakPoint]
  )

  const handleCheckTyping = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (isAnswered || !currentItem || !typedAnswer.trim()) return

      setIsAnswered(true)
      const expected = cleanRomaji(currentItem.romaji)
      const given = typedAnswer.trim().toLowerCase()
      const correct = given === expected

      setIsCorrect(correct)
      if (correct) {
        setScore((prev) => prev + 1)
      } else {
        setMissedItems((prev) => [...prev, currentItem])
        await addWeakPoint({
          id: `kana-${currentItem.kana}`,
          type: 'kana',
          front: currentItem.kana,
          reading: currentItem.romaji,
          meaning: `Sound: ${currentItem.romaji} (e.g. ${currentItem.example})`,
          notes: CONFUSION_MNEMONICS[currentItem.kana] || currentItem.example,
        })
      }
    },
    [isAnswered, currentItem, typedAnswer, addWeakPoint]
  )

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setIsFinished(true)
    } else {
      setCurrentIndex((prev) => prev + 1)
      setSelectedOption(null)
      setTypedAnswer('')
      setIsAnswered(false)
      setIsCorrect(false)
      setSavedToWeak(false)
    }
  }, [currentIndex, questions.length])

  // Save explicitly to weak spots if user clicks button
  async function handleManualSaveWeak() {
    if (!currentItem) return
    await addWeakPoint({
      id: `kana-${currentItem.kana}`,
      type: 'kana',
      front: currentItem.kana,
      reading: currentItem.romaji,
      meaning: `Sound: ${currentItem.romaji} (e.g. ${currentItem.example})`,
      notes: CONFUSION_MNEMONICS[currentItem.kana] || currentItem.example,
    })
    setSavedToWeak(true)
    toast.success(`Saved ${currentItem.kana} to Weak Spots`)
  }

  // Add all missed items into daily SRS deck
  async function handleAddMissedToSRS() {
    if (missedItems.length === 0) return
    const newCards: SRSCard[] = missedItems.map((m) => ({
      id: `kana-${m.kana}`,
      front: m.kana,
      reading: m.romaji,
      meaning: `Kana character for "${m.romaji}"`,
      category: 'kana',
      jlptLevel: 'N5',
      exampleSentence: m.example,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      dueDate: Date.now(),
      status: 'new',
      queue: 'active',
      lapses: 1,
    }))

    const res = await upsertCards(newCards)
    toast.success(`Added ${res.addedCount} kana to your Daily SRS Review Queue!`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <Card className="w-full max-w-lg rounded-3xl border-2 shadow-2xl overflow-hidden bg-card">
        {/* Header */}
        <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-bold">{title}</CardTitle>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close quiz"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Selector */}
          {!isFinished && (
            <div className="flex items-center gap-1 mt-3 bg-muted/60 p-1 rounded-xl text-xs overflow-x-auto">
              <button
                onClick={() => setMode('kana-to-romaji')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  mode === 'kana-to-romaji'
                    ? 'bg-background text-primary font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Kana &rarr; Sound
              </button>
              <button
                onClick={() => setMode('romaji-to-kana')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  mode === 'romaji-to-kana'
                    ? 'bg-background text-primary font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sound &rarr; Kana
              </button>
              <button
                onClick={() => setMode('listening')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  mode === 'listening'
                    ? 'bg-background text-primary font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Headphones className="h-3 w-3" />
                Listening
              </button>
              <button
                onClick={() => setMode('typing')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  mode === 'typing'
                    ? 'bg-background text-primary font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Keyboard className="h-3 w-3" />
                Typing
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {!isFinished && questions.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1 font-mono">
                <span>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span>Score: {score}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>

        {/* Content */}
        <CardContent className="p-5 sm:p-6">
          {isFinished ? (
            /* FINISHED SUMMARY SCREEN */
            <div className="text-center space-y-5 py-4">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-2xl">
                {score === questions.length ? '🏆' : score >= questions.length * 0.7 ? '🎉' : '💪'}
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">Quiz Finished!</h3>
                <p className="text-sm text-muted-foreground">
                  You scored <span className="font-bold text-foreground">{score}</span> out of{' '}
                  <span className="font-bold text-foreground">{questions.length}</span> (
                  {Math.round((score / questions.length) * 100)}%)
                </p>
              </div>

              {missedItems.length > 0 && (
                <div className="p-4 rounded-2xl border bg-muted/20 text-left space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Review these tricky characters:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {missedItems.map((m, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-background border flex items-center justify-between">
                        <span className="font-japanese font-bold text-lg">{m.kana}</span>
                        <span className="text-xs text-muted-foreground font-mono">{m.romaji}</span>
                        <button
                          onClick={() => speakJapanese(m.kana)}
                          className="p-1 text-muted-foreground hover:text-primary"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleAddMissedToSRS}
                    className="w-full text-xs font-semibold rounded-xl gap-2 mt-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Missed Items to Daily SRS Queue ({missedItems.length})
                  </Button>
                </div>
              )}

              <div className="flex gap-2 justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuestions([...items].sort(() => Math.random() - 0.5))
                    setCurrentIndex(0)
                    setSelectedOption(null)
                    setTypedAnswer('')
                    setIsAnswered(false)
                    setScore(0)
                    setMissedItems([])
                    setIsFinished(false)
                  }}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Try Again
                </Button>
                <Button onClick={onClose} className="rounded-xl text-xs">
                  Done
                </Button>
              </div>
            </div>
          ) : currentItem ? (
            /* ACTIVE QUESTION VIEW */
            <div className="space-y-6">
              {/* Question Prompt */}
              <div className="text-center py-4 space-y-2">
                {mode === 'listening' ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => speakJapanese(currentItem.kana, { rate: stats.audioSpeed || 1.0 })}
                      className="h-20 w-20 rounded-full bg-primary/10 hover:bg-primary/20 text-primary mx-auto flex items-center justify-center transition-transform hover:scale-105"
                      aria-label="Replay audio"
                    >
                      <Volume2 className="h-8 w-8" />
                    </button>
                    <p className="text-xs text-muted-foreground">Tap button to replay audio sound</p>
                  </div>
                ) : mode === 'romaji-to-kana' ? (
                  <div>
                    <span className="text-4xl sm:text-5xl font-mono font-bold text-foreground">
                      {currentItem.romaji}
                    </span>
                    <p className="text-xs text-muted-foreground mt-2">Which Kana represents this sound?</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-5xl sm:text-6xl font-bold font-japanese text-foreground">
                      {currentItem.kana}
                    </span>
                    <button
                      onClick={() => speakJapanese(currentItem.kana, { rate: stats.audioSpeed || 1.0 })}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-primary transition-colors"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Listen sound
                    </button>
                  </div>
                )}
              </div>

              {/* Multiple Choice Options */}
              {mode !== 'typing' ? (
                <div className="grid grid-cols-2 gap-3">
                  {options.map((opt) => {
                    const isPicked = selectedOption === opt
                    const correctAnswer =
                      mode === 'kana-to-romaji' ? cleanRomaji(currentItem.romaji) : currentItem.kana
                    const isThisCorrect = opt.toLowerCase() === correctAnswer.toLowerCase()

                    let buttonClass = 'border-border/80 hover:border-primary/50 hover:bg-muted/40'
                    if (isAnswered) {
                      if (isThisCorrect) {
                        buttonClass = 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                      } else if (isPicked) {
                        buttonClass = 'border-destructive bg-destructive/15 text-destructive font-bold'
                      } else {
                        buttonClass = 'opacity-40 border-transparent'
                      }
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        disabled={isAnswered}
                        className={`h-14 sm:h-16 rounded-2xl border-2 text-xl font-bold flex items-center justify-center transition-all ${
                          mode === 'romaji-to-kana' || mode === 'listening' ? 'font-japanese text-2xl' : 'font-mono'
                        } ${buttonClass}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              ) : (
                /* Typing Mode */
                <form onSubmit={handleCheckTyping} className="space-y-3">
                  <Input
                    placeholder="Type romaji reading (e.g. ka, shi)..."
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    disabled={isAnswered}
                    className="h-12 text-center text-lg font-mono rounded-xl"
                    autoFocus
                  />
                  {!isAnswered && (
                    <Button type="submit" className="w-full h-10 rounded-xl text-xs font-semibold">
                      Submit Answer
                    </Button>
                  )}
                </form>
              )}

              {/* Feedback Alert on Answer */}
              {isAnswered && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 animate-in fade-in-50 duration-150 ${
                    isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-destructive/10 border-destructive/30 text-destructive'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      <span>{isCorrect ? 'Correct! Well done.' : 'Incorrect'}</span>
                    </div>

                    {!isCorrect && (
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                        Logged in Weak Spots
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs">
                    <span className="font-japanese font-bold text-sm">{currentItem.kana}</span> is pronounced{' '}
                    <span className="font-mono font-bold">&quot;{currentItem.romaji}&quot;</span> ({currentItem.example}).
                  </p>

                  {CONFUSION_MNEMONICS[currentItem.kana] && (
                    <p className="text-xs opacity-90 pt-1 border-t border-current/20">
                      💡 <strong>Distinction Tip:</strong> {CONFUSION_MNEMONICS[currentItem.kana]}
                    </p>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    {!isCorrect && !savedToWeak && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleManualSaveWeak}
                        className="h-8 text-xs rounded-xl gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Save to Weak Spots
                      </Button>
                    )}

                    <Button size="sm" onClick={handleNext} className="h-8 text-xs rounded-xl gap-1 font-semibold">
                      Next Character
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
