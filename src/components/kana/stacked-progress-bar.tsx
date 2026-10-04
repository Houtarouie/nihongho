import React from 'react'
import type { ScriptProgress } from '@/lib/kana/types'

interface StackedProgressBarProps {
  progress: ScriptProgress
  label?: string
  showLabels?: boolean
  className?: string
  height?: 'sm' | 'md' | 'lg'
}

export function StackedProgressBar({
  progress,
  label,
  showLabels = true,
  className = '',
  height = 'md',
}: StackedProgressBarProps) {
  const { total, countPerStage, knownPct, knownCount, masteredCount, script } = progress
  const scriptName = script === 'hiragana' ? 'Hiragana' : 'Katakana'
  const displayLabel = label || `${scriptName} Mastery`

  const stage1Pct = total > 0 ? (countPerStage[1] / total) * 100 : 0
  const stage2Pct = total > 0 ? (countPerStage[2] / total) * 100 : 0
  const stage3Pct = total > 0 ? (countPerStage[3] / total) * 100 : 0
  const stage4Pct = total > 0 ? (countPerStage[4] / total) * 100 : 0
  const stage5Pct = total > 0 ? (countPerStage[5] / total) * 100 : 0

  const heightClass =
    height === 'sm' ? 'h-2' : height === 'lg' ? 'h-4' : 'h-2.5'

  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <span>{displayLabel}</span>
            <span className="text-[11px] font-mono font-normal text-muted-foreground">
              ({knownCount}/{total} known &bull; {masteredCount} mastered)
            </span>
          </span>
          <span className="font-mono font-bold text-primary text-xs">
            {knownPct}% known
          </span>
        </div>
      )}

      {/* Stacked Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={knownPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${displayLabel}: ${knownPct}% known (${knownCount} of ${total}), ${masteredCount} mastered`}
        className={`w-full bg-muted/60 overflow-hidden rounded-full flex ${heightClass}`}
      >
        {/* Mastered (Stage 5) - Emerald */}
        {stage5Pct > 0 && (
          <div
            style={{ width: `${stage5Pct}%` }}
            className="bg-emerald-500 motion-safe:transition-all motion-safe:duration-300"
            title={`Mastered: ${countPerStage[5]}`}
          />
        )}
        {/* Strong (Stage 4) - Purple */}
        {stage4Pct > 0 && (
          <div
            style={{ width: `${stage4Pct}%` }}
            className="bg-purple-500 motion-safe:transition-all motion-safe:duration-300"
            title={`Strong: ${countPerStage[4]}`}
          />
        )}
        {/* Solid (Stage 3) - Indigo */}
        {stage3Pct > 0 && (
          <div
            style={{ width: `${stage3Pct}%` }}
            className="bg-indigo-500 motion-safe:transition-all motion-safe:duration-300"
            title={`Solid: ${countPerStage[3]}`}
          />
        )}
        {/* Familiar (Stage 2) - Blue */}
        {stage2Pct > 0 && (
          <div
            style={{ width: `${stage2Pct}%` }}
            className="bg-blue-500 motion-safe:transition-all motion-safe:duration-300"
            title={`Familiar: ${countPerStage[2]}`}
          />
        )}
        {/* Learning (Stage 1) - Amber */}
        {stage1Pct > 0 && (
          <div
            style={{ width: `${stage1Pct}%` }}
            className="bg-amber-500 motion-safe:transition-all motion-safe:duration-300"
            title={`Learning: ${countPerStage[1]}`}
          />
        )}
      </div>
    </div>
  )
}
