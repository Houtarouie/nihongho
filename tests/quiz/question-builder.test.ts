import { describe, it, expect } from 'vitest'
import { buildQuestion, cleanRomaji, getKanaScript } from '@/lib/kana/question-builder'
import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_GOJUON,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  type KanaItem,
} from '@/data/kana'
import type { QuizModeType } from '@/lib/kana/types'

// Gather flat lists of kana
const ALL_HIRAGANA: KanaItem[] = [
  ...HIRAGANA_GOJUON,
  ...HIRAGANA_DAKUTEN,
  ...HIRAGANA_YOON,
]
  .flatMap((r) => r.items)
  .filter((it): it is KanaItem => Boolean(it))

const ALL_KATAKANA: KanaItem[] = [
  ...KATAKANA_GOJUON,
  ...KATAKANA_DAKUTEN,
  ...KATAKANA_YOON,
]
  .flatMap((r) => r.items)
  .filter((it): it is KanaItem => Boolean(it))

const ALL_KANA: KanaItem[] = [...ALL_HIRAGANA, ...ALL_KATAKANA]

describe('Phase A: buildQuestion pure function', () => {
  const modes: QuizModeType[] = ['kana-to-romaji', 'romaji-to-kana', 'listening']

  modes.forEach((mode) => {
    it(`distribution test: over 10,000 questions in '${mode}' mode, each slot holds answer 22% to 28%`, () => {
      const slotCounts = [0, 0, 0, 0]
      let positionBag: number[] = []
      let lastPickedSlot: number | undefined = undefined
      let slotStreak = 0

      // Run across diverse targets in katakana and hiragana
      for (let i = 0; i < 10000; i++) {
        const target = ALL_KANA[i % ALL_KANA.length]
        const q = buildQuestion({
          target,
          pool: ALL_KANA,
          mode,
          allKana: ALL_KANA,
          positionBag,
          lastPickedSlot,
          slotStreak,
        })

        slotCounts[q.correctIndex]++
        positionBag = q.newPositionBag
        lastPickedSlot = q.newLastPickedSlot
        slotStreak = q.newSlotStreak ?? 1
      }

      // Check each slot percentage is between 22% and 28%
      for (let slot = 0; slot < 4; slot++) {
        const pct = (slotCounts[slot] / 10000) * 100
        expect(pct).toBeGreaterThanOrEqual(22.0)
        expect(pct).toBeLessThanOrEqual(28.0)
      }
    })
  })

  it('session streak test: no slot repeats more than twice in a row across 100 15-question sessions', () => {
    for (let session = 0; session < 100; session++) {
      let positionBag: number[] = []
      let lastPickedSlot: number | undefined = undefined
      let slotStreak = 0
      const sessionSlots: number[] = []

      for (let qIdx = 0; qIdx < 15; qIdx++) {
        const target = ALL_HIRAGANA[qIdx % ALL_HIRAGANA.length]
        const q = buildQuestion({
          target,
          pool: ALL_HIRAGANA,
          mode: 'kana-to-romaji',
          allKana: ALL_KANA,
          positionBag,
          lastPickedSlot,
          slotStreak,
        })

        sessionSlots.push(q.correctIndex)
        positionBag = q.newPositionBag
        lastPickedSlot = q.newLastPickedSlot
        slotStreak = q.newSlotStreak ?? 1
      }

      // Verify no slot repeats > 2 times consecutively
      for (let i = 2; i < sessionSlots.length; i++) {
        const threeInARow =
          sessionSlots[i] === sessionSlots[i - 1] &&
          sessionSlots[i] === sessionSlots[i - 2]
        expect(threeInARow).toBe(false)
      }
    }
  })

  it('always produces exactly 4 options even when selected pool contains only 1 kana', () => {
    const singleKana: KanaItem = {
      kana: 'シ',
      romaji: 'shi',
      row: 'sa',
      example: 'シャツ',
    }

    const q = buildQuestion({
      target: singleKana,
      pool: [singleKana],
      mode: 'kana-to-romaji',
      allKana: ALL_KANA,
    })

    expect(q.options.length).toBe(4)
    expect(q.options[q.correctIndex]).toBe('shi')
    // All 4 options are distinct strings
    const uniqueOptions = new Set(q.options)
    expect(uniqueOptions.size).toBe(4)
  })

  it('guarantees no duplicate options and no ambiguous options with same romaji', () => {
    // Specifically test pairs with identical romaji like 'o' (お and を) or 'ji' (じ and ぢ)
    const oKana = ALL_HIRAGANA.find((k) => k.kana === 'お')!
    const jiKana = ALL_HIRAGANA.find((k) => k.kana === 'じ')!

    for (const target of [oKana, jiKana]) {
      for (let i = 0; i < 50; i++) {
        const q = buildQuestion({
          target,
          pool: ALL_HIRAGANA,
          mode: 'kana-to-romaji',
          allKana: ALL_KANA,
        })

        // No duplicates
        expect(new Set(q.options).size).toBe(4)

        // If target is お (o), options should never contain another 'o' (e.g. from を)
        const occurrencesOfTarget = q.options.filter(
          (opt) => opt === cleanRomaji(target.romaji)
        )
        expect(occurrencesOfTarget.length).toBe(1)
      }
    }
  })

  it('limits look-alikes to at most 1 when kana is below Familiar (stage < 2)', () => {
    const targetKatakanaShi: KanaItem = {
      kana: 'シ',
      romaji: 'shi',
      row: 'sa',
      example: 'シャツ',
    }

    // Pass mastery map with stage 1 (Learning)
    const masteryMap = {
      'kata:シ': {
        id: 'kata:シ',
        kana: 'シ',
        romaji: 'shi',
        script: 'katakana' as const,
        group: 'gojuon' as const,
        row: 'sa',
        stage: 1 as const,
        stageChangedAt: Date.now(),
        attempts: 1,
        correct: 1,
        streak: 1,
        last10Attempts: [],
        perModeCounts: {
          recognition: { attempts: 1, correct: 1 },
          reverse: { attempts: 0, correct: 0 },
          listening: { attempts: 0, correct: 0 },
          typing: { attempts: 0, correct: 0 },
        },
        confusions: {},
      },
    }

    const q = buildQuestion({
      target: targetKatakanaShi,
      pool: ALL_KATAKANA,
      mode: 'romaji-to-kana',
      allKana: ALL_KANA,
      masteryMap,
    })

    // シ's curated look-alikes are ['ツ', 'ン', 'ソ', 'ミ']
    const lookAlikes = ['ツ', 'ン', 'ソ', 'ミ']
    const presentLookAlikes = q.options.filter((opt) => lookAlikes.includes(opt))
    expect(presentLookAlikes.length).toBeLessThanOrEqual(1)
  })

  it('prioritizes actual learner confusions from history', () => {
    const targetKana: KanaItem = {
      kana: 'ぬ',
      romaji: 'nu',
      row: 'na',
      example: 'いぬ',
    }

    // Learner has repeatedly confused ぬ with め
    const masteryMap = {
      'hira:ぬ': {
        id: 'hira:ぬ',
        kana: 'ぬ',
        romaji: 'nu',
        script: 'hiragana' as const,
        group: 'gojuon' as const,
        row: 'na',
        stage: 2 as const,
        stageChangedAt: Date.now(),
        attempts: 4,
        correct: 2,
        streak: 0,
        last10Attempts: [],
        perModeCounts: {
          recognition: { attempts: 4, correct: 2 },
          reverse: { attempts: 0, correct: 0 },
          listening: { attempts: 0, correct: 0 },
          typing: { attempts: 0, correct: 0 },
        },
        confusions: {
          'hira:め': 5,
        },
      },
    }

    const q = buildQuestion({
      target: targetKana,
      pool: ALL_HIRAGANA,
      mode: 'romaji-to-kana',
      allKana: ALL_KANA,
      masteryMap,
    })

    // 'め' should be present among the options
    expect(q.options).toContain('め')
  })
})
