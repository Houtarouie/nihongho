export type CardCategory = 'vocabulary' | 'kanji' | 'kana' | 'grammar'
export type CardRating = 'again' | 'hard' | 'good' | 'easy'

export interface SRSCard {
  id: string
  front: string
  reading: string
  meaning: string
  category: CardCategory
  jlptLevel: string
  exampleSentence?: string
  exampleTranslation?: string
  // SM-2 state
  interval: number // in days (0 = intraday learning)
  repetition: number
  efactor: number
  dueDate: number // timestamp (ms)
  status: 'new' | 'learning' | 'review' | 'mastered'
}

export const DEFAULT_SRS_CARDS: Omit<SRSCard, 'interval' | 'repetition' | 'efactor' | 'dueDate' | 'status'>[] = [
  // Vocabulary
  {
    id: 'vocab-1',
    front: '食べる',
    reading: 'たべる (taberu)',
    meaning: 'to eat',
    category: 'vocabulary',
    jlptLevel: 'N5',
    exampleSentence: 'まいにち 朝ごはんを 食べる。',
    exampleTranslation: 'I eat breakfast every day.',
  },
  {
    id: 'vocab-2',
    front: '飲む',
    reading: 'のむ (nomu)',
    meaning: 'to drink',
    category: 'vocabulary',
    jlptLevel: 'N5',
    exampleSentence: '水を たくさん 飲みます。',
    exampleTranslation: 'I drink a lot of water.',
  },
  {
    id: 'vocab-3',
    front: '見る',
    reading: 'みる (miru)',
    meaning: 'to see, to watch, to look',
    category: 'vocabulary',
    jlptLevel: 'N5',
    exampleSentence: 'きのう、日本の映画を 見ました。',
    exampleTranslation: 'Yesterday, I watched a Japanese movie.',
  },
  {
    id: 'vocab-4',
    front: '行く',
    reading: 'いく (iku)',
    meaning: 'to go',
    category: 'vocabulary',
    jlptLevel: 'N5',
    exampleSentence: '来月、東京へ 行きます。',
    exampleTranslation: 'I am going to Tokyo next month.',
  },
  {
    id: 'vocab-5',
    front: '来る',
    reading: 'くる (kuru)',
    meaning: 'to come',
    category: 'vocabulary',
    jlptLevel: 'N5',
    exampleSentence: '友だちが 家に 来ました。',
    exampleTranslation: 'My friend came to my house.',
  },
  {
    id: 'vocab-6',
    front: '勉強する',
    reading: 'べんきょうする (benkyou suru)',
    meaning: 'to study',
    category: 'vocabulary',
    jlptLevel: 'N5',
    exampleSentence: '図書館で 日本語を 勉強しています。',
    exampleTranslation: 'I am studying Japanese at the library.',
  },
  {
    id: 'vocab-7',
    front: '美味しい',
    reading: 'おいしい (oishii)',
    meaning: 'delicious, tasty',
    category: 'vocabulary',
    jlptLevel: 'N5',
    exampleSentence: 'この ラーメンは とても 美味しいです。',
    exampleTranslation: 'This ramen is very delicious.',
  },
  {
    id: 'vocab-8',
    front: '約束',
    reading: 'やくそく (yakusoku)',
    meaning: 'promise, appointment',
    category: 'vocabulary',
    jlptLevel: 'N4',
    exampleSentence: '友だちと 約束が あります。',
    exampleTranslation: 'I have an appointment with a friend.',
  },
  {
    id: 'vocab-9',
    front: '準備',
    reading: 'じゅんび (junbi)',
    meaning: 'preparation, setup',
    category: 'vocabulary',
    jlptLevel: 'N4',
    exampleSentence: '旅行の 準備を しなければなりません。',
    exampleTranslation: 'I must prepare for the trip.',
  },
  {
    id: 'vocab-10',
    front: '経験',
    reading: 'けいけん (keiken)',
    meaning: 'experience',
    category: 'vocabulary',
    jlptLevel: 'N4',
    exampleSentence: 'いい 経験に なりました。',
    exampleTranslation: 'It became a good experience.',
  },
  // Kanji
  {
    id: 'kanji-1',
    front: '日',
    reading: 'ニチ・ジツ / ひ・か',
    meaning: 'day, sun, Japan',
    category: 'kanji',
    jlptLevel: 'N5',
    exampleSentence: '日曜日 (にちようび) — Sunday',
    exampleTranslation: '日本 (にほん) — Japan',
  },
  {
    id: 'kanji-2',
    front: '本',
    reading: 'ホン / もと',
    meaning: 'book, origin, main',
    category: 'kanji',
    jlptLevel: 'N5',
    exampleSentence: '日本語の本を 読みます。',
    exampleTranslation: 'I read a Japanese book.',
  },
  {
    id: 'kanji-3',
    front: '学',
    reading: 'ガク / まな(ぶ)',
    meaning: 'study, learning, science',
    category: 'kanji',
    jlptLevel: 'N5',
    exampleSentence: '大学 (だいがく) で 学ぶ。',
    exampleTranslation: 'To learn at a university.',
  },
  {
    id: 'kanji-4',
    front: '語',
    reading: 'ゴ / かた(る)',
    meaning: 'word, speech, language',
    category: 'kanji',
    jlptLevel: 'N5',
    exampleSentence: '日本語 (にほんご) と 英語 (えいご)',
    exampleTranslation: 'Japanese and English languages.',
  },
  {
    id: 'kanji-5',
    front: '電',
    reading: 'デン',
    meaning: 'electricity',
    category: 'kanji',
    jlptLevel: 'N5',
    exampleSentence: '電車 (でんしゃ) で 行きます。',
    exampleTranslation: 'I go by train.',
  },
  {
    id: 'kanji-6',
    front: '話',
    reading: 'ワ / はな(す)・はなし',
    meaning: 'speak, talk, story',
    category: 'kanji',
    jlptLevel: 'N5',
    exampleSentence: '電話 (でんわ) で 話します。',
    exampleTranslation: 'I talk on the phone.',
  },
  // Kana
  {
    id: 'kana-1',
    front: 'あ',
    reading: 'a (Hiragana)',
    meaning: 'Vowel "a" as in father',
    category: 'kana',
    jlptLevel: 'N5',
    exampleSentence: 'あめ (ame)',
    exampleTranslation: 'rain / candy',
  },
  {
    id: 'kana-2',
    front: 'き',
    reading: 'ki (Hiragana)',
    meaning: 'Syllable "ki" (looks like a key)',
    category: 'kana',
    jlptLevel: 'N5',
    exampleSentence: 'きもの (kimono)',
    exampleTranslation: 'kimono',
  },
  {
    id: 'kana-3',
    front: 'つ',
    reading: 'tsu (Hiragana)',
    meaning: 'Syllable "tsu" (like a tsunami wave)',
    category: 'kana',
    jlptLevel: 'N5',
    exampleSentence: 'つき (tsuki)',
    exampleTranslation: 'moon',
  },
  {
    id: 'kana-4',
    front: 'シ',
    reading: 'shi (Katakana)',
    meaning: 'Katakana "shi" (strokes go sideways & up)',
    category: 'kana',
    jlptLevel: 'N5',
    exampleSentence: 'シャツ (shatsu)',
    exampleTranslation: 'shirt',
  },
  {
    id: 'kana-5',
    front: 'ツ',
    reading: 'tsu (Katakana)',
    meaning: 'Katakana "tsu" (strokes go downward)',
    category: 'kana',
    jlptLevel: 'N5',
    exampleSentence: 'ツアー (tsuaa)',
    exampleTranslation: 'tour',
  },
  {
    id: 'kana-6',
    front: 'ン',
    reading: 'n (Katakana)',
    meaning: 'Katakana "n" (Compare with ソ "so")',
    category: 'kana',
    jlptLevel: 'N5',
    exampleSentence: 'ラーメン (raamen)',
    exampleTranslation: 'ramen',
  },
  // Grammar
  {
    id: 'gram-1',
    front: '〜たい',
    reading: 'Verb [ます-stem] + たい',
    meaning: 'Want to do (something)',
    category: 'grammar',
    jlptLevel: 'N5',
    exampleSentence: '日本へ 行きたいです。',
    exampleTranslation: 'I want to go to Japan.',
  },
  {
    id: 'gram-2',
    front: '〜てください',
    reading: 'Verb [て-form] + ください',
    meaning: 'Please do (polite request)',
    category: 'grammar',
    jlptLevel: 'N5',
    exampleSentence: 'ちょっと 待って ください。',
    exampleTranslation: 'Please wait a moment.',
  },
  {
    id: 'gram-3',
    front: '〜たことがある',
    reading: 'Verb [た-form] + ことがある',
    meaning: 'Have done before (past experience)',
    category: 'grammar',
    jlptLevel: 'N5',
    exampleSentence: '富士山を 見たことが ありますか。',
    exampleTranslation: 'Have you ever seen Mt. Fuji?',
  },
  {
    id: 'gram-4',
    front: '〜ほうがいい',
    reading: 'Verb [た / ない] + ほうがいい',
    meaning: 'Had better do / Should do',
    category: 'grammar',
    jlptLevel: 'N5',
    exampleSentence: '薬を 飲んだほうが いいですよ。',
    exampleTranslation: 'You should take some medicine.',
  },
  {
    id: 'gram-5',
    front: '〜かもしれない',
    reading: 'Plain form + かもしれない',
    meaning: 'Might, maybe, perhaps',
    category: 'grammar',
    jlptLevel: 'N4',
    exampleSentence: '明日は 雨が 降るかもしれない。',
    exampleTranslation: 'It might rain tomorrow.',
  },
  {
    id: 'gram-6',
    front: '〜ようにする',
    reading: 'Verb [Dictionary / ない] + ようにする',
    meaning: 'To try to, to make sure to (habitual effort)',
    category: 'grammar',
    jlptLevel: 'N4',
    exampleSentence: '毎日 漢字を 練習するように しています。',
    exampleTranslation: 'I make a point of practicing kanji every day.',
  },
]

const SRS_STORAGE_KEY = 'nihongo_srs_cards_v1'
const STATS_STORAGE_KEY = 'nihongo_user_stats_v1'

export interface UserStudyStats {
  displayName: string
  username: string
  email: string
  targetJlpt: string
  currentStreak: number
  longestStreak: number
  xp: number
  totalStudyMins: number
  vocabCount: number
  kanjiCount: number
  grammarCount: number
  reviewsCompletedToday: number
  lastStudyDate: string
  completedLessons: string[]
}

export const DEFAULT_USER_STATS: UserStudyStats = {
  displayName: 'Kenji',
  username: 'kenjilearns',
  email: 'kenji@nihongo.app',
  targetJlpt: 'N5',
  currentStreak: 14,
  longestStreak: 21,
  xp: 1240,
  totalStudyMins: 320,
  vocabCount: 145,
  kanjiCount: 42,
  grammarCount: 28,
  reviewsCompletedToday: 0,
  lastStudyDate: new Date().toISOString().split('T')[0],
  completedLessons: ['hiragana-chart', 'katakana-chart'],
}

export function loadSRSCards(): SRSCard[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore storage errors
  }

  const now = Date.now()
  const initialized: SRSCard[] = DEFAULT_SRS_CARDS.map((card) => ({
    ...card,
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    dueDate: now,
    status: 'new',
  }))

  saveSRSCards(initialized)
  return initialized
}

export function saveSRSCards(cards: SRSCard[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(cards))
  } catch {
    // ignore storage errors
  }
}

export function addCustomSRSCard(card: {
  front: string
  reading: string
  meaning: string
  category: CardCategory
  jlptLevel: string
  exampleSentence?: string
  exampleTranslation?: string
}): { added: boolean; card: SRSCard } {
  const cards = loadSRSCards()
  const existing = cards.find(
    (c) => c.front === card.front && c.category === card.category
  )
  if (existing) {
    existing.dueDate = Date.now()
    saveSRSCards(cards)
    return { added: false, card: existing }
  }

  const newCard: SRSCard = {
    ...card,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    dueDate: Date.now(),
    status: 'new',
  }
  const updated = [newCard, ...cards]
  saveSRSCards(updated)
  return { added: true, card: newCard }
}

/**
 * Standard SM-2 algorithm implementation for Spaced Repetition
 */
export function calculateSM2(
  card: SRSCard,
  rating: CardRating
): SRSCard {
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000
  const MIN_MS = 60 * 1000

  let { interval, repetition, efactor } = card
  let dueDate = now
  let status: SRSCard['status'] = card.status

  if (rating === 'again') {
    repetition = 0
    interval = 0
    efactor = Math.max(1.3, efactor - 0.2)
    // Due in 1 minute (remains in session / due very soon)
    dueDate = now + 1 * MIN_MS
    status = 'learning'
  } else if (rating === 'hard') {
    if (repetition === 0) {
      interval = 1
      repetition = 1
    } else {
      interval = Math.max(1, Math.round(interval * 1.2))
      repetition += 1
    }
    efactor = Math.max(1.3, efactor - 0.15)
    dueDate = now + interval * DAY_MS
    status = interval >= 14 ? 'mastered' : 'review'
  } else if (rating === 'good') {
    if (repetition === 0) {
      interval = 1
    } else if (repetition === 1) {
      interval = 4
    } else {
      interval = Math.max(2, Math.round(interval * efactor))
    }
    repetition += 1
    dueDate = now + interval * DAY_MS
    status = interval >= 14 ? 'mastered' : 'review'
  } else if (rating === 'easy') {
    if (repetition === 0) {
      interval = 4
    } else if (repetition === 1) {
      interval = 7
    } else {
      interval = Math.max(4, Math.round(interval * efactor * 1.3))
    }
    repetition += 1
    efactor = Math.min(3.0, efactor + 0.15)
    dueDate = now + interval * DAY_MS
    status = interval >= 14 ? 'mastered' : 'review'
  }

  return {
    ...card,
    interval,
    repetition,
    efactor,
    dueDate,
    status,
  }
}

export function getIntervalLabels(card: SRSCard): Record<CardRating, string> {
  const hardDays =
    card.repetition === 0 ? 1 : Math.max(1, Math.round(card.interval * 1.2))
  const goodDays =
    card.repetition === 0
      ? 1
      : card.repetition === 1
      ? 4
      : Math.max(2, Math.round(card.interval * card.efactor))
  const easyDays =
    card.repetition === 0
      ? 4
      : card.repetition === 1
      ? 7
      : Math.max(4, Math.round(card.interval * card.efactor * 1.3))

  return {
    again: '< 1m',
    hard: `${hardDays}d`,
    good: `${goodDays}d`,
    easy: `${easyDays}d`,
  }
}

export function loadUserStats(): UserStudyStats {
  if (typeof window === 'undefined') return DEFAULT_USER_STATS
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_USER_STATS, ...JSON.parse(raw) }
    }
  } catch {
    // ignore
  }
  return DEFAULT_USER_STATS
}

export function saveUserStats(stats: Partial<UserStudyStats>): UserStudyStats {
  const current = loadUserStats()
  const updated = { ...current, ...stats }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new Event('nihongo-stats-updated'))
    } catch {
      // ignore
    }
  }
  return updated
}

export function speakJapanese(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    // Strip furigana/romaji in parentheses for cleaner TTS
    const cleanText = text.replace(/\s*\(.*?\)\s*/g, '').trim()
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  } catch {
    // ignore speech errors on unsupported browsers
  }
}
