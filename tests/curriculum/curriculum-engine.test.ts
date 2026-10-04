import { describe, it, expect } from 'vitest'
import {
  getUnit0Lessons,
  computeUnitProgress,
  getUnitState,
  getNextCurriculumStep,
  buildPlacementQuiz,
  evaluatePlacementQuiz,
} from '@/lib/curriculum/curriculum-engine'
import type { KanaMasteryRecord } from '@/lib/kana/types'
import { makeKanaId } from '@/lib/kana/mastery-engine'
import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_GOJUON,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  type KanaItem,
} from '@/data/kana'

function createMockRecord(kana: string, script: 'hiragana' | 'katakana', stage: 0 | 1 | 2 | 3 | 4 | 5): KanaMasteryRecord {
  return {
    id: makeKanaId(kana, script),
    kana,
    romaji: 'test',
    script,
    group: 'gojuon',
    row: 'a',
    stage,
    stageChangedAt: Date.now(),
    attempts: 5,
    correct: 5,
    streak: stage,
    last10Attempts: [],
    perModeCounts: {
      recognition: { attempts: 3, correct: 3 },
      reverse: { attempts: 2, correct: 2 },
      listening: { attempts: 0, correct: 0 },
      typing: { attempts: 0, correct: 0 },
    },
    confusions: {},
  }
}

describe('Phase D: Data-Driven Curriculum & Path Sync', () => {
  it('chunks Unit 0 into row-by-row lessons with at most 5 kana each', () => {
    const lessons = getUnit0Lessons()
    expect(lessons.length).toBeGreaterThan(15)

    for (const lesson of lessons) {
      expect(lesson.items.length).toBeGreaterThan(0)
      expect(lesson.items.length).toBeLessThanOrEqual(5)
    }

    // First lesson is Hiragana あ-row
    expect(lessons[0].title).toContain('あ')
    expect(lessons[0].items.map((i) => i.kana)).toEqual(['あ', 'い', 'う', 'え', 'お'])
  })

  it('reports Unit 0 complete ONLY when all Hiragana and Katakana reach at least Familiar (Stage 2)', () => {
    const masteryMap: Record<string, KanaMasteryRecord> = {}
    const lessons = getUnit0Lessons()

    // Initially with 0 mastery: Unit 0 is available, not complete
    let state = getUnitState('unit-0', masteryMap)
    expect(state.status).toBe('available')
    expect(state.isComplete).toBe(false)

    // Mark all Hiragana Familiar, Katakana still New
    for (const row of [...HIRAGANA_GOJUON, ...HIRAGANA_DAKUTEN, ...HIRAGANA_YOON]) {
      for (const item of row.items) {
        if (item) {
          masteryMap[makeKanaId(item.kana, 'hiragana')] = createMockRecord(item.kana, 'hiragana', 2)
        }
      }
    }

    state = getUnitState('unit-0', masteryMap)
    expect(state.status).toBe('in_progress')
    expect(state.isComplete).toBe(false)

    // Now mark all Katakana Familiar as well
    for (const row of [...KATAKANA_GOJUON, ...KATAKANA_DAKUTEN, ...KATAKANA_YOON]) {
      for (const item of row.items) {
        if (item) {
          masteryMap[makeKanaId(item.kana, 'katakana')] = createMockRecord(item.kana, 'katakana', 2)
        }
      }
    }

    state = getUnitState('unit-0', masteryMap)
    expect(state.isComplete).toBe(true)
    expect(state.status).toBe('completed')
  })

  it('gates Unit 1 so it unlocks ONLY when Hiragana Gojūon is >= 80% Solid (Stage 3)', () => {
    const masteryMap: Record<string, KanaMasteryRecord> = {}
    const gojuonItems = HIRAGANA_GOJUON.flatMap((r) => r.items).filter((it): it is KanaItem => Boolean(it))
    const totalGojuon = gojuonItems.length // 46

    // With 0 Solid kana: Unit 1 must be locked
    let state = getUnitState('unit-1', masteryMap)
    expect(state.status).toBe('locked')
    expect(state.lockedReason).toContain('Unlocks when Hiragana is 80% known')
    expect(state.lockedReason).toContain('80% to go')

    // Mark 50% (23 kana) as Solid: still locked
    const half = Math.floor(totalGojuon * 0.5)
    for (let i = 0; i < half; i++) {
      const item = gojuonItems[i]
      masteryMap[makeKanaId(item.kana, 'hiragana')] = createMockRecord(item.kana, 'hiragana', 3)
    }

    state = getUnitState('unit-1', masteryMap)
    expect(state.status).toBe('locked')
    expect(state.lockedReason).toContain('30% to go')

    // Mark up to 80% (>= 37 kana) as Solid: unlocks!
    const target80 = Math.ceil(totalGojuon * 0.8)
    for (let i = 0; i < target80; i++) {
      const item = gojuonItems[i]
      masteryMap[makeKanaId(item.kana, 'hiragana')] = createMockRecord(item.kana, 'hiragana', 3)
    }

    state = getUnitState('unit-1', masteryMap)
    expect(state.status).toBe('available')
    expect(state.lockedReason).toBeUndefined()
  })

  it('correctly provides next curriculum step naming the exact lesson and row', () => {
    const masteryMap: Record<string, KanaMasteryRecord> = {}
    // Empty progress -> Lesson 0.1, あ row
    let nextStep = getNextCurriculumStep(masteryMap)
    expect(nextStep.lessonNumber).toBe('0.1')
    expect(nextStep.title).toContain('あ')

    // Complete あ row -> next is か row
    for (const item of HIRAGANA_GOJUON[0].items) {
      if (item) {
        masteryMap[makeKanaId(item.kana, 'hiragana')] = createMockRecord(item.kana, 'hiragana', 2)
      }
    }
    nextStep = getNextCurriculumStep(masteryMap)
    expect(nextStep.lessonNumber).toBe('0.2')
    expect(nextStep.title).toContain('か')
  })

  it('placement quiz samples 20 kana, and 90%+ pass sets kana to Solid, never Mastered', () => {
    const quiz = buildPlacementQuiz('hiragana')
    expect(quiz.length).toBe(20)

    // Evaluate with 17/20 (85%) -> Fail (< 90%)
    const failAnswers = quiz.map((k, idx) => ({
      kana: k.kana,
      correct: idx < 17,
    }))
    const failResult = evaluatePlacementQuiz('hiragana', failAnswers)
    expect(failResult.passed).toBe(false)
    expect(failResult.accuracy).toBe(85)
    expect(failResult.awardedStage).toBeUndefined()

    // Evaluate with 18/20 (90%) -> Pass!
    const passAnswers = quiz.map((k, idx) => ({
      kana: k.kana,
      correct: idx < 18,
    }))
    const passResult = evaluatePlacementQuiz('hiragana', passAnswers)
    expect(passResult.passed).toBe(true)
    expect(passResult.accuracy).toBe(90)
    expect(passResult.awardedStage).toBe(3) // Solid, NEVER 5 (Mastered)

    // Check generated records
    expect(passResult.recordsToUpdate).toBeDefined()
    for (const rec of Object.values(passResult.recordsToUpdate!)) {
      expect(rec.stage).toBe(3)
      expect(rec.stage).not.toBe(5)
    }
  })
})
