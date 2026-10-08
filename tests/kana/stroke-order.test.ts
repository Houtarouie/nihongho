import { describe, it, expect } from 'vitest'
import {
  getKanaStrokes,
  hasKanaStrokes,
  getStrokeWritingTip,
  CALLIGRAPHY_RULES,
  KANA_WRITING_TIPS,
} from '@/lib/kana/stroke-order'

describe('Kana Stroke Order Engine', () => {
  it('loads stroke paths and numbers for Hiragana characters', () => {
    const a = getKanaStrokes('あ')
    expect(a).toBeDefined()
    expect(a?.char).toBe('あ')
    expect(a?.strokeCount).toBe(3)
    expect(a?.strokes.length).toBe(3)
    expect(a?.numbers.length).toBe(3)
    expect(a?.numbers[0].num).toBe(1)
    expect(a?.numbers[1].num).toBe(2)
    expect(a?.numbers[2].num).toBe(3)

    const i = getKanaStrokes('い')
    expect(i?.strokeCount).toBe(2)

    const shi = getKanaStrokes('し')
    expect(shi?.strokeCount).toBe(1)
  })

  it('loads stroke paths and numbers for Katakana characters including confusables', () => {
    const shi = getKanaStrokes('シ')
    expect(shi).toBeDefined()
    expect(shi?.strokeCount).toBe(3)
    expect(shi?.tip).toContain('BOTTOM-LEFT')

    const tsu = getKanaStrokes('ツ')
    expect(tsu).toBeDefined()
    expect(tsu?.strokeCount).toBe(3)
    expect(tsu?.tip).toContain('TOP-RIGHT')

    const so = getKanaStrokes('ソ')
    expect(so).toBeDefined()
    expect(so?.strokeCount).toBe(2)
    expect(so?.tip).toContain('DOWNWARD')

    const n = getKanaStrokes('ン')
    expect(n).toBeDefined()
    expect(n?.strokeCount).toBe(2)
    expect(n?.tip).toContain('UPWARD')
  })

  it('handles dakuten and handakuten characters', () => {
    const ga = getKanaStrokes('が')
    expect(ga).toBeDefined()
    expect(ga?.strokeCount).toBe(5) // か (3) + 2 dots

    const pa = getKanaStrokes('ぱ')
    expect(pa).toBeDefined()
    expect(pa?.strokeCount).toBe(4) // は (3 strokes) + 1 circle
  })

  it('handles compound yōon kana by retrieving base strokes', () => {
    const kya = getKanaStrokes('きゃ')
    expect(kya).toBeDefined()
    expect(kya?.strokeCount).toBe(4) // き base strokes
    expect(kya?.tip).toContain('Compound character')
  })

  it('correctly confirms stroke availability with hasKanaStrokes', () => {
    expect(hasKanaStrokes('あ')).toBe(true)
    expect(hasKanaStrokes('カ')).toBe(true)
    expect(hasKanaStrokes('ん')).toBe(true)
    expect(hasKanaStrokes('')).toBe(false)
  })

  it('provides Japanese calligraphy rules and writing guidance', () => {
    expect(CALLIGRAPHY_RULES.length).toBeGreaterThanOrEqual(4)
    expect(CALLIGRAPHY_RULES.some((r) => r.title.includes('Top to Bottom'))).toBe(true)
    expect(CALLIGRAPHY_RULES.some((r) => r.title.includes('Left to Right'))).toBe(true)
    expect(CALLIGRAPHY_RULES.some((r) => r.title.includes('Dakuten'))).toBe(true)
  })

  it('provides informative character-specific writing tips', () => {
    const tipA = getStrokeWritingTip('あ')
    expect(tipA).toContain('horizontal')
    const tipShi = getStrokeWritingTip('シ')
    expect(tipShi).toContain('BOTTOM-LEFT')
  })
})
