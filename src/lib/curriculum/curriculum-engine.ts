import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_GOJUON,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  type KanaItem,
  type KanaRow,
} from '@/data/kana'
import { KANA_CONFIG } from '@/lib/kana/config'
import type { KanaMasteryRecord, KanaScript, MasteryStage } from '@/lib/kana/types'
import { makeKanaId, detectKanaScript } from '@/lib/kana/mastery-engine'
import { fisherYatesShuffle } from '@/lib/kana/question-builder'

export interface Unit0Lesson {
  id: string
  lessonNumber: string
  title: string
  script: KanaScript
  rowName: string
  items: KanaItem[]
  keyPoints: string[]
  type: 'kana'
}

export type UnitStatus = 'locked' | 'available' | 'in_progress' | 'completed'

export interface UnitStateResult {
  unitId: string
  unitNumber: number
  title: string
  status: UnitStatus
  isComplete: boolean
  progressPct: number
  lockedReason?: string
}

export interface NextStepResult {
  unitId: string
  lessonNumber: string
  title: string
  items: KanaItem[]
  rowName: string
}

let _cachedUnit0Lessons: Unit0Lesson[] | null = null

/**
 * Builds dynamically chunked row-by-row Unit 0 lessons (<= 5 kana each)
 */
export function getUnit0Lessons(): Unit0Lesson[] {
  if (_cachedUnit0Lessons) return _cachedUnit0Lessons

  const lessons: Unit0Lesson[] = []
  let lessonCounter = 1

  function addRowsToLessons(rows: KanaRow[], script: KanaScript) {
    for (const r of rows) {
      const validItems = r.items.filter((it): it is KanaItem => Boolean(it))
      if (validItems.length === 0) continue

      // Chunk into at most MAX_KANA_PER_LESSON (5)
      const maxPerLesson = KANA_CONFIG.CURRICULUM.MAX_KANA_PER_LESSON
      for (let i = 0; i < validItems.length; i += maxPerLesson) {
        const chunk = validItems.slice(i, i + maxPerLesson)
        const subIndexStr = validItems.length > maxPerLesson ? ` (Part ${Math.floor(i / maxPerLesson) + 1})` : ''
        const scriptName = script === 'hiragana' ? 'Hiragana' : 'Katakana'
        const charsPreview = chunk.map((c) => c.kana).join('・')

        lessons.push({
          id: `unit-0-${script}-${r.rowName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(i / maxPerLesson)}`,
          lessonNumber: `0.${lessonCounter++}`,
          title: `${scriptName} ${r.rowName}${subIndexStr} (${charsPreview})`,
          script,
          rowName: r.rowName,
          items: chunk,
          keyPoints: chunk.map((c) => `${c.kana} (${c.romaji})${c.example ? ` — ${c.example}` : ''}`),
          type: 'kana',
        })
      }
    }
  }

  // 1. Hiragana Gojūon -> Dakuten -> Yōon
  addRowsToLessons(HIRAGANA_GOJUON, 'hiragana')
  addRowsToLessons(HIRAGANA_DAKUTEN, 'hiragana')
  addRowsToLessons(HIRAGANA_YOON, 'hiragana')

  // 2. Katakana Gojūon -> Dakuten -> Yōon
  addRowsToLessons(KATAKANA_GOJUON, 'katakana')
  addRowsToLessons(KATAKANA_DAKUTEN, 'katakana')
  addRowsToLessons(KATAKANA_YOON, 'katakana')

  _cachedUnit0Lessons = lessons
  return lessons
}

/**
 * Checks whether a single lesson is complete (all kana stage >= 2 Familiar)
 */
export function isLessonComplete(
  lesson: Unit0Lesson,
  masteryMap: Record<string, KanaMasteryRecord>
): boolean {
  const minStage = KANA_CONFIG.CURRICULUM.LESSON_COMPLETE_MIN_STAGE // 2
  return lesson.items.every((it) => {
    const id = makeKanaId(it.kana, lesson.script)
    const rec = masteryMap[id]
    return (rec?.stage ?? 0) >= minStage
  })
}

/**
 * Calculates progress and status of Unit 0
 */
export function getUnit0State(masteryMap: Record<string, KanaMasteryRecord>): UnitStateResult {
  const lessons = getUnit0Lessons()
  const allUnit0Kana = lessons.flatMap((l) => l.items)
  const total = allUnit0Kana.length

  let familiarCount = 0
  let anyAttempted = false

  for (const it of allUnit0Kana) {
    const s = detectKanaScript(it.kana)
    const rec = masteryMap[makeKanaId(it.kana, s)]
    const stage = rec?.stage ?? 0
    if (stage >= 2) familiarCount++
    if (stage >= 1 || (rec?.attempts ?? 0) > 0) anyAttempted = true
  }

  const isComplete = total > 0 && familiarCount === total
  const progressPct = total > 0 ? Math.round((familiarCount / total) * 100) : 0
  const status: UnitStatus = isComplete
    ? 'completed'
    : anyAttempted
    ? 'in_progress'
    : 'available'

  return {
    unitId: 'unit-0',
    unitNumber: 0,
    title: 'Unit 0: Kana Foundations',
    status,
    isComplete,
    progressPct,
  }
}

/**
 * Calculates progress and status of Unit 1
 * Gated by 80% of Hiragana Gojūon at Solid (Stage 3) or above
 */
export function getUnit1State(
  masteryMap: Record<string, KanaMasteryRecord>,
  completedLessons?: Set<string>
): UnitStateResult {
  const gojuonItems = HIRAGANA_GOJUON.flatMap((r) => r.items).filter((it): it is KanaItem => Boolean(it))
  const totalGojuon = gojuonItems.length

  let solidCount = 0
  for (const it of gojuonItems) {
    const id = makeKanaId(it.kana, 'hiragana')
    const stage = masteryMap[id]?.stage ?? 0
    if (stage >= 3) solidCount++
  }

  const solidRatio = totalGojuon > 0 ? solidCount / totalGojuon : 0
  const targetRatio = KANA_CONFIG.CURRICULUM.UNIT_1_UNLOCK_HIRAGANA_RATIO // 0.80

  if (solidRatio < targetRatio) {
    const missingPct = Math.round((targetRatio - solidRatio) * 100)
    return {
      unitId: 'unit-1',
      unitNumber: 1,
      title: 'Unit 1: Core Particles & Sentences',
      status: 'locked',
      isComplete: false,
      progressPct: Math.round((solidRatio / targetRatio) * 100),
      lockedReason: `Unlocks when Hiragana is 80% known, ${missingPct}% to go`,
    }
  }

  // Once unlocked, calculate completion from completedLessons if provided
  const unit1LessonIds = ['grammar-1-1', 'grammar-1-2', 'grammar-1-3', 'grammar-1-4', 'grammar-1-5']
  const doneCount = unit1LessonIds.filter((id) => completedLessons?.has(id)).length
  const isComplete = doneCount === unit1LessonIds.length
  const progressPct = Math.round((doneCount / unit1LessonIds.length) * 100)

  return {
    unitId: 'unit-1',
    unitNumber: 1,
    title: 'Unit 1: Core Particles & Sentences',
    status: isComplete ? 'completed' : doneCount > 0 ? 'in_progress' : 'available',
    isComplete,
    progressPct,
  }
}

/**
 * Generic selector for any unit state
 */
export function getUnitState(
  unitId: string,
  masteryMap: Record<string, KanaMasteryRecord>,
  completedLessons?: Set<string>
): UnitStateResult {
  if (unitId === 'unit-0') {
    return getUnit0State(masteryMap)
  }
  if (unitId === 'unit-1') {
    return getUnit1State(masteryMap, completedLessons)
  }

  // Units 2-8 default progressive gating based on previous unit completion
  const u1 = getUnit1State(masteryMap, completedLessons)
  if (!u1.isComplete) {
    return {
      unitId,
      unitNumber: parseInt(unitId.replace('unit-', ''), 10) || 2,
      title: `Unit ${unitId.replace('unit-', '')}`,
      status: 'locked',
      isComplete: false,
      progressPct: 0,
      lockedReason: 'Complete Unit 1 to unlock',
    }
  }

  return {
    unitId,
    unitNumber: parseInt(unitId.replace('unit-', ''), 10) || 2,
    title: `Unit ${unitId.replace('unit-', '')}`,
    status: 'available',
    isComplete: false,
    progressPct: 0,
  }
}

/**
 * Determines next active step in the curriculum path
 */
export function getNextCurriculumStep(
  masteryMap: Record<string, KanaMasteryRecord>
): NextStepResult {
  const lessons = getUnit0Lessons()
  for (const lesson of lessons) {
    if (!isLessonComplete(lesson, masteryMap)) {
      return {
        unitId: 'unit-0',
        lessonNumber: lesson.lessonNumber,
        title: lesson.title,
        items: lesson.items,
        rowName: lesson.rowName,
      }
    }
  }

  // All Unit 0 completed -> Move to Unit 1
  return {
    unitId: 'unit-1',
    lessonNumber: '1.1',
    title: 'Greetings & Self-Introductions',
    items: [],
    rowName: 'grammar',
  }
}

/**
 * Helper to compute progress percentage for a unit
 */
export function computeUnitProgress(
  unitId: string,
  masteryMap: Record<string, KanaMasteryRecord>
): number {
  return getUnitState(unitId, masteryMap).progressPct
}

/**
 * Builds placement quiz for test-out (samples 20 kana across Gojūon, Dakuten, Yōon)
 */
export function buildPlacementQuiz(
  script: KanaScript,
  rng?: () => number
): KanaItem[] {
  const gojuonRows = script === 'hiragana' ? HIRAGANA_GOJUON : KATAKANA_GOJUON
  const dakutenRows = script === 'hiragana' ? HIRAGANA_DAKUTEN : KATAKANA_DAKUTEN
  const yoonRows = script === 'hiragana' ? HIRAGANA_YOON : KATAKANA_YOON

  const gojuon = gojuonRows.flatMap((r) => r.items).filter((it): it is KanaItem => Boolean(it))
  const dakuten = dakutenRows.flatMap((r) => r.items).filter((it): it is KanaItem => Boolean(it))
  const yoon = yoonRows.flatMap((r) => r.items).filter((it): it is KanaItem => Boolean(it))

  const sampleGojuon = fisherYatesShuffle(gojuon, rng).slice(0, 10)
  const sampleDakuten = fisherYatesShuffle(dakuten, rng).slice(0, 5)
  const sampleYoon = fisherYatesShuffle(yoon, rng).slice(0, 5)

  return fisherYatesShuffle([...sampleGojuon, ...sampleDakuten, ...sampleYoon], rng)
}

/**
 * Evaluates placement quiz: 90%+ passes and sets script's kana to Solid (Stage 3), NEVER Mastered (5)
 */
export function evaluatePlacementQuiz(
  script: KanaScript,
  results: { kana: string; correct: boolean }[],
  now: number = Date.now()
): {
  passed: boolean
  accuracy: number
  score: number
  total: number
  awardedStage?: MasteryStage
  recordsToUpdate?: Record<string, KanaMasteryRecord>
} {
  const total = results.length
  const score = results.filter((r) => r.correct).length
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
  const passThreshold = Math.round(KANA_CONFIG.CURRICULUM.PLACEMENT_PASS_RATIO * 100) // 90%

  if (accuracy < passThreshold) {
    return {
      passed: false,
      accuracy,
      score,
      total,
    }
  }

  // Passed: Generate Solid (Stage 3) records for ALL kana of this script
  const rows =
    script === 'hiragana'
      ? [...HIRAGANA_GOJUON, ...HIRAGANA_DAKUTEN, ...HIRAGANA_YOON]
      : [...KATAKANA_GOJUON, ...KATAKANA_DAKUTEN, ...KATAKANA_YOON]

  const recordsToUpdate: Record<string, KanaMasteryRecord> = {}
  const awardedStage = KANA_CONFIG.CURRICULUM.PLACEMENT_AWARD_STAGE as MasteryStage // 3 (Solid)

  for (const r of rows) {
    for (const item of r.items) {
      if (!item) continue
      const id = makeKanaId(item.kana, script)
      recordsToUpdate[id] = {
        id,
        kana: item.kana,
        romaji: item.romaji,
        script,
        group: 'gojuon',
        row: item.row,
        stage: awardedStage, // Stage 3 Solid, NEVER 5 (Mastered)
        stageChangedAt: now,
        solidReachedAt: now,
        attempts: 1,
        correct: 1,
        streak: 1,
        lastSeenAt: now,
        last10Attempts: [{ ts: now, mode: 'kana-to-romaji', ok: true, ms: 500 }],
        perModeCounts: {
          recognition: { attempts: 1, correct: 1 },
          reverse: { attempts: 0, correct: 0 },
          listening: { attempts: 0, correct: 0 },
          typing: { attempts: 0, correct: 0 },
        },
        confusions: {},
      }
    }
  }

  return {
    passed: true,
    accuracy,
    score,
    total,
    awardedStage,
    recordsToUpdate,
  }
}
