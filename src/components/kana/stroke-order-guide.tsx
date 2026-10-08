'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, RotateCcw, ChevronLeft, ChevronRight, Volume2, Sparkles } from 'lucide-react'
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
  const strokeData = getKanaStrokes(kana)
  const [activeStep, setActiveStep] = useState<number>(strokeData?.strokeCount ?? 1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [animatingStrokeIdx, setAnimatingStrokeIdx] = useState<number | null>(null)
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const strokeCount = strokeData?.strokeCount ?? 1

  const handlePlayAnimation = useCallback(() => {
    if (!strokeData || strokeData.strokes.length === 0) return

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    setIsPlaying(true)
    setActiveStep(0)
    setAnimatingStrokeIdx(0)

    let current = 0
    const total = strokeData.strokes.length

    function nextStroke() {
      current += 1
      setActiveStep(current)
      if (current < total) {
        setAnimatingStrokeIdx(current)
        animTimeoutRef.current = setTimeout(nextStroke, 850)
      } else {
        setAnimatingStrokeIdx(null)
        setIsPlaying(false)
      }
    }

    animTimeoutRef.current = setTimeout(nextStroke, 850)
  }, [strokeData])

  // Reset or initialize when character changes
  useEffect(() => {
    if (strokeData) {
      setActiveStep(strokeData.strokeCount)
      setIsPlaying(false)
      setAnimatingStrokeIdx(null)
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)

      if (autoPlay) {
        handlePlayAnimation()
      }
    }
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    }
  }, [kana, autoPlay, strokeData, handlePlayAnimation])

  const handleStepPrev = () => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    setIsPlaying(false)
    setAnimatingStrokeIdx(null)
    setActiveStep((prev) => Math.max(1, prev - 1))
  }

  const handleStepNext = () => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    setIsPlaying(false)
    setAnimatingStrokeIdx(null)
    setActiveStep((prev) => Math.min(strokeCount, prev + 1))
  }

  const handleShowAll = () => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    setIsPlaying(false)
    setAnimatingStrokeIdx(null)
    setActiveStep(strokeCount)
  }

  if (!strokeData) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border rounded-2xl bg-muted/20 text-center ${className}`}>
        <span className="text-5xl font-japanese font-bold mb-2">{kana}</span>
        <p className="text-xs text-muted-foreground">Stroke data not available for this compound.</p>
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
          {/* Subtle diagonal guides */}
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

          {/* Background ghost outline of the entire character */}
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

          {/* Render Active Strokes */}
          <g>
            {strokeData.strokes.map((pathD, idx) => {
              const isStrokeVisible = idx < activeStep
              const isCurrentlyAnimated = animatingStrokeIdx === idx

              if (!isStrokeVisible && !isCurrentlyAnimated) return null

              return (
                <path
                  key={`stroke-${idx}`}
                  d={pathD}
                  fill="none"
                  stroke={isCurrentlyAnimated ? 'var(--primary)' : 'currentColor'}
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${
                    isCurrentlyAnimated
                      ? 'animate-stroke-draw text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                      : 'text-foreground'
                  } transition-colors duration-200`}
                  style={{
                    strokeDasharray: isCurrentlyAnimated ? '200' : 'none',
                    strokeDashoffset: isCurrentlyAnimated ? '0' : 'none',
                    animation: isCurrentlyAnimated ? 'strokeDraw 0.8s ease-out forwards' : undefined,
                  }}
                />
              )
            })}
          </g>

          {/* Stroke Number Badges */}
          <g>
            {strokeData.numbers.map((numPos, idx) => {
              // Show stroke number if this stroke is revealed
              const isRevealed = idx < activeStep || animatingStrokeIdx === idx
              const isCurrent = idx === activeStep - 1 || animatingStrokeIdx === idx

              if (!isRevealed) return null

              return (
                <g key={`num-${idx}`} transform={`translate(${numPos.x}, ${numPos.y})`}>
                  <circle
                    cx="0"
                    cy="-2"
                    r="4.2"
                    className={`${
                      isCurrent ? 'fill-primary text-primary-foreground' : 'fill-muted-foreground/80 text-background'
                    } transition-colors`}
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="5"
                    fontWeight="bold"
                    fill={isCurrent ? '#ffffff' : '#ffffff'}
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
            {activeStep}/{strokeCount} strokes
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

      {/* Control Buttons (Step through, Play Animation, Reset) */}
      {showControls && (
        <div className="flex items-center gap-1.5 w-full justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={handleStepPrev}
            disabled={activeStep <= 1 || isPlaying}
            className="h-8 px-2 rounded-xl text-xs"
            title="Previous stroke"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant={isPlaying ? 'secondary' : 'default'}
            onClick={handlePlayAnimation}
            className="h-8 px-3 rounded-xl text-xs gap-1.5 font-semibold"
          >
            <Play className={`h-3.5 w-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
            {isPlaying ? 'Playing...' : 'Animate'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleStepNext}
            disabled={activeStep >= strokeCount || isPlaying}
            className="h-8 px-2 rounded-xl text-xs"
            title="Next stroke"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleShowAll}
            className="h-8 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            title="Reset to full character"
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

      <style>{`
        @keyframes strokeDraw {
          0% {
            stroke-dasharray: 200;
            stroke-dashoffset: 200;
          }
          100% {
            stroke-dasharray: 200;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}
