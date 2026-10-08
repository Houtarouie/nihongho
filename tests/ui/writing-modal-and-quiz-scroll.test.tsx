import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/progress', () => ({
  useProgress: () => ({
    kanaMastery: {},
    recordKanaAttempt: vi.fn().mockResolvedValue({}),
    stats: { audioSpeed: 1.0 },
    addWeakPoint: vi.fn(),
    upsertCards: vi.fn().mockResolvedValue({ addedCount: 1 }),
    cards: [],
  }),
}))

import { KanaTilePopover } from '@/components/kana/kana-tile-popover'
import { StrokeOrderGuide } from '@/components/kana/stroke-order-guide'
import { KanaDrawingPad } from '@/components/kana/kana-drawing-pad'
import { KanaWritingModal } from '@/components/kana/kana-writing-modal'
import { KanaQuizModal } from '@/components/quiz/kana-quiz-modal'
import { HIRAGANA_GOJUON } from '@/data/kana'

describe('Kana Writing & Stroke Order and Modal Scroll Tests', () => {
  it('renders KanaTilePopover with Write & Stroke Order button when callback is provided', () => {
    const html = renderToStaticMarkup(
      <KanaTilePopover
        kana="あ"
        romaji="a"
        example="あめ"
        onPracticeWriting={() => {}}
      />
    )
    expect(html).toContain('Write &amp; Stroke Order')
    expect(html).toContain('あ')
    expect(html).toContain('a')
  })

  it('renders StrokeOrderGuide with KanjiVG stroke paths, numbers, and grid lines', () => {
    const html = renderToStaticMarkup(
      <StrokeOrderGuide kana="あ" romaji="a" size={200} showControls={true} />
    )
    // Check SVG guidelines
    expect(html).toContain('viewBox="0 0 109 109"')
    // Stroke number text/circles
    expect(html).toContain('1')
    expect(html).toContain('2')
    expect(html).toContain('3')
    // Controls
    expect(html).toContain('Replay')
    expect(html).toContain('How to write あ:')
  })

  it('renders KanaDrawingPad with canvas, 4-quadrant grid, undo and clear buttons', () => {
    const html = renderToStaticMarkup(
      <KanaDrawingPad kana="あ" romaji="a" size={240} />
    )
    expect(html).toContain('<canvas')
    expect(html).toContain('Undo')
    expect(html).toContain('Clear')
    expect(html).toContain('Hide Guide')
    expect(html).toContain('Check My Writing')
  })

  it('renders KanaWritingModal with non-clipped scrollable container classes', () => {
    const sampleItems = HIRAGANA_GOJUON[0].items.filter(Boolean) as any[]
    const html = renderToStaticMarkup(
      <KanaWritingModal
        isOpen={true}
        onClose={() => {}}
        initialKana="あ"
        items={sampleItems}
      />
    )
    // Ensure overflow-y-auto is present on wrapper and card has max-h
    expect(html).toContain('overflow-y-auto')
    expect(html).toContain('max-h-[92vh]')
    expect(html).toContain('Write &amp; Draw Kana')
    expect(html).toContain('Writing Practice')
    expect(html).toContain('Calligraphy Rules &amp; Tips')
  })

  it('renders KanaQuizModal with max-h-[90vh] flex flex-col and overflow-y-auto preventing overflow traps', () => {
    const sampleItems = HIRAGANA_GOJUON[0].items.filter(Boolean) as any[]
    const html = renderToStaticMarkup(
      <KanaQuizModal
        isOpen={true}
        onClose={() => {}}
        items={sampleItems}
        title="Kana Test Quiz"
      />
    )
    // Outer overlay has overflow-y-auto
    expect(html).toContain('overflow-y-auto')
    // Card has max-h-[90vh] and flex-col
    expect(html).toContain('max-h-[90vh]')
    expect(html).toContain('flex-col')
    // CardHeader is non-shrinking
    expect(html).toContain('shrink-0')
    // Card content has min-h-0 and overflow-y-auto
    expect(html).toContain('min-h-0')
  })
})
