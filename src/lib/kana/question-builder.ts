import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_GOJUON,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  type KanaItem,
} from '@/data/kana'
import { CONFUSION_MNEMONICS } from '@/data/quiz-engine'
import { KANA_CONFUSABLES, SOUND_ALIKE_GROUPS } from './config'
import type { BuiltQuizQuestion, KanaMasteryRecord, QuizModeType } from './types'

const DEFAULT_ALL_KANA: KanaItem[] = [
  ...HIRAGANA_GOJUON,
  ...HIRAGANA_DAKUTEN,
  ...HIRAGANA_YOON,
  ...KATAKANA_GOJUON,
  ...KATAKANA_DAKUTEN,
  ...KATAKANA_YOON,
]
  .flatMap((r) => r.items)
  .filter((it): it is KanaItem => Boolean(it))

/**
 * Standardizes romaji to lowercase without parenthetical notes
 * e.g. "wo (o)" -> "wo", "ji (di)" -> "ji"
 */
export function cleanRomaji(romaji: string): string {
  return romaji.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase()
}

/**
 * Deterministic or random Fisher-Yates in-place shuffle using injected RNG
 */
export function fisherYatesShuffle<T>(array: T[], rng: () => number = Math.random): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

/**
 * Normalizes kana script detection
 */
export function getKanaScript(kana: string): 'hiragana' | 'katakana' {
  return /^[\u3040-\u309f]/.test(kana) ? 'hiragana' : 'katakana'
}

/**
 * Gets canonical ID for a kana item (e.g. "hira:あ", "kata:シ")
 */
export function getKanaId(item: KanaItem): string {
  const script = getKanaScript(item.kana)
  return `${script === 'hiragana' ? 'hira' : 'kata'}:${item.kana}`
}

/**
 * Builds a balanced position bag for an entire quiz session,
 * ensuring equal slot distribution and preventing >2 consecutive repeats.
 */
export function buildBalancedPositionBag(
  sessionLength: number,
  rng: () => number = Math.random
): number[] {
  const fullBags = Math.floor(sessionLength / 4)
  const remainder = sessionLength % 4
  const slots: number[] = []

  for (let i = 0; i < fullBags; i++) {
    slots.push(...fisherYatesShuffle([0, 1, 2, 3], rng))
  }
  if (remainder > 0) {
    const partial = fisherYatesShuffle([0, 1, 2, 3], rng).slice(0, remainder)
    slots.push(...partial)
  }

  // Ensure no slot repeats > 2 times consecutively
  for (let i = 2; i < slots.length; i++) {
    if (slots[i] === slots[i - 1] && slots[i] === slots[i - 2]) {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[j] !== slots[i]) {
          const tmp = slots[i]
          slots[i] = slots[j]
          slots[j] = tmp
          break
        }
      }
    }
  }

  return slots
}

export interface BuildQuestionParams {
  target: KanaItem
  pool: KanaItem[]
  mode: QuizModeType
  allKana?: KanaItem[]
  masteryMap?: Record<string, KanaMasteryRecord>
  positionBag?: number[]
  lastPickedSlot?: number
  slotStreak?: number
  rng?: () => number
}

/**
 * Pure question builder for all multiple-choice kana quiz modes.
 *
 * Guarantees:
 * 1. Injectable RNG for test determinism.
 * 2. Balanced position bag: 4 slots appear equally often across any session,
 *    and no slot repeats more than twice consecutively.
 * 3. Exactly 4 options, even if the pool contains only 1 kana.
 * 4. Distractor priority: confusions -> curated look-alikes -> neighbours -> random script.
 * 5. Script isolation: Hiragana only tests against Hiragana, Katakana against Katakana.
 * 6. No duplicates, and no distractors with identical romaji (e.g. お vs を, じ vs ぢ).
 * 7. If target kana stage < 2 (below Familiar), limits look-alikes to at most 1.
 */
export function buildQuestion({
  target,
  pool,
  mode,
  allKana,
  masteryMap = {},
  positionBag = [],
  lastPickedSlot,
  slotStreak = 0,
  rng = Math.random,
}: BuildQuestionParams): BuiltQuizQuestion {
  const effectiveAllKana = allKana && allKana.length > 0 ? allKana : DEFAULT_ALL_KANA
  const targetScript = getKanaScript(target.kana)
  const targetRomaji = cleanRomaji(target.romaji)
  const targetId = getKanaId(target)
  const targetRecord = masteryMap[targetId]
  const targetStage = targetRecord?.stage ?? 0

  // 1. Determine correct value for display
  const isSoundQuestion = mode === 'kana-to-romaji'
  const correctValue = isSoundQuestion ? targetRomaji : target.kana

  // 2. Select next slot from balanced position bag
  let currentBag = [...positionBag]
  if (currentBag.length === 0) {
    currentBag = fisherYatesShuffle([0, 1, 2, 3], rng)
  }

  let selectedSlot = currentBag[0]
  let chosenBagIndex = 0

  // Check consecutive slot streak constraint: never repeat same slot > 2 times
  if (lastPickedSlot !== undefined && selectedSlot === lastPickedSlot && slotStreak >= 2) {
    // Look for an alternate slot in the bag
    const altIndex = currentBag.findIndex((s) => s !== lastPickedSlot)
    if (altIndex !== -1) {
      selectedSlot = currentBag[altIndex]
      chosenBagIndex = altIndex
    } else {
      // Entire bag has only the repeated slot, generate a fresh bag with a different slot first
      const freshBag = fisherYatesShuffle([0, 1, 2, 3], rng)
      const nonMatchingIdx = freshBag.findIndex((s) => s !== lastPickedSlot)
      selectedSlot = freshBag[nonMatchingIdx]
      currentBag = freshBag
      chosenBagIndex = nonMatchingIdx
    }
  }

  // Remove chosen slot from bag
  currentBag.splice(chosenBagIndex, 1)

  const newLastPickedSlot = selectedSlot
  const newSlotStreak = selectedSlot === lastPickedSlot ? slotStreak + 1 : 1

  // 3. Collect distractors according to strict priority
  const chosenDistractors: KanaItem[] = []
  const usedKanaSet = new Set<string>([target.kana])
  const usedValueCounts = new Set<string>([correctValue.toLowerCase()])

  const scriptConfusables = KANA_CONFUSABLES[targetScript] || {}
  const visualLookAlikes = scriptConfusables[target.kana] || []
  const lookAlikesSet = new Set<string>(visualLookAlikes)

  const soundAlikes = SOUND_ALIKE_GROUPS[targetRomaji] || []
  const soundAlikesSet = new Set<string>(soundAlikes)

  const maxLookAlikesAllowed = targetStage < 2 ? 1 : 3
  let lookAlikesAdded = 0

  // Helper to test if a candidate kana is valid
  function isValidCandidate(candidate: KanaItem): boolean {
    if (usedKanaSet.has(candidate.kana)) return false
    const candScript = getKanaScript(candidate.kana)
    if (candScript !== targetScript) return false

    const candRomaji = cleanRomaji(candidate.romaji)
    // Never allow distractor with identical romaji (e.g. お vs を = o, じ vs ぢ = ji, ず vs づ = zu)
    if (candRomaji === targetRomaji) return false

    const candVal = isSoundQuestion ? candRomaji : candidate.kana
    if (usedValueCounts.has(candVal.toLowerCase())) return false

    // Lookalike cap enforcement across all candidate selection
    const isLookAlike =
      mode === 'listening'
        ? soundAlikesSet.has(candRomaji)
        : lookAlikesSet.has(candidate.kana)

    if (isLookAlike && lookAlikesAdded >= maxLookAlikesAllowed) {
      return false
    }

    return true
  }

  function addCandidate(candidate: KanaItem) {
    chosenDistractors.push(candidate)
    usedKanaSet.add(candidate.kana)
    const val = isSoundQuestion ? cleanRomaji(candidate.romaji) : candidate.kana
    usedValueCounts.add(val.toLowerCase())

    const candRomaji = cleanRomaji(candidate.romaji)
    const isLookAlike =
      mode === 'listening'
        ? soundAlikesSet.has(candRomaji)
        : lookAlikesSet.has(candidate.kana)
    if (isLookAlike) {
      lookAlikesAdded++
    }
  }

  // Priority 1: Learner's recorded confusion kana
  if (targetRecord && targetRecord.confusions) {
    const sortedConfusions = Object.entries(targetRecord.confusions)
      .sort((a, b) => b[1] - a[1])
      .map(([kId]) => kId.split(':')[1]) // extract kana character

    for (const confKana of sortedConfusions) {
      if (chosenDistractors.length >= 3) break
      const match = effectiveAllKana.find((k) => k.kana === confKana)
      if (match && isValidCandidate(match)) {
        addCandidate(match)
      }
    }
  }

  // Priority 2: Curated look-alikes (or sound-alikes for Listening)
  if (mode === 'listening') {
    for (const saRomaji of soundAlikes) {
      if (chosenDistractors.length >= 3) break
      if (lookAlikesAdded >= maxLookAlikesAllowed) break
      const match = effectiveAllKana.find(
        (k) =>
          getKanaScript(k.kana) === targetScript &&
          cleanRomaji(k.romaji) === saRomaji
      )
      if (match && isValidCandidate(match)) {
        addCandidate(match)
      }
    }
  } else {
    for (const laKana of visualLookAlikes) {
      if (chosenDistractors.length >= 3) break
      if (lookAlikesAdded >= maxLookAlikesAllowed) break
      const match = effectiveAllKana.find((k) => k.kana === laKana)
      if (match && isValidCandidate(match)) {
        addCandidate(match)
      }
    }
  }

  // Priority 3: Same-row or same-column neighbours from pool or effectiveAllKana
  const sameRowCandidates = effectiveAllKana.filter(
    (k) =>
      getKanaScript(k.kana) === targetScript &&
      k.row === target.row &&
      isValidCandidate(k)
  )
  for (const neighbour of fisherYatesShuffle(sameRowCandidates, rng)) {
    if (chosenDistractors.length >= 3) break
    addCandidate(neighbour)
  }

  // Priority 4: Items from selected pool
  for (const poolItem of fisherYatesShuffle(pool, rng)) {
    if (chosenDistractors.length >= 3) break
    if (isValidCandidate(poolItem)) {
      addCandidate(poolItem)
    }
  }

  // Priority 5: Fallback random items from entire script pool
  const scriptCandidates = effectiveAllKana.filter(
    (k) => getKanaScript(k.kana) === targetScript && isValidCandidate(k)
  )
  for (const scriptItem of fisherYatesShuffle(scriptCandidates, rng)) {
    if (chosenDistractors.length >= 3) break
    addCandidate(scriptItem)
  }

  // 4. Construct the 4 options placed into the designated slot
  const distractorValues = chosenDistractors
    .slice(0, 3)
    .map((d) => (isSoundQuestion ? cleanRomaji(d.romaji) : d.kana))

  const finalOptions: string[] = []
  let distractorIdx = 0
  for (let slot = 0; slot < 4; slot++) {
    if (slot === selectedSlot) {
      finalOptions.push(correctValue)
    } else {
      finalOptions.push(distractorValues[distractorIdx] || '')
      distractorIdx++
    }
  }

  const distinctionTip =
    CONFUSION_MNEMONICS[target.kana] ||
    (target.example ? `Example: ${target.example}` : undefined)

  return {
    target,
    mode,
    options: finalOptions,
    correctIndex: selectedSlot,
    correctValue,
    distinctionTip,
    newPositionBag: currentBag,
    newLastPickedSlot,
    newSlotStreak,
  }
}
