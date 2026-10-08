'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  RotateCcw,
  Undo2,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getKanaStrokes } from '@/lib/kana/stroke-order'

interface Point {
  x: number
  y: number
}

interface KanaDrawingPadProps {
  kana: string
  romaji?: string
  size?: number
  onComplete?: (success: boolean) => void
  className?: string
}

export function KanaDrawingPad({
  kana,
  romaji,
  size = 280,
  onComplete,
  className = '',
}: KanaDrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [showGuide, setShowGuide] = useState(true)
  const [showOverlayCheck, setShowOverlayCheck] = useState(false)
  const [hasEvaluated, setHasEvaluated] = useState(false)

  const strokeData = getKanaStrokes(kana)
  const targetStrokes = strokeData?.strokeCount ?? 1

  // Redraw canvas whenever strokes change or canvas size changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = size
    const height = size

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Draw Japanese calligraphy brush strokes
    ctx.lineWidth = Math.max(5, size / 32)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#38bdf8' // Vibrant sky blue calligraphy ink

    const allCompletedStrokes = [...strokes]
    if (currentStroke.length > 0) {
      allCompletedStrokes.push(currentStroke)
    }

    for (const stroke of allCompletedStrokes) {
      if (stroke.length === 0) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)

      if (stroke.length === 1) {
        ctx.arc(stroke[0].x, stroke[0].y, ctx.lineWidth / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        for (let i = 1; i < stroke.length; i++) {
          // Midpoint quadratic curve for smoother handwriting
          const p1 = stroke[i - 1]
          const p2 = stroke[i]
          const midX = (p1.x + p2.x) / 2
          const midY = (p1.y + p2.y) / 2
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY)
        }
        ctx.stroke()
      }
    }
  }, [strokes, currentStroke, size])

  // Setup canvas high-DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1

    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    redrawCanvas()
  }, [size, redrawCanvas])

  // Reset pad when character changes
  useEffect(() => {
    setStrokes([])
    setCurrentStroke([])
    setShowOverlayCheck(false)
    setHasEvaluated(false)
  }, [kana])

  // Pointer event handlers
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    const pt = getCoordinates(e)
    setCurrentStroke([pt])
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const pt = getCoordinates(e)
    setCurrentStroke((prev) => [...prev, pt])
    redrawCanvas()
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke])
      setCurrentStroke([])
    }
  }

  const handlePointerCancel = () => {
    setIsDrawing(false)
    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke])
      setCurrentStroke([])
    }
  }

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1))
    setShowOverlayCheck(false)
    setHasEvaluated(false)
  }

  const handleClear = () => {
    setStrokes([])
    setCurrentStroke([])
    setShowOverlayCheck(false)
    setHasEvaluated(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, size, size)
    }
  }

  const handleCheck = () => {
    setShowOverlayCheck(true)
  }

  const handleEvaluation = (correct: boolean) => {
    setHasEvaluated(true)
    if (onComplete) {
      onComplete(correct)
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Drawing Board Container */}
      <div
        className="relative rounded-3xl border-2 border-border/80 bg-background/95 shadow-lg overflow-hidden select-none touch-none"
        style={{ width: size, height: size }}
      >
        {/* Practice Grid Lines (田-grid) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          {/* Outer Border Inset */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted-foreground/20"
          />
          {/* Horizontal Center */}
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="2,3"
            className="text-muted-foreground/35"
          />
          {/* Vertical Center */}
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="2,3"
            className="text-muted-foreground/35"
          />
        </svg>

        {/* Ghost Guide Template (Underneath Canvas) */}
        {showGuide && strokeData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <svg
              viewBox="0 0 109 109"
              className="w-[85%] h-[85%]"
              xmlns="http://www.w3.org/2000/svg"
            >
              {strokeData.strokes.map((d, idx) => (
                <path
                  key={`guide-${idx}`}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                />
              ))}
            </svg>
          </div>
        )}

        {/* HTML5 Canvas for User Handwriting */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="absolute inset-0 cursor-crosshair touch-none"
        />

        {/* Overlay Comparison When Checking */}
        {showOverlayCheck && strokeData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in-50 duration-200">
            <svg
              viewBox="0 0 109 109"
              className="w-[85%] h-[85%]"
              xmlns="http://www.w3.org/2000/svg"
            >
              {strokeData.strokes.map((d, idx) => (
                <path
                  key={`overlay-${idx}`}
                  d={d}
                  fill="none"
                  stroke="#10b981" // Emerald green reference
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-80"
                />
              ))}
            </svg>
            <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              Green = Canonical shape
            </div>
          </div>
        )}

        {/* Stroke Count Badge in Top Left */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <Badge
            variant="outline"
            className={`text-[10px] font-mono px-2 py-0 bg-background/90 backdrop-blur-xs ${
              strokes.length === targetStrokes
                ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground'
            }`}
          >
            Strokes: {strokes.length} / {targetStrokes}
          </Badge>
        </div>

        {/* Character Title in Bottom Right */}
        <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-1">
          <span className="font-japanese font-bold text-sm text-muted-foreground/60">
            {kana}
          </span>
          {romaji && (
            <span className="text-[10px] font-mono text-muted-foreground/40">
              ({romaji})
            </span>
          )}
        </div>
      </div>

      {/* Interactive Tool Bar (Undo, Clear, Guide Toggle) */}
      <div className="flex items-center gap-2 justify-center w-full">
        <Button
          size="sm"
          variant="outline"
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className="h-8 px-2.5 rounded-xl text-xs gap-1"
          title="Undo last stroke"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleClear}
          disabled={strokes.length === 0}
          className="h-8 px-2.5 rounded-xl text-xs gap-1"
          title="Clear canvas"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowGuide(!showGuide)}
          className="h-8 px-2.5 rounded-xl text-xs gap-1 text-muted-foreground hover:text-foreground"
          title={showGuide ? 'Hide ghost outline' : 'Show ghost outline'}
        >
          {showGuide ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </Button>
      </div>

      {/* Check & Self Evaluation */}
      <div className="w-full max-w-xs pt-1">
        {!showOverlayCheck ? (
          <Button
            size="sm"
            onClick={handleCheck}
            disabled={strokes.length === 0}
            className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Check My Writing
          </Button>
        ) : !hasEvaluated ? (
          <div className="space-y-2 p-2.5 rounded-2xl bg-muted/30 border animate-in fade-in-50 duration-150">
            <p className="text-center text-xs text-muted-foreground">
              How does your handwriting look compared to the model?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEvaluation(false)}
                className="flex-1 h-8 text-xs rounded-xl"
              >
                Needs Practice
              </Button>
              <Button
                size="sm"
                onClick={() => handleEvaluation(true)}
                className="flex-1 h-8 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Looks Great!
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-2 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Character writing recorded!
          </div>
        )}
      </div>
    </div>
  )
}
