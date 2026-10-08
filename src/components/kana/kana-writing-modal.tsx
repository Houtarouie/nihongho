'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  PenTool,
  BookOpen,
  Volume2,
  Sparkles,
  Lightbulb,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StrokeOrderGuide } from './stroke-order-guide'
import { KanaDrawingPad } from './kana-drawing-pad'
import { MasteryPips } from './mastery-pips'
import { useProgress } from '@/lib/progress'
import { makeKanaId, detectKanaScript } from '@/lib/kana/mastery-engine'
import { CALLIGRAPHY_RULES, getStrokeWritingTip } from '@/lib/kana/stroke-order'
import { speakJapanese } from '@/data/srs-deck'
import { type KanaItem } from '@/data/kana'
import { toast } from 'sonner'

interface KanaWritingModalProps {
  isOpen: boolean
  onClose: () => void
  initialKana?: string
  initialItem?: KanaItem
  items?: KanaItem[]
}

export function KanaWritingModal({
  isOpen,
  onClose,
  initialKana = 'あ',
  initialItem,
  items = [],
}: KanaWritingModalProps) {
  const { kanaMastery, recordKanaAttempt, stats } = useProgress()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'practice' | 'rules'>('practice')

  // Find index in items if provided
  useEffect(() => {
    if (initialItem && items.length > 0) {
      const idx = items.findIndex((it) => it.kana === initialItem.kana)
      if (idx !== -1) setCurrentIndex(idx)
    } else if (initialKana && items.length > 0) {
      const idx = items.findIndex((it) => it.kana === initialKana)
      if (idx !== -1) setCurrentIndex(idx)
    }
  }, [initialKana, initialItem, items])

  if (!isOpen) return null

  const currentItem = items[currentIndex] || initialItem || { kana: initialKana, romaji: '', row: '' }
  const currentKana = currentItem.kana
  const currentRomaji = currentItem.romaji

  const script = detectKanaScript(currentKana)
  const kanaId = makeKanaId(currentKana, script)
  const record = kanaMastery[kanaId]
  const currentStage = record?.stage ?? 0

  const handlePrev = () => {
    if (items.length <= 1) return
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
  }

  const handleNext = () => {
    if (items.length <= 1) return
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
  }

  const handlePracticeComplete = async (correct: boolean) => {
    try {
      await recordKanaAttempt({
        kanaId,
        mode: 'typing',
        correct,
        responseMs: 2500,
        source: 'quiz',
      })
      if (correct) {
        toast.success(`Great handwriting! Practiced ${currentKana} (${currentRomaji})`, {
          duration: 2000,
        })
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50 duration-150 overflow-y-auto">
      <Card className="w-full max-w-3xl rounded-3xl border-2 shadow-2xl bg-card max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header (Shrink-0, Fixed) */}
        <CardHeader className="p-4 sm:p-5 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <PenTool className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">Write & Draw Kana</CardTitle>
                  <Badge variant="outline" className="text-[10px] capitalize font-mono">
                    {script}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span>Character:</span>
                  <span className="font-japanese font-bold text-foreground text-sm">
                    {currentKana}
                  </span>
                  {currentRomaji && (
                    <span className="font-mono text-xs">({currentRomaji})</span>
                  )}
                  <span className="inline-block mx-1 text-muted-foreground/40">•</span>
                  <span>Mastery:</span>
                  <MasteryPips stage={currentStage} size="sm" />
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => speakJapanese(currentKana, { rate: stats.audioSpeed || 1.0 })}
                className="p-1.5 rounded-xl border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Pronounce character"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 mt-3 bg-muted/60 p-1 rounded-xl text-xs w-fit">
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'practice'
                  ? 'bg-background text-primary shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PenTool className="h-3 w-3" />
              Writing Practice
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'bg-background text-primary shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              Calligraphy Rules & Tips
            </button>
          </div>
        </CardHeader>

        {/* Content Body (Flex-1, Scrollable) */}
        <CardContent className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
          {activeTab === 'practice' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Stroke Order Guide & Step Player */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl bg-muted/20 border">
                <div className="flex items-center justify-between w-full pb-1 border-b">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    Stroke Order & Animation
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Model Guide
                  </Badge>
                </div>

                <StrokeOrderGuide
                  kana={currentKana}
                  romaji={currentRomaji}
                  size={210}
                  showControls={true}
                />
              </div>

              {/* Right Column: Interactive Handwriting Canvas */}
              <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl bg-muted/20 border">
                <div className="flex items-center justify-between w-full pb-1 border-b">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <PenTool className="h-3.5 w-3.5 text-primary" />
                    Your Drawing Pad
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Trace or Freehand
                  </Badge>
                </div>

                <KanaDrawingPad
                  kana={currentKana}
                  romaji={currentRomaji}
                  size={220}
                  onComplete={handlePracticeComplete}
                />
              </div>
            </div>
          ) : (
            /* Calligraphy Rules & Guides */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Golden Rules of Japanese Stroke Order (筆順 - Hitsujun)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Writing strokes in the proper sequence and direction ensures good balance, natural curve flow, and legible cursive handwriting.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CALLIGRAPHY_RULES.map((rule, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl border bg-background space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {idx + 1}. {rule.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {rule.description}
                    </p>
                    <p className="text-[11px] font-japanese text-muted-foreground/80 italic pt-1 border-t">
                      e.g. {rule.example}
                    </p>
                  </div>
                ))}
              </div>

              {/* Character Specific Writing Tip */}
              <div className="p-3.5 rounded-2xl border bg-muted/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Specific tip for {currentKana}:</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {getStrokeWritingTip(currentKana)}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Carousel & Navigation (Shrink-0, Fixed) */}
        {items.length > 1 && (
          <div className="p-3 sm:p-4 border-t bg-muted/20 flex items-center justify-between gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrev}
              className="h-8 rounded-xl text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-xs px-2 py-1 scrollbar-none">
              {items.map((it, idx) => (
                <button
                  key={`${it.kana}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-7 w-7 rounded-lg text-xs font-japanese font-bold transition-all shrink-0 ${
                    idx === currentIndex
                      ? 'bg-primary text-primary-foreground shadow-xs scale-105'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {it.kana}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleNext}
              className="h-8 rounded-xl text-xs gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
