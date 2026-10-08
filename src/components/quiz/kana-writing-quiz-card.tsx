'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Volume2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Undo,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'
import { getKanaStrokes } from '@/lib/kana/stroke-order'
import {
  evaluateUserStroke,
  type Point2D,
  type StrokeEvaluationResult,
} from '@/lib/kana/stroke-evaluator'
import { speakJapanese } from '@/data/srs-deck'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface KanaWritingQuizCardProps {
  kana: string
  romaji: string
  script?: 'hiragana' | 'katakana'
  onCorrect: () => void
  onSkip?: () => void
  autoAdvanceMs?: number
}

export function KanaWritingQuizCard({
  kana,
  romaji,
  script = 'hiragana',
  onCorrect,
  onSkip,
  autoAdvanceMs = 1200,
}: KanaWritingQuizCardProps) {
  const strokeData = getKanaStrokes(kana)
  const totalStrokes = strokeData?.strokeCount ?? 1

  // Quiz state
  const [completedStrokes, setCompletedStrokes] = useState<number>(0)
  const [showGhostGuide, setShowGhostGuide] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info'
    category?: 'wrong_order' | 'wrong_direction' | 'off_target' | 'too_short'
    message: string
  } | null>(null)
  const [isCharacterComplete, setIsCharacterComplete] = useState<boolean>(false)
  const [missCountOnCurrentStroke, setMissCountOnCurrentStroke] = useState<number>(0)
  const [isShaking, setIsShaking] = useState<boolean>(false)

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef<boolean>(false)
  const currentStrokePointsRef = useRef<Point2D[]>([])
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset when target kana changes
  useEffect(() => {
    setCompletedStrokes(0)
    setShowGhostGuide(false)
    setFeedback(null)
    setIsCharacterComplete(false)
    setMissCountOnCurrentStroke(0)
    setIsShaking(false)
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    // Clear live canvas
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [kana])

  // Trigger shake animation on mistake
  const triggerShake = useCallback(() => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
  }, [])

  // Clear live canvas overlay
  const clearLiveCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Drawing event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isCharacterComplete) return
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.setPointerCapture(e.pointerId)
    isDrawingRef.current = true

    const rect = canvas.getBoundingClientRect()
    const scale = rect.width / 109 // KanjiVG viewBox is 109x109
    const normX = (e.clientX - rect.left) / scale
    const normY = (e.clientY - rect.top) / scale

    currentStrokePointsRef.current = [{ x: normX, y: normY }]

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
      ctx.strokeStyle = '#0284c7' // Bright sky blue ink while drawing
      ctx.lineWidth = Math.max(4, rect.width * 0.04)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isCharacterComplete) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scale = rect.width / 109
    const normX = (e.clientX - rect.left) / scale
    const normY = (e.clientY - rect.top) / scale

    currentStrokePointsRef.current.push({ x: normX, y: normY })

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
      ctx.stroke()
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isCharacterComplete) return
    isDrawingRef.current = false
    const canvas = canvasRef.current
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    }

    const points = currentStrokePointsRef.current
    if (points.length < 2) {
      clearLiveCanvas()
      return
    }

    // Evaluate the drawn stroke against expected stroke
    const evalResult: StrokeEvaluationResult = evaluateUserStroke({
      kana,
      expectedStrokeIndex: completedStrokes,
      userPoints: points,
    })

    clearLiveCanvas()

    if (evalResult.isMatch) {
      // Correct stroke in correct order!
      const nextCount = completedStrokes + 1
      setCompletedStrokes(nextCount)
      setMissCountOnCurrentStroke(0)
      setFeedback({
        type: 'success',
        message:
          nextCount === totalStrokes
            ? `🎉 Perfect! You drew all ${totalStrokes} strokes in the correct order!`
            : `Stroke ${nextCount} correct!`,
      })

      if (nextCount === totalStrokes) {
        // Full character complete!
        setIsCharacterComplete(true)
        speakJapanese(kana)

        advanceTimerRef.current = setTimeout(() => {
          onCorrect()
        }, autoAdvanceMs)
      }
    } else {
      // Mistake: wrong stroke order, wrong direction, or off target
      triggerShake()
      const newMissCount = missCountOnCurrentStroke + 1
      setMissCountOnCurrentStroke(newMissCount)

      // If user missed 2 times on this stroke, automatically reveal faint ghost guide
      if (newMissCount >= 2 && !showGhostGuide) {
        setShowGhostGuide(true)
      }

      setFeedback({
        type: 'error',
        category: evalResult.feedbackType === 'correct' ? undefined : evalResult.feedbackType,
        message: evalResult.message,
      })
    }
  }

  const handleUndo = () => {
    if (isCharacterComplete) return
    clearLiveCanvas()
    setCompletedStrokes((prev) => Math.max(0, prev - 1))
    setFeedback(null)
  }

  const handleClear = () => {
    if (isCharacterComplete) return
    clearLiveCanvas()
    setCompletedStrokes(0)
    setFeedback(null)
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-sm mx-auto select-none">
      {/* Question Prompt Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-xs uppercase font-mono tracking-wider">
            {script}
          </Badge>
          <span className="text-xs text-muted-foreground">Stroke Order Quiz</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold tracking-tight">
          Draw <span className="font-mono text-primary font-extrabold">&ldquo;{romaji}&rdquo;</span> in {script === 'hiragana' ? 'Hiragana' : 'Katakana'}
        </h3>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <span>Strokes: {completedStrokes} / {totalStrokes} completed</span>
          <button
            onClick={() => speakJapanese(kana)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Pronounce character"
            type="button"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        </p>
      </div>

      {/* Drawing Canvas Box with Practice Grid */}
      <div
        className={`relative w-[260px] h-[260px] sm:w-[280px] sm:h-[280px] rounded-3xl border-2 transition-all overflow-hidden shadow-inner ${
          isCharacterComplete
            ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
            : isShaking
            ? 'border-destructive bg-destructive/5 animate-shake'
            : 'border-border/80 bg-background/95'
        }`}
      >
        {/* SVG Layer: 4-Quadrant Practice Grid (田-grid) */}
        <svg
          viewBox="0 0 109 109"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vertical & Horizontal Center Guidelines */}
          <line
            x1="54.5"
            y1="0"
            x2="54.5"
            y2="109"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="2,3"
            className="text-muted-foreground/30"
          />
          <line
            x1="0"
            y1="54.5"
            x2="109"
            y2="54.5"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="2,3"
            className="text-muted-foreground/30"
          />
          {/* Diagonal guidelines */}
          <line
            x1="0"
            y1="0"
            x2="109"
            y2="109"
            stroke="currentColor"
            strokeWidth="0.4"
            strokeDasharray="3,4"
            className="text-muted-foreground/15"
          />
          <line
            x1="109"
            y1="0"
            x2="0"
            y2="109"
            stroke="currentColor"
            strokeWidth="0.4"
            strokeDasharray="3,4"
            className="text-muted-foreground/15"
          />

          {/* Optional Ghost Outline Guide (if enabled or after 2 misses) */}
          {showGhostGuide && strokeData && (
            <g className="opacity-20 animate-in fade-in-50 duration-300">
              {strokeData.strokes.map((pathD, idx) => (
                <path
                  key={`ghost-${idx}`}
                  d={pathD}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                />
              ))}
            </g>
          )}

          {/* Snapped Canonical Strokes (Already completed in order) */}
          {strokeData && (
            <g>
              {strokeData.strokes.map((pathD, idx) => {
                if (idx >= completedStrokes) return null
                return (
                  <path
                    key={`completed-${idx}`}
                    d={pathD}
                    fill="none"
                    stroke={isCharacterComplete ? '#10b981' : 'currentColor'}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground transition-all duration-300 drop-shadow-xs"
                  />
                )
              })}
            </g>
          )}

          {/* Numbered Starting Point Guide for Next Stroke */}
          {strokeData && !isCharacterComplete && strokeData.numbers[completedStrokes] && (
            <g
              transform={`translate(${strokeData.numbers[completedStrokes].x}, ${strokeData.numbers[completedStrokes].y})`}
              className="animate-in fade-in zoom-in-75 duration-200"
            >
              <circle
                cx="0"
                cy="-2"
                r="5.5"
                className="fill-sky-500 text-white shadow-sm"
              />
              <circle
                cx="0"
                cy="-2"
                r="8"
                className="stroke-sky-400 stroke-[1.5] fill-none animate-ping opacity-60"
              />
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="6"
                fontWeight="bold"
                fill="#ffffff"
              >
                {completedStrokes + 1}
              </text>
            </g>
          )}
        </svg>

        {/* Live Canvas for Drawing */}
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />

        {/* Corner Completion Badge */}
        {isCharacterComplete && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-1.5 shadow-md animate-in zoom-in-50 duration-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          className={`w-full p-3 rounded-2xl border text-xs flex items-start gap-2 animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
              : feedback.category === 'wrong_order'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
              : feedback.category === 'wrong_direction'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold'
              : 'bg-destructive/10 border-destructive/30 text-destructive font-medium'
          }`}
        >
          {feedback.type === 'success' ? (
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          ) : feedback.category === 'wrong_order' ? (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          ) : feedback.category === 'wrong_direction' ? (
            <RotateCcw className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
          )}
          <span className="leading-relaxed">{feedback.message}</span>
        </div>
      )}

      {/* Auxiliary Controls (Undo, Clear, Peek Guide, Skip) */}
      <div className="flex items-center justify-between w-full pt-1 px-1">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUndo}
            disabled={completedStrokes === 0 || isCharacterComplete}
            className="h-8 px-2.5 rounded-xl text-xs gap-1"
            title="Undo last stroke"
          >
            <Undo className="h-3.5 w-3.5" />
            Undo
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleClear}
            disabled={completedStrokes === 0 || isCharacterComplete}
            className="h-8 px-2.5 rounded-xl text-xs gap-1"
            title="Clear canvas"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </Button>

          <Button
            size="sm"
            variant={showGhostGuide ? 'secondary' : 'ghost'}
            onClick={() => setShowGhostGuide((prev) => !prev)}
            disabled={isCharacterComplete}
            className="h-8 px-2.5 rounded-xl text-xs gap-1 text-muted-foreground hover:text-foreground"
            title="Toggle outline hint"
          >
            {showGhostGuide ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide Guide
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Peek Guide
              </>
            )}
          </Button>
        </div>

        {isCharacterComplete ? (
          <Button
            size="sm"
            onClick={onCorrect}
            className="h-8 px-4 rounded-xl text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : onSkip ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onSkip}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>
        ) : null}
      </div>

      {/* Stroke writing guidance note if available */}
      {strokeData?.tip && (
        <div className="w-full p-2.5 rounded-xl bg-muted/30 border text-[11px] text-muted-foreground text-left space-y-1">
          <div className="flex items-center gap-1 font-semibold text-foreground text-[11px]">
            <Lightbulb className="h-3 w-3 text-amber-500" />
            <span>Writing tip:</span>
          </div>
          <p className="leading-relaxed">{strokeData.tip}</p>
        </div>
      )}
    </div>
  )
}
