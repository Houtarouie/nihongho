import React from 'react'
import type { MasteryStage } from '@/lib/kana/types'

interface MasteryPipsProps {
  stage: MasteryStage
  className?: string
  size?: 'sm' | 'md'
}

const STAGE_NAMES = [
  'New',
  'Learning',
  'Familiar',
  'Solid',
  'Strong',
  'Mastered',
] as const

const STAGE_COLORS = [
  'bg-muted-foreground/30',       // 0 New
  'bg-amber-500',                // 1 Learning
  'bg-blue-500',                 // 2 Familiar
  'bg-indigo-500',               // 3 Solid
  'bg-purple-500',               // 4 Strong
  'bg-emerald-500',              // 5 Mastered
]

export function MasteryPips({ stage, className = '', size = 'sm' }: MasteryPipsProps) {
  const pipWidth = size === 'sm' ? 'w-1 h-1.5' : 'w-1.5 h-2'
  const activeColor = STAGE_COLORS[stage] || 'bg-muted-foreground/30'

  return (
    <div
      role="img"
      aria-label={`Mastery Stage ${stage} of 5: ${STAGE_NAMES[stage]}`}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {[1, 2, 3, 4, 5].map((level) => {
        const isFilled = stage >= level
        return (
          <span
            key={level}
            className={`rounded-full transition-all duration-200 ${pipWidth} ${
              isFilled ? activeColor : 'bg-muted-foreground/20'
            }`}
          />
        )
      })}
    </div>
  )
}
