import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { StackedProgressBar } from '@/components/kana/stacked-progress-bar'
import { MasteryPips } from '@/components/kana/mastery-pips'
import { KanaTilePopover } from '@/components/kana/kana-tile-popover'
import type { ScriptProgress, KanaMasteryRecord } from '@/lib/kana/types'

describe('Phase C: Progress UI & Accessible Components', () => {
  it('renders StackedProgressBar with accessible progressbar attributes', () => {
    const progress: ScriptProgress = {
      script: 'hiragana',
      total: 104,
      countPerStage: { 0: 40, 1: 20, 2: 15, 3: 15, 4: 10, 5: 4 },
      knownCount: 29, // 15 + 10 + 4 (stages >= 3)
      knownPct: 28,
      masteredCount: 4,
      masteredPct: 4,
      weightedPct: 35,
    }

    const html = renderToStaticMarkup(
      <StackedProgressBar progress={progress} label="Hiragana Mastery" />
    )

    expect(html).toContain('role="progressbar"')
    expect(html).toContain('aria-valuenow="28"')
    expect(html).toContain('aria-valuemin="0"')
    expect(html).toContain('aria-valuemax="100"')
    expect(html).toContain('aria-label="Hiragana Mastery: 28% known (29 of 104), 4 mastered"')
    expect(html).toContain('28% known')
    expect(html).toContain('29/104 known')
    expect(html).toContain('4 mastered')
  })

  it('renders MasteryPips with role="img" and descriptive aria-label', () => {
    const html0 = renderToStaticMarkup(<MasteryPips stage={0} />)
    expect(html0).toContain('role="img"')
    expect(html0).toContain('Mastery Stage 0 of 5: New')

    const html3 = renderToStaticMarkup(<MasteryPips stage={3} />)
    expect(html3).toContain('Mastery Stage 3 of 5: Solid')

    const html5 = renderToStaticMarkup(<MasteryPips stage={5} />)
    expect(html5).toContain('Mastery Stage 5 of 5: Mastered')
  })

  it('renders KanaTilePopover with stage, accuracy, streak, and top confusion', () => {
    const record: KanaMasteryRecord = {
      id: 'kata:シ',
      kana: 'シ',
      romaji: 'shi',
      script: 'katakana',
      group: 'gojuon',
      row: 'sa',
      stage: 3,
      stageChangedAt: 1000000,
      attempts: 12,
      correct: 10,
      streak: 4,
      lastSeenAt: Date.now() - 3600 * 1000, // 1h ago
      last10Attempts: [],
      perModeCounts: {
        recognition: { attempts: 6, correct: 5 },
        reverse: { attempts: 6, correct: 5 },
        listening: { attempts: 0, correct: 0 },
        typing: { attempts: 0, correct: 0 },
      },
      confusions: {
        'kata:ツ': 3,
        'kata:ソ': 1,
      },
    }

    const html = renderToStaticMarkup(
      <KanaTilePopover
        record={record}
        kana="シ"
        romaji="shi"
        example="シネマ (cinema)"
      />
    )

    expect(html).toContain('Solid')
    expect(html).toContain('83% (10/12)') // accuracy
    expect(html).toContain('4 in a row') // streak
    expect(html).toContain('Confused with:')
    expect(html).toContain('ツ (3x)') // top confusion extracted
    expect(html).toContain('シネマ (cinema)')
  })
})
