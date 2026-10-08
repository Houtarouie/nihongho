import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/progress', () => ({
  useProgress: () => ({
    kanaMastery: {},
    recordKanaAttempt: vi.fn().mockResolvedValue({ stage: 1 }),
    stats: { audioSpeed: 1.0 },
    addWeakPoint: vi.fn(),
    upsertCards: vi.fn().mockResolvedValue({ addedCount: 1 }),
    cards: [],
  }),
}))

import { KanaWritingQuizCard } from '@/components/quiz/kana-writing-quiz-card'
import { KanaQuizModal } from '@/components/quiz/kana-quiz-modal'
import { KanaWritingModal } from '@/components/kana/kana-writing-modal'
import { HIRAGANA_GOJUON, KATAKANA_GOJUON } from '@/data/kana'

describe('Kana Writing Quiz & Stroke Order Testing Suite', () => {
  it('renders KanaWritingQuizCard for Hiragana "a" (あ) with drawing canvas and stroke indicator', () => {
    const html = renderToStaticMarkup(
      <KanaWritingQuizCard
        kana="あ"
        romaji="a"
        script="hiragana"
        onCorrect={() => {}}
        onSkip={() => {}}
      />
    )

    // Heading prompt
    expect(html).toContain('Stroke Order Quiz')
    expect(html).toContain('Draw')
    expect(html).toContain('“a”')
    expect(html).toContain('Hiragana')

    // Stroke counter
    expect(html).toContain('Strokes: 0 / 3 completed')

    // SVG 4-quadrant grid (田-grid) and viewBox
    expect(html).toContain('viewBox="0 0 109 109"')
    expect(html).toContain('<canvas')

    // Starting guide circle with stroke 1 number
    expect(html).toContain('fill-sky-500')
    expect(html).toContain('>1<')

    // Action buttons
    expect(html).toContain('Undo')
    expect(html).toContain('Clear')
    expect(html).toContain('Peek Guide')
    expect(html).toContain('Skip')
  })

  it('renders KanaWritingQuizCard for Katakana "shi" (シ) with correct directional writing tip', () => {
    const html = renderToStaticMarkup(
      <KanaWritingQuizCard
        kana="シ"
        romaji="shi"
        script="katakana"
        onCorrect={() => {}}
      />
    )

    expect(html).toContain('“shi”')
    expect(html).toContain('Katakana')
    expect(html).toContain('Strokes: 0 / 3 completed')
    // Directional confusable tip
    expect(html).toContain('Writing tip:')
    expect(html).toMatch(/upward/i)
  })

  it('renders KanaQuizModal with "Draw" mode active and embedding KanaWritingQuizCard', () => {
    const sampleItems = HIRAGANA_GOJUON[0].items.filter(Boolean) as any[]
    const html = renderToStaticMarkup(
      <KanaQuizModal
        isOpen={true}
        onClose={() => {}}
        items={sampleItems}
        initialMode="writing"
        title="Hiragana Drawing Quiz"
      />
    )

    // Mode selector includes Draw tab
    expect(html).toContain('Draw')
    expect(html).toContain('Typing')
    expect(html).toContain('Sound → Kana')

    // Contains writing quiz card and drawing canvas
    expect(html).toContain('Stroke Order Quiz')
    expect(html).toContain('<canvas')
    expect(html).toContain('Undo')
    expect(html).toContain('Clear')
  })

  it('renders KanaWritingModal with the new "Stroke Order Quiz" tab option', () => {
    const sampleItems = KATAKANA_GOJUON[0].items.filter(Boolean) as any[]
    const html = renderToStaticMarkup(
      <KanaWritingModal
        isOpen={true}
        onClose={() => {}}
        initialKana="ア"
        items={sampleItems}
      />
    )

    // Three sub-navigation tabs
    expect(html).toContain('Writing Practice')
    expect(html).toContain('Stroke Order Quiz')
    expect(html).toContain('Calligraphy Rules &amp; Tips')
  })
})
