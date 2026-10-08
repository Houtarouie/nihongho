'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Sparkles,
  Gauge,
} from 'lucide-react'
import { getKanaStrokes } from '@/lib/kana/stroke-order'
import { speakJapanese } from '@/data/srs-deck'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface StrokeOrderGuideProps {
  kana: string
  romaji?: string
  size?: number // width/height in px
  showControls?: boolean
  autoPlay?: boolean
  className?: string
}

export function StrokeOrderGuide({
  kana,
  romaji,
  size = 220,
  showControls = true,
  autoPlay = false,
  className = '',
}: StrokeOrderGuideProps) {
  const strokeData = useMemo(() => getKanaStrokes(kana), [kana])
  const totalStrokes = strokeData?.strokeCount ?? 1

  // React state for UI indicators (badges, buttons, counters)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completedCount, setCompletedCount] = useState<number>(autoPlay ? 0 : totalStrokes)
  const [animatingStrokeIdx, setAnimatingStrokeIdx] = useState<number | null>(null)
  const [speed, setSpeed] = useState<number>(1) // 0.75, 1, 1.5

  // Stable references for high-performance 60fps animation
  const speedRef = useRef(speed)
  speedRef.current = speed

  const isPlayingRef = useRef(false)
  const pathRefs = useRef<(SVGPathElement | null)[]>([])
  const pathLengthsRef = useRef<number[]>([])
  const penRef = useRef<SVGGElement | null>(null)

  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Measure path lengths from DOM elements
  const measureLengths = useCallback(() => {
    if (!strokeData) return []
    const lengths: number[] = strokeData.strokes.map((_, idx) => {
      const el = pathRefs.current[idx]
      if (el) {
        try {
          const l = el.getTotalLength()
          if (l > 0) return l
        } catch {
          // ignore
        }
      }
      return 180
    })
    pathLengthsRef.current = lengths
    return lengths
  }, [strokeData])

  // Directly apply strokeDashoffset to DOM elements without fighting React virtual DOM
  const applyStrokeOffsets = useCallback(
    (count: number, activeIdx: number | null = null, activeOffset: number | null = null) => {
      if (!strokeData) return
      const lengths = pathLengthsRef.current.length > 0 ? pathLengthsRef.current : measureLengths()

      strokeData.strokes.forEach((_, idx) => {
        const el = pathRefs.current[idx]
        const len = lengths[idx] || 180
        if (!el) return

        el.style.strokeDasharray = `${len}`

        if (activeIdx !== null && idx === activeIdx) {
          // Currently animating stroke
          el.style.strokeDashoffset = activeOffset !== null ? `${activeOffset}` : `${len}`
          el.style.stroke = '#0284c7'
        } else if (idx < count) {
          // Fully completed stroke
          el.style.strokeDashoffset = '0'
          el.style.stroke = 'currentColor'
        } else {
          // Future stroke (hidden)
          el.style.strokeDashoffset = `${len}`
          el.style.stroke = 'currentColor'
        }
      })
    },
    [strokeData, measureLengths]
  )

  // Cancel any running animations cleanly
  const stopAnimation = useCallback(() => {
    isPlayingRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (penRef.current) {
      penRef.current.style.display = 'none'
    }
  }, [])

  // Start sequential playback of strokes from a specific index
  const startPlayback = useCallback(
    (fromIdx: number = 0) => {
      if (!strokeData || strokeData.strokes.length === 0) return
      stopAnimation()

      isPlayingRef.current = true
      setIsPlaying(true)

      const lengths = measureLengths()
      const currentIdx = Math.max(0, Math.min(totalStrokes - 1, fromIdx))

      setCompletedCount(currentIdx)
      setAnimatingStrokeIdx(currentIdx)
      applyStrokeOffsets(currentIdx, currentIdx, lengths[currentIdx])

      function animateSingleStroke(strokeIdx: number) {
        if (!isPlayingRef.current) return
        const el = pathRefs.current[strokeIdx]
        const length = lengths[strokeIdx] || 180
        const strokeDuration = 650 / speedRef.current
        const pauseMs = 180 / speedRef.current

        let startTime: number | null = null

        function frame(now: number) {
          if (!isPlayingRef.current) return
          if (!startTime) startTime = now
          const elapsed = now - startTime
          const progress = Math.min(1, elapsed / strokeDuration)

          // Smooth cubic curve for realistic pen brush strokes
          const easeProgress = 1 - Math.pow(1 - progress, 3)
          const currentOffset = length * (1 - easeProgress)

          if (el) {
            el.style.strokeDashoffset = `${currentOffset}`
            try {
              const pt = el.getPointAtLength(length * easeProgress)
              if (penRef.current) {
                penRef.current.style.display = 'block'
                penRef.current.setAttribute('transform', `translate(${pt.x}, ${pt.y})`)
              }
            } catch {
              // ignore
            }
          }

          if (progress < 1) {
            rafRef.current = requestAnimationFrame(frame)
          } else {
            // Finished current stroke
            if (el) {
              el.style.strokeDashoffset = '0'
              el.style.stroke = 'currentColor'
            }
            if (penRef.current) {
              penRef.current.style.display = 'none'
            }

            const nextCount = strokeIdx + 1
            setCompletedCount(nextCount)

            if (nextCount < totalStrokes) {
              // Pause briefly, then advance to next stroke
              timeoutRef.current = setTimeout(() => {
                if (!isPlayingRef.current) return
                setAnimatingStrokeIdx(nextCount)
                applyStrokeOffsets(nextCount, nextCount, lengths[nextCount])
                animateSingleStroke(nextCount)
              }, pauseMs)
            } else {
              // Entire character finished
              isPlayingRef.current = false
              setIsPlaying(false)
              setAnimatingStrokeIdx(null)
              setCompletedCount(totalStrokes)
              applyStrokeOffsets(totalStrokes, null, null)
            }
          }
        }

        rafRef.current = requestAnimationFrame(frame)
      }

      animateSingleStroke(currentIdx)
    },
    [strokeData, totalStrokes, measureLengths, stopAnimation, applyStrokeOffsets]
  )

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAnimation()
      setIsPlaying(false)
    } else {
      const fromIdx = completedCount >= totalStrokes ? 0 : completedCount
      startPlayback(fromIdx)
    }
  }

  const handleStepPrev = () => {
    stopAnimation()
    setIsPlaying(false)
    setAnimatingStrokeIdx(null)
    const nextCount = Math.max(0, completedCount - 1)
    setCompletedCount(nextCount)
    applyStrokeOffsets(nextCount, null, null)
  }

  const handleStepNext = () => {
    stopAnimation()
    setIsPlaying(false)
    setAnimatingStrokeIdx(null)
    const nextCount = Math.min(totalStrokes, completedCount + 1)
    setCompletedCount(nextCount)
    applyStrokeOffsets(nextCount, null, null)
  }

  const handleShowAll = () => {
    stopAnimation()
    setIsPlaying(false)
    setAnimatingStrokeIdx(null)
    setCompletedCount(totalStrokes)
    applyStrokeOffsets(totalStrokes, null, null)
  }

  const handleCycleSpeed = () => {
    setSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 0.75 : 1))
  }

  // Reset ONLY when kana character or autoPlay mode changes
  useEffect(() => {
    stopAnimation()

    if (autoPlay) {
      setCompletedCount(0)
      setAnimatingStrokeIdx(0)
      setIsPlaying(true)
      const t = setTimeout(() => {
        startPlayback(0)
      }, 80)
      return () => {
        clearTimeout(t)
        stopAnimation()
      }
    } else {
      setCompletedCount(totalStrokes)
      setAnimatingStrokeIdx(null)
      setIsPlaying(false)
      const t = setTimeout(() => {
        applyStrokeOffsets(totalStrokes, null, null)
      }, 80)
      return () => {
        clearTimeout(t)
        stopAnimation()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kana, autoPlay])

  if (!strokeData) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border rounded-2xl bg-muted/20 text-center ${className}`}>
        <span className="text-5xl font-japanese font-bold mb-2">{kana}</span>
        <p className="text-xs text-muted-foreground">Stroke data not available for this character.</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* SVG Canvas Box with Practice Grid */}
      <div
        className="relative rounded-2xl border-2 border-border/80 bg-background/95 shadow-inner overflow-hidden select-none"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 109 109"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Practice 4-Quadrant Guidelines (田-grid) */}
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

          {/* Background ghost outline of full character */}
          <g className="opacity-15">
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

          {/* Render Active & Completed Strokes with Hardware-Accelerated Dashoffset */}
          <g>
            {strokeData.strokes.map((pathD, idx) => {
              const isCurrentlyAnimating = animatingStrokeIdx === idx
              const length = pathLengthsRef.current[idx] || 180

              return (
                <path
                  key={`stroke-${idx}`}
                  ref={(el) => {
                    pathRefs.current[idx] = el
                  }}
                  d={pathD}
                  fill="none"
                  stroke={isCurrentlyAnimating ? '#0284c7' : 'currentColor'}
                  strokeWidth={isCurrentlyAnimating ? 4.6 : 4.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: length,
                  }}
                  className={
                    isCurrentlyAnimating
                      ? 'text-sky-500 drop-shadow-[0_0_8px_rgba(2,132,199,0.5)]'
                      : 'text-foreground'
                  }
                />
              )
            })}
          </g>

          {/* Moving Pen / Brush Tip Indicator */}
          <g ref={penRef} style={{ display: 'none', pointerEvents: 'none' }}>
            <circle
              r="7"
              fill="#38bdf8"
              className="opacity-40 animate-ping"
            />
            <circle
              r="4.5"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </g>

          {/* Numbered Start Badges */}
          <g>
            {strokeData.numbers.map((numPos, idx) => {
              const isRevealed = idx < completedCount || animatingStrokeIdx === idx
              const isCurrent = animatingStrokeIdx === idx || (idx === completedCount - 1 && !isPlaying)

              if (!isRevealed) return null

              return (
                <g key={`num-${idx}`} transform={`translate(${numPos.x}, ${numPos.y})`}>
                  <circle
                    cx="0"
                    cy="-2"
                    r="4.4"
                    className={`${
                      isCurrent
                        ? 'fill-sky-500 text-white shadow-xs'
                        : 'fill-muted-foreground/80 text-background'
                    } transition-colors`}
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="5"
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    {numPos.num}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Small Romaji / Kana Overlay Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 bg-background/80 backdrop-blur-xs">
            {romaji || kana}
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground">
            {Math.min(totalStrokes, completedCount + (animatingStrokeIdx !== null ? 1 : 0))}/{totalStrokes} strokes
          </span>
        </div>

        {/* Speak Pronunciation Button */}
        <button
          onClick={() => speakJapanese(kana)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground backdrop-blur-xs transition-colors"
          title={`Pronounce ${kana}`}
          aria-label={`Listen to ${kana}`}
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Control Buttons (Step through, Play/Pause Animation, Speed, Reset) */}
      {showControls && (
        <div className="flex items-center gap-1.5 w-full justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={handleStepPrev}
            disabled={completedCount <= 0 && animatingStrokeIdx === null}
            className="h-8 px-2 rounded-xl text-xs"
            title="Previous stroke"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant={isPlaying ? 'secondary' : 'default'}
            onClick={handleTogglePlay}
            className="h-8 px-3 rounded-xl text-xs gap-1.5 font-semibold"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                {completedCount >= totalStrokes ? 'Replay' : 'Play'}
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleStepNext}
            disabled={completedCount >= totalStrokes && animatingStrokeIdx === null}
            className="h-8 px-2 rounded-xl text-xs"
            title="Next stroke"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {/* Speed Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCycleSpeed}
            className="h-8 px-2 rounded-xl text-xs font-mono text-muted-foreground hover:text-foreground"
            title={`Speed: ${speed}x (click to change)`}
          >
            <Gauge className="h-3 w-3 mr-1" />
            {speed}x
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleShowAll}
            className="h-8 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            title="Show complete character"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Stroke Guidance Tip / Distinction Tip */}
      {strokeData.tip && (
        <div className="p-2.5 rounded-xl bg-muted/40 border text-xs text-muted-foreground max-w-xs text-left space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>How to write {kana}:</span>
          </div>
          <p className="text-[11px] leading-relaxed">{strokeData.tip}</p>
        </div>
      )}
    </div>
  )
}
