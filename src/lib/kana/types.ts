import type { KanaItem } from '@/data/kana'

export type KanaScript = 'hiragana' | 'katakana'
export type KanaGroup = 'gojuon' | 'dakuten' | 'handakuten' | 'yoon'
export type MasteryStage = 0 | 1 | 2 | 3 | 4 | 5
export type QuizModeType = 'kana-to-romaji' | 'romaji-to-kana' | 'listening' | 'typing'

export interface KanaAttemptLog {
  ts: number
  mode: QuizModeType | 'srs'
  ok: boolean
  ms?: number
  pickedKanaId?: string
}

export interface KanaMasteryRecord {
  id: string              // e.g. "hira:あ", "kata:シ"
  kana: string            // "あ", "シ"
  romaji: string          // "a", "shi"
  script: KanaScript
  group: KanaGroup
  row: string             // "a", "ka", "sa", etc.
  stage: MasteryStage     // 0..5
  stageChangedAt: number  // timestamp
  solidReachedAt?: number // timestamp when Stage 3 was first achieved
  strongReachedAt?: number// timestamp when Stage 4 was achieved
  attempts: number
  correct: number
  streak: number
  lastSeenAt?: number
  last10Attempts: KanaAttemptLog[]
  perModeCounts: {
    recognition: { attempts: number; correct: number } // kana-to-romaji
    reverse: { attempts: number; correct: number }     // romaji-to-kana
    listening: { attempts: number; correct: number }   // listening
    typing: { attempts: number; correct: number }      // typing
  }
  confusions: Record<string, number> // otherKanaId -> count
}

export interface ScriptProgress {
  script: KanaScript
  total: number
  countPerStage: Record<MasteryStage, number>
  knownCount: number      // stage >= 3
  knownPct: number        // 0..100
  masteredCount: number   // stage === 5
  masteredPct: number     // 0..100
  weightedPct: number     // sum(stage) / (5 * total) * 100
}

export interface GroupProgress {
  group: KanaGroup
  total: number
  knownCount: number
  knownPct: number
  masteredCount: number
  masteredPct: number
}

export interface RowProgress {
  row: string
  total: number
  knownCount: number
  knownPct: number
  masteredCount: number
  masteredPct: number
}

export interface BuiltQuizQuestion {
  target: KanaItem
  mode: QuizModeType
  options: string[]
  correctIndex: number
  correctValue: string
  distinctionTip?: string
  newPositionBag: number[]
  newLastPickedSlot?: number
  newSlotStreak?: number
}
