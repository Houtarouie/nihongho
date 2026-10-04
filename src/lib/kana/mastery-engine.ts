import type { KanaItem } from '@/data/kana'
import { KANA_CONFIG } from './config'
import type {
  GroupProgress,
  KanaGroup,
  KanaMasteryRecord,
  KanaScript,
  MasteryStage,
  QuizModeType,
  RowProgress,
  ScriptProgress,
} from './types'

/**
 * Returns formatted 'YYYY-MM-DD' calendar date in given or local timezone
 */
export function getLocalCalendarDate(timestamp: number, timeZone?: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date(timestamp))
  } catch {
    return new Date(timestamp).toISOString().split('T')[0]
  }
}

/**
 * Difference in local calendar days between two timestamps
 */
export function getCalendarDayDiff(
  fromTs: number,
  toTs: number,
  timeZone?: string
): number {
  const d1Str = getLocalCalendarDate(fromTs, timeZone)
  const d2Str = getLocalCalendarDate(toTs, timeZone)

  const d1 = new Date(`${d1Str}T00:00:00Z`).getTime()
  const d2 = new Date(`${d2Str}T00:00:00Z`).getTime()

  return Math.round((d2 - d1) / (24 * 60 * 60 * 1000))
}

/**
 * Determines Kana script (hiragana or katakana)
 */
export function detectKanaScript(kana: string): KanaScript {
  return /^[\u3040-\u309f]/.test(kana) ? 'hiragana' : 'katakana'
}

/**
 * Creates canonical record ID (e.g. "hira:あ", "kata:シ")
 */
export function makeKanaId(kana: string, script?: KanaScript): string {
  const s = script || detectKanaScript(kana)
  return `${s === 'hiragana' ? 'hira' : 'kata'}:${kana}`
}

/**
 * Creates a default Stage 0 (New) record for a kana character
 */
export function createInitialKanaRecord(params: {
  kana: string
  romaji: string
  row: string
  script: KanaScript
  group: KanaGroup
}): KanaMasteryRecord {
  return {
    id: makeKanaId(params.kana, params.script),
    kana: params.kana,
    romaji: params.romaji,
    script: params.script,
    group: params.group,
    row: params.row,
    stage: 0,
    stageChangedAt: 0,
    attempts: 0,
    correct: 0,
    streak: 0,
    last10Attempts: [],
    perModeCounts: {
      recognition: { attempts: 0, correct: 0 },
      reverse: { attempts: 0, correct: 0 },
      listening: { attempts: 0, correct: 0 },
      typing: { attempts: 0, correct: 0 },
    },
    confusions: {},
  }
}

export interface RecordAttemptParams {
  record: KanaMasteryRecord
  mode: QuizModeType | 'srs'
  correct: boolean
  responseMs?: number
  source?: string
  pickedKanaId?: string
  now?: number
  timeZone?: string
}

/**
 * The SINGLE authoritative pure function that updates kana knowledge.
 *
 * Stage Ladder:
 * 0 New: never seen
 * 1 Learning: seen once (lesson or quiz)
 * 2 Familiar: 2 consecutive correct in recognition mode
 * 3 Solid: correct in at least one other mode (reverse, listening, typing) -> "Known"
 * 4 Strong: correct again >= 1 local calendar day after reaching Solid
 * 5 Mastered: correct again >= 7 local calendar days after reaching Strong with >= 90% accuracy over last 10 attempts
 *
 * Miss Penalty:
 * Drops 1 stage (drops 2 stages if stage >= 4), never below Stage 1.
 * Maximum one promotion per attempt.
 */
export function recordKanaAttempt({
  record,
  mode,
  correct,
  responseMs,
  pickedKanaId,
  now = Date.now(),
  timeZone,
}: RecordAttemptParams): KanaMasteryRecord {
  const updated: KanaMasteryRecord = {
    ...record,
    attempts: record.attempts + 1,
    correct: correct ? record.correct + 1 : record.correct,
    streak: correct ? record.streak + 1 : 0,
    lastSeenAt: now,
    confusions: { ...record.confusions },
    perModeCounts: {
      recognition: { ...record.perModeCounts.recognition },
      reverse: { ...record.perModeCounts.reverse },
      listening: { ...record.perModeCounts.listening },
      typing: { ...record.perModeCounts.typing },
    },
  }

  // Update mode-specific counts
  if (mode === 'kana-to-romaji' || mode === 'srs') {
    updated.perModeCounts.recognition.attempts += 1
    if (correct) updated.perModeCounts.recognition.correct += 1
  } else if (mode === 'romaji-to-kana') {
    updated.perModeCounts.reverse.attempts += 1
    if (correct) updated.perModeCounts.reverse.correct += 1
  } else if (mode === 'listening') {
    updated.perModeCounts.listening.attempts += 1
    if (correct) updated.perModeCounts.listening.correct += 1
  } else if (mode === 'typing') {
    updated.perModeCounts.typing.attempts += 1
    if (correct) updated.perModeCounts.typing.correct += 1
  }

  // Record attempt in last 10 attempts
  const newAttempt = {
    ts: now,
    mode,
    ok: correct,
    ms: responseMs,
    pickedKanaId,
  }
  updated.last10Attempts = [...record.last10Attempts.slice(-9), newAttempt]

  // Track confusion if wrong answer picked an existing distinct kana
  if (!correct && pickedKanaId && pickedKanaId !== record.id) {
    updated.confusions[pickedKanaId] = (updated.confusions[pickedKanaId] || 0) + 1
  }

  // Evaluate Stage Transitions
  const prevStage = record.stage

  if (!correct) {
    // Miss penalty: drop 1 (or 2 if stage >= 4), floor is 1
    let newStage: MasteryStage = prevStage
    if (prevStage >= 4) {
      newStage = Math.max(KANA_CONFIG.MISS_PENALTY.FLOOR_STAGE, prevStage - 2) as MasteryStage
    } else if (prevStage > 1) {
      newStage = Math.max(KANA_CONFIG.MISS_PENALTY.FLOOR_STAGE, prevStage - 1) as MasteryStage
    } else {
      newStage = Math.max(KANA_CONFIG.MISS_PENALTY.FLOOR_STAGE, prevStage) as MasteryStage
    }

    if (newStage !== prevStage) {
      updated.stage = newStage
      updated.stageChangedAt = now
    }
    return updated
  }

  // Promotion ladder (Maximum ONE promotion per attempt)
  if (prevStage === 0) {
    // 0 -> 1 (Seen once)
    updated.stage = 1
    updated.stageChangedAt = now
  } else if (prevStage === 1) {
    // 1 -> 2 (2 correct in a row in recognition)
    const isRecognition = mode === 'kana-to-romaji' || mode === 'srs'
    if (isRecognition && updated.streak >= 2) {
      updated.stage = 2
      updated.stageChangedAt = now
    }
  } else if (prevStage === 2) {
    // 2 -> 3 (Correct in another mode: reverse, listening, typing)
    const otherModeCorrect =
      (mode === 'romaji-to-kana' && correct) ||
      (mode === 'listening' && correct) ||
      (mode === 'typing' && correct) ||
      updated.perModeCounts.reverse.correct >= 1 ||
      updated.perModeCounts.listening.correct >= 1 ||
      updated.perModeCounts.typing.correct >= 1

    if (otherModeCorrect) {
      updated.stage = 3
      updated.stageChangedAt = now
      if (!updated.solidReachedAt) {
        updated.solidReachedAt = now
      }
    }
  } else if (prevStage === 3) {
    // 3 -> 4 (Correct again >= 1 local calendar day after reaching Solid)
    const solidBaseTs = updated.solidReachedAt || updated.stageChangedAt
    const daysSinceSolid = getCalendarDayDiff(solidBaseTs, now, timeZone)
    if (daysSinceSolid >= 1) {
      updated.stage = 4
      updated.stageChangedAt = now
      if (!updated.strongReachedAt) {
        updated.strongReachedAt = now
      }
    }
  } else if (prevStage === 4) {
    // 4 -> 5 (Correct again >= 7 local calendar days after reaching Strong with >= 90% accuracy over last 10)
    const strongBaseTs = updated.strongReachedAt || updated.stageChangedAt
    const daysSinceStrong = getCalendarDayDiff(strongBaseTs, now, timeZone)

    if (daysSinceStrong >= 7) {
      const recentAttempts = updated.last10Attempts
      const recentCorrect = recentAttempts.filter((a) => a.ok).length
      const accuracy = recentAttempts.length > 0 ? recentCorrect / recentAttempts.length : 1.0

      if (accuracy >= 0.90) {
        updated.stage = 5
        updated.stageChangedAt = now
      }
    }
  }

  return updated
}

/**
 * Pure Selectors (Memoizable)
 */

export function kanaStage(
  id: string,
  masteryMap: Record<string, KanaMasteryRecord>
): MasteryStage {
  return masteryMap[id]?.stage ?? 0
}

export function scriptProgress(
  script: KanaScript,
  masteryMap: Record<string, KanaMasteryRecord>,
  allKana: KanaItem[]
): ScriptProgress {
  const scriptKana = allKana.filter((k) => detectKanaScript(k.kana) === script)
  const total = scriptKana.length

  const countPerStage: Record<MasteryStage, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let knownCount = 0
  let masteredCount = 0
  let stageSum = 0

  for (const k of scriptKana) {
    const id = makeKanaId(k.kana, script)
    const stage = masteryMap[id]?.stage ?? 0
    countPerStage[stage] = (countPerStage[stage] || 0) + 1
    stageSum += stage
    if (stage >= 3) knownCount++
    if (stage === 5) masteredCount++
  }

  const knownPct = total > 0 ? Math.round((knownCount / total) * 100) : 0
  const masteredPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0
  const weightedPct = total > 0 ? Math.round((stageSum / (5 * total)) * 100) : 0

  return {
    script,
    total,
    countPerStage,
    knownCount,
    knownPct,
    masteredCount,
    masteredPct,
    weightedPct,
  }
}

export function groupProgress(
  script: KanaScript,
  group: KanaGroup,
  masteryMap: Record<string, KanaMasteryRecord>,
  allKana: KanaItem[]
): GroupProgress {
  const groupKana = allKana.filter((k) => {
    const s = detectKanaScript(k.kana)
    if (s !== script) return false
    const rec = masteryMap[makeKanaId(k.kana, s)]
    return rec ? rec.group === group : true
  })

  const total = groupKana.length
  let knownCount = 0
  let masteredCount = 0

  for (const k of groupKana) {
    const id = makeKanaId(k.kana, script)
    const stage = masteryMap[id]?.stage ?? 0
    if (stage >= 3) knownCount++
    if (stage === 5) masteredCount++
  }

  const knownPct = total > 0 ? Math.round((knownCount / total) * 100) : 0
  const masteredPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0

  return {
    group,
    total,
    knownCount,
    knownPct,
    masteredCount,
    masteredPct,
  }
}

export function rowProgress(
  script: KanaScript,
  row: string,
  masteryMap: Record<string, KanaMasteryRecord>,
  allKana: KanaItem[]
): RowProgress {
  const rowKana = allKana.filter(
    (k) => detectKanaScript(k.kana) === script && k.row === row
  )
  const total = rowKana.length
  let knownCount = 0
  let masteredCount = 0

  for (const k of rowKana) {
    const id = makeKanaId(k.kana, script)
    const stage = masteryMap[id]?.stage ?? 0
    if (stage >= 3) knownCount++
    if (stage === 5) masteredCount++
  }

  const knownPct = total > 0 ? Math.round((knownCount / total) * 100) : 0
  const masteredPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0

  return {
    row,
    total,
    knownCount,
    knownPct,
    masteredCount,
    masteredPct,
  }
}

/**
 * Returns weak kana:
 * - Accuracy < 70% over last 5 attempts with at least 3 attempts, OR
 * - Confusion count of 2+ on any other character.
 */
export function weakKana(
  masteryMap: Record<string, KanaMasteryRecord>
): KanaMasteryRecord[] {
  const results: KanaMasteryRecord[] = []

  for (const record of Object.values(masteryMap)) {
    // 1. Confusion count check (>= 2)
    const maxConfusion = Math.max(0, ...Object.values(record.confusions || {}))
    if (maxConfusion >= KANA_CONFIG.SELECTOR_WINDOWS.WEAK_KANA_CONFUSION_COUNT) {
      results.push(record)
      continue
    }

    // 2. Recent 5 attempts accuracy check
    const recent5 = (record.last10Attempts || []).slice(-5)
    if (recent5.length >= KANA_CONFIG.SELECTOR_WINDOWS.WEAK_KANA_MIN_ATTEMPTS) {
      const correctCount = recent5.filter((a) => a.ok).length
      const accuracy = correctCount / recent5.length
      if (accuracy < KANA_CONFIG.SELECTOR_WINDOWS.WEAK_KANA_MAX_ACCURACY) {
        results.push(record)
      }
    }
  }

  return results
}
