import { describe, it, expect } from 'vitest'
import { KATAKANA_GOJUON, type KanaItem } from '@/data/kana'

/**
 * Reproduction of the original defective implementation from src/data/quiz-engine.ts
 * which used `options.sort((a, b) => a.localeCompare(b))`.
 */
function legacyBuildSmartDistractors(
  target: KanaItem,
  pool: KanaItem[],
  mode: 'kana-to-romaji' | 'romaji-to-kana'
): string[] {
  const correctValue =
    mode === 'kana-to-romaji'
      ? target.romaji.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase()
      : target.kana

  const isHiragana = /^[\u3040-\u309f]/.test(target.kana)
  const isKatakana = /^[\u30a0-\u30ff]/.test(target.kana)
  const matchesScript = (kana: string) => {
    if (isHiragana) return /^[\u3040-\u309f]/.test(kana)
    if (isKatakana) return /^[\u30a0-\u30ff]/.test(kana)
    return true
  }

  const candidateValues: string[] = []
  for (const item of pool) {
    if (candidateValues.length >= 3) break
    if (mode === 'romaji-to-kana' && !matchesScript(item.kana)) continue
    const val =
      mode === 'kana-to-romaji'
        ? item.romaji.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase()
        : item.kana
    if (val !== correctValue && !candidateValues.includes(val)) {
      candidateValues.push(val)
    }
  }

  const options = [correctValue, ...candidateValues.slice(0, 3)]
  // This was the root cause: alphabetical sorting
  return options.sort((a, b) => a.localeCompare(b))
}

describe('Old Quiz Engine Defect Demonstration', () => {
  it('FAILS distribution test: shows that the old code sorts alphabetically, biasing correct slot', () => {
    const targetKatakanaShi: KanaItem = {
      kana: 'シ',
      romaji: 'shi',
      row: 'sa',
      example: 'シャツ',
    }

    const selectedPool = KATAKANA_GOJUON.slice(0, 3)
      .flatMap((r) => r.items)
      .filter((it): it is KanaItem => Boolean(it))

    const options = legacyBuildSmartDistractors(targetKatakanaShi, selectedPool, 'kana-to-romaji')
    const shiIndex = options.indexOf('shi')

    // In old code, shi is ALWAYS at index 2 (the 3rd slot) because of localeCompare sort!
    expect(shiIndex).toBe(2)

    const slotCounts = [0, 0, 0, 0]
    for (let i = 0; i < 1000; i++) {
      const opts = legacyBuildSmartDistractors(targetKatakanaShi, selectedPool, 'kana-to-romaji')
      const idx = opts.indexOf('shi')
      slotCounts[idx]++
    }

    // In a fair uniform distribution, each slot should be between 22% and 28%.
    // In the old code, slot 2 is 100% and slots 0, 1, 3 are 0%!
    const slot2Percentage = (slotCounts[2] / 1000) * 100
    expect(slot2Percentage).toBe(100) // Confirmed 100% biased in old code!
  })

  it('proves that the old code violates the 22%-28% uniform distribution requirement', () => {
    const selectedPool = KATAKANA_GOJUON.slice(0, 3)
      .flatMap((r) => r.items)
      .filter((it): it is KanaItem => Boolean(it))

    const targetKatakanaShi: KanaItem = {
      kana: 'シ',
      romaji: 'shi',
      row: 'sa',
      example: 'シャツ',
    }

    const slotCounts = [0, 0, 0, 0]
    for (let i = 0; i < 10000; i++) {
      const opts = legacyBuildSmartDistractors(targetKatakanaShi, selectedPool, 'kana-to-romaji')
      const idx = opts.indexOf('shi')
      slotCounts[idx]++
    }

    // Required by spec: every slot between 22% and 28%
    const satisfiesSpec = slotCounts.every(
      (count) => count >= 2200 && count <= 2800
    )
    // This MUST be false on the old code!
    expect(satisfiesSpec).toBe(false)
  })
})
