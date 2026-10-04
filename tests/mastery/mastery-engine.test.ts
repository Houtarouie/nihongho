import { describe, it, expect } from 'vitest'
import {
  createInitialKanaRecord,
  recordKanaAttempt,
  kanaStage,
  scriptProgress,
  groupProgress,
  rowProgress,
  weakKana,
} from '@/lib/kana/mastery-engine'
import type { KanaMasteryRecord } from '@/lib/kana/types'
import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_GOJUON,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  type KanaItem,
} from '@/data/kana'

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

const ALL_KANA = [...ALL_HIRAGANA, ...ALL_KATAKANA]

describe('Phase B: Mastery Engine (Data Layer)', () => {
  it('starts at Stage 0 (New) and advances to Stage 1 (Learning) on first attempt', () => {
    let rec = createInitialKanaRecord({
      kana: 'あ',
      romaji: 'a',
      row: 'a',
      script: 'hiragana',
      group: 'gojuon',
    })

    expect(rec.stage).toBe(0)
    expect(rec.attempts).toBe(0)

    // First attempt (wrong) -> seen once, moves to Learning (Stage 1)
    rec = recordKanaAttempt({
      record: rec,
      mode: 'kana-to-romaji',
      correct: false,
      now: 1000,
    })
    expect(rec.stage).toBe(1)
    expect(rec.attempts).toBe(1)
    expect(rec.correct).toBe(0)
  })

  it('promotes to Stage 2 (Familiar) after 2 correct in a row in recognition mode', () => {
    let rec = createInitialKanaRecord({
      kana: 'あ',
      romaji: 'a',
      row: 'a',
      script: 'hiragana',
      group: 'gojuon',
    })

    // 1st correct in recognition (Stage 0 -> 1)
    rec = recordKanaAttempt({
      record: rec,
      mode: 'kana-to-romaji',
      correct: true,
      now: 1000,
    })
    expect(rec.stage).toBe(1)
    expect(rec.streak).toBe(1)

    // 2nd correct in recognition (streak reaches 2 -> promotes to Stage 2 Familiar)
    rec = recordKanaAttempt({
      record: rec,
      mode: 'kana-to-romaji',
      correct: true,
      now: 2000,
    })
    expect(rec.stage).toBe(2)
    expect(rec.streak).toBe(2)
  })

  it('promotes to Stage 3 (Solid) when correct in another mode (reverse, listening, typing)', () => {
    let rec = createInitialKanaRecord({
      kana: 'あ',
      romaji: 'a',
      row: 'a',
      script: 'hiragana',
      group: 'gojuon',
    })

    // Reach Stage 2 Familiar
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: 1000 })
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: 2000 })
    expect(rec.stage).toBe(2)

    // Correct in reverse mode (romaji-to-kana) -> promotes to Stage 3 Solid
    rec = recordKanaAttempt({
      record: rec,
      mode: 'romaji-to-kana',
      correct: true,
      now: 3000,
    })
    expect(rec.stage).toBe(3)
    expect(rec.solidReachedAt).toBe(3000)
  })

  it('cannot jump to Stage 4 (Strong) on same calendar day; requires next local calendar day', () => {
    let rec = createInitialKanaRecord({
      kana: 'あ',
      romaji: 'a',
      row: 'a',
      script: 'hiragana',
      group: 'gojuon',
    })

    const day1_10am = new Date('2026-10-01T10:00:00Z').getTime()
    const day1_2pm = new Date('2026-10-01T14:00:00Z').getTime()
    const day2_10am = new Date('2026-10-02T10:00:00Z').getTime()

    // Reach Stage 3 Solid on Day 1
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day1_10am })
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day1_10am + 100 })
    rec = recordKanaAttempt({ record: rec, mode: 'romaji-to-kana', correct: true, now: day1_10am + 200 })
    expect(rec.stage).toBe(3)

    // Cramming on same day (Day 1, 2pm) CANNOT promote to Stage 4
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day1_2pm })
    expect(rec.stage).toBe(3)

    // Next calendar day (Day 2, 10am) -> promotes to Stage 4 Strong
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day2_10am })
    expect(rec.stage).toBe(4)
    expect(rec.strongReachedAt).toBe(day2_10am)
  })

  it('promotes to Stage 5 (Mastered) only after 7 days from reaching Strong with >= 90% accuracy', () => {
    let rec = createInitialKanaRecord({
      kana: 'あ',
      romaji: 'a',
      row: 'a',
      script: 'hiragana',
      group: 'gojuon',
    })

    const day1 = new Date('2026-10-01T10:00:00Z').getTime()
    const day2 = new Date('2026-10-02T10:00:00Z').getTime()
    const day5 = new Date('2026-10-05T10:00:00Z').getTime() // 3 days later
    const day9 = new Date('2026-10-09T10:00:00Z').getTime() // 7 days after reaching Strong on day 2

    // Reach Stage 4 on Day 2
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day1 })
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day1 + 100 })
    rec = recordKanaAttempt({ record: rec, mode: 'romaji-to-kana', correct: true, now: day1 + 200 })
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day2 })
    expect(rec.stage).toBe(4)

    // Attempt on Day 5 (only 3 days) -> stays Stage 4
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day5 })
    expect(rec.stage).toBe(4)

    // Attempt on Day 9 (7 days later) with 100% accuracy -> promotes to Stage 5 Mastered
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: day9 })
    expect(rec.stage).toBe(5)
  })

  it('miss drops 1 stage if stage < 4, and drops 2 stages if stage >= 4; never drops below 1', () => {
    let rec = createInitialKanaRecord({
      kana: 'あ',
      romaji: 'a',
      row: 'a',
      script: 'hiragana',
      group: 'gojuon',
    })

    // Reach Stage 2
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: 1000 })
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: true, now: 2000 })
    expect(rec.stage).toBe(2)

    // Miss drops 1 stage -> Stage 1
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: false, now: 3000 })
    expect(rec.stage).toBe(1)

    // Miss at Stage 1 never drops below 1
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: false, now: 4000 })
    expect(rec.stage).toBe(1)

    // Simulate high stage record (Stage 4)
    rec.stage = 4
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: false, now: 5000 })
    // Drops 2 stages: 4 -> 2
    expect(rec.stage).toBe(2)

    // Simulate Stage 5
    rec.stage = 5
    rec = recordKanaAttempt({ record: rec, mode: 'kana-to-romaji', correct: false, now: 6000 })
    // Drops 2 stages: 5 -> 3
    expect(rec.stage).toBe(3)
  })

  it('tracks confusions and identifies weak kana (< 70% or 2+ confusions)', () => {
    let rec = createInitialKanaRecord({
      kana: 'ぬ',
      romaji: 'nu',
      row: 'na',
      script: 'hiragana',
      group: 'gojuon',
    })

    // 2 confusions with 'hira:め'
    rec = recordKanaAttempt({
      record: rec,
      mode: 'kana-to-romaji',
      correct: false,
      pickedKanaId: 'hira:め',
      now: 1000,
    })
    rec = recordKanaAttempt({
      record: rec,
      mode: 'kana-to-romaji',
      correct: false,
      pickedKanaId: 'hira:め',
      now: 2000,
    })

    expect(rec.confusions['hira:め']).toBe(2)

    const map: Record<string, KanaMasteryRecord> = { [rec.id]: rec }
    const weakList = weakKana(map)
    expect(weakList.some((k) => k.id === 'hira:ぬ')).toBe(true)
  })

  it('pure memoised selectors compute correct totals without hardcoding', () => {
    const map: Record<string, KanaMasteryRecord> = {}
    for (const k of ALL_KANA) {
      const script = k.kana >= '\u3040' && k.kana <= '\u309f' ? 'hiragana' : 'katakana'
      const id = `${script === 'hiragana' ? 'hira' : 'kata'}:${k.kana}`
      map[id] = createInitialKanaRecord({
        kana: k.kana,
        romaji: k.romaji,
        row: k.row,
        script,
        group: 'gojuon',
      })
    }

    const hiraProg = scriptProgress('hiragana', map, ALL_KANA)
    expect(hiraProg.total).toBe(ALL_HIRAGANA.length)
    expect(hiraProg.knownPct).toBe(0)
    expect(hiraProg.weightedPct).toBe(0)

    // Promote 10 Hiragana to Solid (Stage 3)
    const tenHira = ALL_HIRAGANA.slice(0, 10)
    for (const h of tenHira) {
      const id = `hira:${h.kana}`
      map[id].stage = 3
    }

    const updatedHira = scriptProgress('hiragana', map, ALL_KANA)
    expect(updatedHira.knownCount).toBe(10)
    expect(updatedHira.knownPct).toBe(Math.round((10 / ALL_HIRAGANA.length) * 100))
    expect(updatedHira.weightedPct).toBe(
      Math.round(((10 * 3) / (5 * ALL_HIRAGANA.length)) * 100)
    )
  })
})
