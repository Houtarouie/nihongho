/**
 * Central Japanese Learning Application Configuration
 *
 * All thresholds, stage requirements, curriculum unlock criteria,
 * and scheduler defaults live in this file.
 */

export const KANA_CONFIG = {
  // Mastery Stage Ladder (0 - 5)
  STAGES: {
    NEW: 0,        // Never seen
    LEARNING: 1,   // Seen at least once (lesson or quiz)
    FAMILIAR: 2,   // 2 correct in a row in recognition (kana -> sound)
    SOLID: 3,      // Correct in at least one other mode (reverse, listening, typing) -> "Known"
    STRONG: 4,     // Correct again at least 1 local calendar day after reaching Solid
    MASTERED: 5,   // Correct again at least 7 local calendar days after reaching Strong with >= 90% accuracy over last 10 attempts
  },

  // Demotion penalties upon incorrect response
  MISS_PENALTY: {
    DROP_BELOW_STAGE_4: 1, // Drop 1 stage if current stage is < 4
    DROP_STAGE_4_PLUS: 2,  // Drop 2 stages if current stage is 4 or 5
    FLOOR_STAGE: 1,        // Never drop below Stage 1 once seen
  },

  // Curriculum unlocking and lesson sizing
  CURRICULUM: {
    MAX_KANA_PER_LESSON: 5,               // Maximum 5 new kana per lesson in Unit 0
    LESSON_COMPLETE_MIN_STAGE: 2,         // All kana in a lesson must reach Familiar (Stage 2) for completion
    UNIT_1_UNLOCK_HIRAGANA_RATIO: 0.80,   // Unit 1 unlocks when 80% of Hiragana Gojūon is at Solid (Stage 3) or above
    PLACEMENT_QUIZ_SIZE: 20,              // 20 questions for test-out placement
    PLACEMENT_PASS_RATIO: 0.90,           // 90%+ accuracy required to test out
    PLACEMENT_AWARD_STAGE: 3,             // Test-out sets kana to Solid (Stage 3), never Mastered
  },

  // Daily session planner and safety limits
  DAILY_PLANNER: {
    DEFAULT_NEW_KANA_PER_DAY: 10,
    DEFAULT_NEW_VOCAB_PER_DAY: 10,
    BACKLOG_PAUSE_THRESHOLD: 30,          // Pause new cards if pending review backlog exceeds 30
    ACCURACY_PAUSE_THRESHOLD: 0.70,       // Pause new cards if last session accuracy is under 70%
    INTERLEAVE_RATIO: 3,                  // Interleave roughly 1 new card per 2-3 reviews
    FALLBACK_AVG_SECS_KANA: 8,            // Default seconds per kana card for study time estimate
    FALLBACK_AVG_SECS_VOCAB: 15,          // Default seconds per vocab card for study time estimate
  },

  // Selectors calculation windows
  SELECTOR_WINDOWS: {
    RECENT_ACCURACY_WINDOW: 10,           // Last 10 attempts for Mastered accuracy check
    WEAK_KANA_WINDOW: 5,                  // Last 5 attempts for weak kana detection
    WEAK_KANA_MIN_ATTEMPTS: 3,            // Minimum 3 attempts to evaluate weak kana
    WEAK_KANA_MAX_ACCURACY: 0.70,         // Under 70% accuracy qualifies as weak
    WEAK_KANA_CONFUSION_COUNT: 2,         // 2 or more confusions qualifies as weak
  },
} as const

/**
 * Curated Look-Alikes & Confusion Sets
 * Seeded visual and acoustic confusables for smart distractor selection
 */
export const KANA_CONFUSABLES: {
  hiragana: Record<string, string[]>
  katakana: Record<string, string[]>
} = {
  hiragana: {
    ぬ: ['め', 'ね', 'あ'],
    め: ['ぬ', 'あ', 'の'],
    ね: ['れ', 'わ', 'ぬ'],
    れ: ['ね', 'わ', 'い'],
    わ: ['ね', 'れ', 'ち'],
    は: ['ほ', 'ま', 'よ'],
    ほ: ['は', 'ま', 'よ'],
    ま: ['は', 'ほ', 'よ'],
    る: ['ろ', 'そ', 'う'],
    ろ: ['る', 'そ', 'ら'],
    さ: ['ち', 'き', 'ら'],
    ち: ['さ', 'ら', 'ろ'],
    き: ['さ', 'ま', 'も'],
    い: ['り', 'こ', 'け'],
    り: ['い', 'け', 'に'],
    あ: ['お', 'め', 'ぬ'],
    お: ['あ', 'す', 'む'],
    こ: ['に', 'い', 'た'],
    に: ['こ', 'た', 'り'],
    た: ['な', 'こ', 'に'],
    な: ['た', 'む', 'ぬ'],
  },
  katakana: {
    シ: ['ツ', 'ン', 'ソ', 'ミ'],
    ツ: ['シ', 'ソ', 'ン', 'ミ'],
    ソ: ['ン', 'シ', 'ツ', 'ノ'],
    ン: ['ソ', 'シ', 'ツ', 'ノ'],
    ク: ['ケ', 'タ', 'ワ', 'フ'],
    ケ: ['ク', 'タ', 'チ', 'ワ'],
    タ: ['ク', 'ケ', 'ヌ', 'チ'],
    ノ: ['メ', 'ナ', 'ソ', 'ン'],
    メ: ['ノ', 'ナ', 'ヌ', 'ア'],
    ナ: ['ノ', 'メ', 'チ', 'テ'],
    ヌ: ['ス', 'フ', 'タ', 'メ'],
    ス: ['ヌ', 'マ', 'フ', 'ラ'],
    ア: ['マ', 'ヤ', 'ム'],
    マ: ['ア', 'ム', 'ヤ'],
    ウ: ['ワ', 'フ', 'ラ'],
    ワ: ['ウ', 'フ', 'ク'],
    フ: ['ワ', 'ウ', 'ヌ'],
    コ: ['ユ', 'ヨ', 'ロ'],
    ユ: ['コ', 'ヨ', 'エ'],
    チ: ['テ', 'ナ', 'ラ'],
    テ: ['チ', 'ラ', 'ナ'],
  },
}

/**
 * Phonetic distinction / auditory sound-alikes for Listening mode
 */
export const SOUND_ALIKE_GROUPS: Record<string, string[]> = {
  // Similar vowels or consonants
  a: ['o', 'u'],
  o: ['a', 'u'],
  u: ['o', 'a'],
  i: ['e'],
  e: ['i'],
  shi: ['chi', 'tsu', 'si'],
  chi: ['shi', 'tsu', 'ti'],
  tsu: ['su', 'chu', 'chi'],
  su: ['tsu', 'shi'],
  sa: ['ta', 'ha'],
  ta: ['sa', 'da'],
  na: ['ma', 'ha'],
  ha: ['ba', 'pa', 'wa'],
  ba: ['ha', 'pa', 'da'],
  pa: ['ba', 'ha'],
}

/**
 * Common alternate romanization representations accepted in typing mode
 */
export const ROMAJI_ALTERNATES: Record<string, string[]> = {
  shi: ['si'],
  si: ['shi'],
  tsu: ['tu'],
  tu: ['tsu'],
  chi: ['ti'],
  ti: ['chi'],
  fu: ['hu'],
  hu: ['fu'],
  ji: ['zi'],
  zi: ['ji'],
  zu: ['du'],
  du: ['zu'],
  wo: ['o'],
  o: ['wo'],
}
