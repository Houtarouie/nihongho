import React from 'react'
import { PenTool } from 'lucide-react'
import type { KanaMasteryRecord, MasteryStage } from '@/lib/kana/types'
import { MasteryPips } from './mastery-pips'
import { Button } from '@/components/ui/button'

const STAGE_LABELS: Record<MasteryStage, { name: string; color: string; desc: string }> = {
  0: { name: 'New', color: 'text-muted-foreground', desc: 'Not practiced yet' },
  1: { name: 'Learning', color: 'text-amber-500', desc: 'Seen in lesson or quiz' },
  2: { name: 'Familiar', color: 'text-blue-500', desc: '2 consecutive correct in recognition' },
  3: { name: 'Solid', color: 'text-indigo-500', desc: 'Known across multiple quiz modes' },
  4: { name: 'Strong', color: 'text-purple-500', desc: 'Retained over multiple calendar days' },
  5: { name: 'Mastered', color: 'text-emerald-500', desc: 'Retained 7+ days with 90%+ accuracy' },
}

interface KanaTilePopoverProps {
  record?: KanaMasteryRecord
  kana: string
  romaji: string
  example?: string
  srsDueDate?: number
  onClose?: () => void
  onPracticeWriting?: () => void
}

export function KanaTilePopover({
  record,
  kana,
  romaji,
  example,
  srsDueDate,
  onPracticeWriting,
}: KanaTilePopoverProps) {
  const stage = record?.stage ?? 0
  const info = STAGE_LABELS[stage] || STAGE_LABELS[0]

  const attempts = record?.attempts ?? 0
  const correct = record?.correct ?? 0
  const accuracyPct = attempts > 0 ? Math.round((correct / attempts) * 100) : 0
  const streak = record?.streak ?? 0

  // Top confusion calculation
  let topConfusion: { kana: string; count: number } | null = null
  if (record?.confusions && Object.keys(record.confusions).length > 0) {
    const sorted = Object.entries(record.confusions).sort((a, b) => b[1] - a[1])
    if (sorted[0] && sorted[0][1] > 0) {
      topConfusion = {
        kana: sorted[0][0].split(':')[1] || sorted[0][0],
        count: sorted[0][1],
      }
    }
  }

  // Format last seen
  let lastSeenStr = 'Never'
  if (record?.lastSeenAt) {
    const diffHours = Math.round((Date.now() - record.lastSeenAt) / (1000 * 60 * 60))
    if (diffHours < 1) lastSeenStr = 'Just now'
    else if (diffHours < 24) lastSeenStr = `${diffHours}h ago`
    else lastSeenStr = `${Math.round(diffHours / 24)}d ago`
  }

  // Format next review
  let nextReviewStr = 'Not in SRS queue'
  if (srsDueDate) {
    const diffDays = Math.round((srsDueDate - Date.now()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) nextReviewStr = 'Due today'
    else if (diffDays === 1) nextReviewStr = 'Tomorrow'
    else nextReviewStr = `In ${diffDays} days`
  }

  return (
    <div className="p-3 w-56 space-y-2.5 text-xs bg-popover text-popover-foreground rounded-2xl border shadow-xl animate-in fade-in-50 zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <div>
          <span className="text-xl font-bold font-japanese leading-none">{kana}</span>
          <span className="text-xs font-mono font-medium text-muted-foreground ml-1.5">
            {romaji}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[11px] font-bold ${info.color}`}>
            {info.name}
          </span>
          <MasteryPips stage={stage} size="sm" />
        </div>
      </div>

      {/* Stage Description */}
      <p className="text-[11px] text-muted-foreground leading-snug">
        {info.desc}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t text-[11px]">
        <div>
          <span className="text-muted-foreground">Accuracy:</span>
          <p className="font-mono font-bold">
            {attempts > 0 ? `${accuracyPct}% (${correct}/${attempts})` : '—'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Streak:</span>
          <p className="font-mono font-bold">{streak} in a row</p>
        </div>
        <div>
          <span className="text-muted-foreground">Last Practiced:</span>
          <p className="font-mono font-medium">{lastSeenStr}</p>
        </div>
        <div>
          <span className="text-muted-foreground">SRS Review:</span>
          <p className="font-mono font-medium">{nextReviewStr}</p>
        </div>
      </div>

      {/* Confusions */}
      {topConfusion && (
        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] flex items-center justify-between">
          <span>⚠️ Confused with:</span>
          <span className="font-bold font-japanese">
            {topConfusion.kana} ({topConfusion.count}x)
          </span>
        </div>
      )}

      {example && (
        <p className="text-[10px] text-muted-foreground italic border-t pt-1 line-clamp-1">
          {example}
        </p>
      )}

      {onPracticeWriting && (
        <div className="pt-1.5 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={onPracticeWriting}
            className="w-full h-7 text-[11px] rounded-xl gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/10"
          >
            <PenTool className="h-3 w-3" />
            Write & Stroke Order
          </Button>
        </div>
      )}
    </div>
  )
}
