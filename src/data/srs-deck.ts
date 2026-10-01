export type CardCategory = 'vocabulary' | 'kanji' | 'kana' | 'grammar'
export type CardRating = 'again' | 'hard' | 'good' | 'easy'
export type AnkiNoteType = 'basic' | 'reversed' | 'cloze' | 'type'
export type AnkiFlag = 0 | 1 | 2 | 3 | 4 // 0=None, 1=Red, 2=Orange, 3=Green, 4=Blue
export type AnkiQueue = 'active' | 'buried' | 'suspended'
export type AnkiAlgorithm = 'fsrs' | 'sm2'

export interface SRSCard {
  id: string
  front: string
  reading: string
  meaning: string
  category: CardCategory
  jlptLevel: string
  exampleSentence?: string
  exampleTranslation?: string
  // Anki Extended Metadata
  deckName?: string
  noteType?: AnkiNoteType
  flag?: AnkiFlag
  queue?: AnkiQueue
  lapses?: number
  tags?: string[]
  // SM-2 & FSRS state
  interval: number // in days (0 = intraday learning)
  repetition: number
  efactor: number
  stability?: number // FSRS Stability (S)
  difficulty?: number // FSRS Difficulty (D in 1..10)
  dueDate: number // timestamp (ms)
  status: 'new' | 'learning' | 'review' | 'mastered'
}

export interface AnkiDeckOptions {
  algorithm: AnkiAlgorithm
  desiredRetention: number // e.g. 0.90 (90%)
  newCardsPerDay: number
  maxReviewsPerDay: number
  graduatingInterval: number
  easyInterval: number
  leechThreshold: number
  autoPlayAudio: boolean
}

export const DEFAULT_DECK_OPTIONS: AnkiDeckOptions = {
  algorithm: 'fsrs',
  desiredRetention: 0.9,
  newCardsPerDay: 25,
  maxReviewsPerDay: 200,
  graduatingInterval: 1,
  easyInterval: 4,
  leechThreshold: 8,
  autoPlayAudio: true,
}

export interface AnkiReviewLog {
  id: string
  cardId: string
  rating: CardRating
  interval: number
  timestamp: number
}

export const CATEGORY_TO_DECK: Record<CardCategory, string> = {
  vocabulary: 'Japanese::JLPT Vocabulary',
  kanji: 'Japanese::JLPT Kanji',
  kana: 'Japanese::Hiragana & Katakana',
  grammar: 'Japanese::JLPT Grammar',
}

export const DEFAULT_SRS_CARDS: Omit<
  SRSCard,
  'interval' | 'repetition' | 'efactor' | 'dueDate' | 'status'
>[] = [
  // Vocabulary (Basic, Type-in-Answer, Reversed, Cloze)
  {
    id: 'vocab-1',
    front: '食べる[たべる]',
    reading: 'たべる (taberu)',
    meaning: 'to eat',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'ichidan-verb', 'food'],
    exampleSentence: 'まいにち 朝[あさ]ごはんを 食べる[たべる]。',
    exampleTranslation: 'I eat breakfast every day.',
  },
  {
    id: 'vocab-2',
    front: '飲む[のむ]',
    reading: 'のむ',
    meaning: 'to drink',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'type',
    jlptLevel: 'N5',
    tags: ['N5', 'godan-verb'],
    exampleSentence: '水[みず]を たくさん 飲みます[のみます]。',
    exampleTranslation: 'I drink a lot of water.',
  },
  {
    id: 'vocab-3',
    front: 'きのう、日本[にほん]の映画[えいが]を {{c1::見ました[みました]::saw / watched}}。',
    reading: 'みる (miru)',
    meaning: 'to see, to watch, to look',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'cloze',
    jlptLevel: 'N5',
    tags: ['N5', 'cloze', 'verb'],
    exampleSentence: '映画[えいが]を 見る[みる]。',
    exampleTranslation: 'I watch a movie.',
  },
  {
    id: 'vocab-4',
    front: '行く[いく]',
    reading: 'いく (iku)',
    meaning: 'to go',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'reversed',
    jlptLevel: 'N5',
    tags: ['N5', 'movement'],
    exampleSentence: '来月[らいげつ]、東京[とうきょう]へ 行きます[いきます]。',
    exampleTranslation: 'I am going to Tokyo next month.',
  },
  {
    id: 'vocab-5',
    front: '来る[くる]',
    reading: 'くる (kuru)',
    meaning: 'to come',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'irregular-verb'],
    exampleSentence: '友[とも]だちが 家[いえ]に 来ました[きました]。',
    exampleTranslation: 'My friend came to my house.',
  },
  {
    id: 'vocab-6',
    front: '勉強[べんきょう]する',
    reading: 'べんきょうする',
    meaning: 'to study',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'type',
    jlptLevel: 'N5',
    tags: ['N5', 'suru-verb'],
    exampleSentence: '図書館[としょかん]で 日本語[にほんご]を 勉強[べんきょう]しています。',
    exampleTranslation: 'I am studying Japanese at the library.',
  },
  {
    id: 'vocab-7',
    front: '美味しい[おいしい]',
    reading: 'おいしい (oishii)',
    meaning: 'delicious, tasty',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'i-adjective'],
    exampleSentence: 'この ラーメンは とても 美味しい[おいしい]です。',
    exampleTranslation: 'This ramen is very delicious.',
  },
  {
    id: 'vocab-8',
    front: '約束[やくそく]',
    reading: 'やくそく (yakusoku)',
    meaning: 'promise, appointment',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'basic',
    jlptLevel: 'N4',
    tags: ['N4', 'noun'],
    exampleSentence: '友[とも]だちと 約束[やくそく]が あります。',
    exampleTranslation: 'I have an appointment with a friend.',
  },
  {
    id: 'vocab-9',
    front: '旅行[りょこう]の {{c1::準備[じゅんび]::preparation}} を しなければなりません。',
    reading: 'じゅんび (junbi)',
    meaning: 'preparation, setup',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'cloze',
    jlptLevel: 'N4',
    tags: ['N4', 'cloze'],
    exampleSentence: '旅行[りょこう]の 準備[じゅんび]を する。',
    exampleTranslation: 'To prepare for a trip.',
  },
  {
    id: 'vocab-10',
    front: '経験[けいけん]',
    reading: 'けいけん (keiken)',
    meaning: 'experience',
    category: 'vocabulary',
    deckName: 'Japanese::JLPT Vocabulary',
    noteType: 'reversed',
    jlptLevel: 'N4',
    tags: ['N4', 'noun'],
    exampleSentence: 'いい 経験[けいけん]に なりました。',
    exampleTranslation: 'It became a good experience.',
  },
  // Kanji
  {
    id: 'kanji-1',
    front: '日',
    reading: 'ニチ・ジツ / ひ・か',
    meaning: 'day, sun, Japan',
    category: 'kanji',
    deckName: 'Japanese::JLPT Kanji',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'kanji'],
    exampleSentence: '日曜日[にちようび] — Sunday',
    exampleTranslation: '日本[にほん] — Japan',
  },
  {
    id: 'kanji-2',
    front: '本',
    reading: 'ホン / もと',
    meaning: 'book, origin, main',
    category: 'kanji',
    deckName: 'Japanese::JLPT Kanji',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'kanji'],
    exampleSentence: '日本語[にほんご]の本[ほん]を 読みます[よみます]。',
    exampleTranslation: 'I read a Japanese book.',
  },
  {
    id: 'kanji-3',
    front: '学',
    reading: 'ガク / まな(ぶ)',
    meaning: 'study, learning, science',
    category: 'kanji',
    deckName: 'Japanese::JLPT Kanji',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'kanji'],
    exampleSentence: '大学[だいがく]で 学ぶ[まなぶ]。',
    exampleTranslation: 'To learn at a university.',
  },
  {
    id: 'kanji-4',
    front: '語',
    reading: 'ゴ / かた(る)',
    meaning: 'word, speech, language',
    category: 'kanji',
    deckName: 'Japanese::JLPT Kanji',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'kanji'],
    exampleSentence: '日本語[にほんご] と 英語[えいご]',
    exampleTranslation: 'Japanese and English languages.',
  },
  {
    id: 'kanji-5',
    front: '電',
    reading: 'デン',
    meaning: 'electricity',
    category: 'kanji',
    deckName: 'Japanese::JLPT Kanji',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'kanji'],
    exampleSentence: '電車[でんしゃ]で 行きます[いきます]。',
    exampleTranslation: 'I go by train.',
  },
  {
    id: 'kanji-6',
    front: '話',
    reading: 'ワ / はな(す)・はなし',
    meaning: 'speak, talk, story',
    category: 'kanji',
    deckName: 'Japanese::JLPT Kanji',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'kanji'],
    exampleSentence: '電話[でんわ]で 話します[はなします]。',
    exampleTranslation: 'I talk on the phone.',
  },
  // Kana
  {
    id: 'kana-1',
    front: 'あ',
    reading: 'a',
    meaning: 'Vowel "a" as in father',
    category: 'kana',
    deckName: 'Japanese::Hiragana & Katakana',
    noteType: 'type',
    jlptLevel: 'N5',
    tags: ['hiragana', 'kana'],
    exampleSentence: 'あめ (ame)',
    exampleTranslation: 'rain / candy',
  },
  {
    id: 'kana-2',
    front: 'き',
    reading: 'ki',
    meaning: 'Syllable "ki" (looks like a key)',
    category: 'kana',
    deckName: 'Japanese::Hiragana & Katakana',
    noteType: 'type',
    jlptLevel: 'N5',
    tags: ['hiragana', 'kana'],
    exampleSentence: 'きもの (kimono)',
    exampleTranslation: 'kimono',
  },
  {
    id: 'kana-3',
    front: 'つ',
    reading: 'tsu',
    meaning: 'Syllable "tsu" (like a tsunami wave)',
    category: 'kana',
    deckName: 'Japanese::Hiragana & Katakana',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['hiragana', 'kana'],
    exampleSentence: 'つき (tsuki)',
    exampleTranslation: 'moon',
  },
  {
    id: 'kana-4',
    front: 'シ',
    reading: 'shi',
    meaning: 'Katakana "shi" (strokes align left & sweep up)',
    category: 'kana',
    deckName: 'Japanese::Hiragana & Katakana',
    noteType: 'type',
    jlptLevel: 'N5',
    tags: ['katakana', 'kana'],
    exampleSentence: 'シャツ (shatsu)',
    exampleTranslation: 'shirt',
  },
  {
    id: 'kana-5',
    front: 'ツ',
    reading: 'tsu',
    meaning: 'Katakana "tsu" (strokes align top & sweep down)',
    category: 'kana',
    deckName: 'Japanese::Hiragana & Katakana',
    noteType: 'type',
    jlptLevel: 'N5',
    tags: ['katakana', 'kana'],
    exampleSentence: 'ツアー (tsuaa)',
    exampleTranslation: 'tour',
  },
  {
    id: 'kana-6',
    front: 'ン',
    reading: 'n',
    meaning: 'Katakana "n" (Compare with ソ "so")',
    category: 'kana',
    deckName: 'Japanese::Hiragana & Katakana',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['katakana', 'kana'],
    exampleSentence: 'ラーメン (raamen)',
    exampleTranslation: 'ramen',
  },
  // Grammar
  {
    id: 'gram-1',
    front: '日本[にほん]へ {{c1::行きたい[いきたい]::want to go (~たい)}} です。',
    reading: 'Verb [ます-stem] + たい',
    meaning: 'Want to do (something)',
    category: 'grammar',
    deckName: 'Japanese::JLPT Grammar',
    noteType: 'cloze',
    jlptLevel: 'N5',
    tags: ['N5', 'grammar', 'cloze'],
    exampleSentence: '日本[にほん]へ 行きたい[いきたい]です。',
    exampleTranslation: 'I want to go to Japan.',
  },
  {
    id: 'gram-2',
    front: '〜てください',
    reading: 'Verb [て-form] + ください',
    meaning: 'Please do (polite request)',
    category: 'grammar',
    deckName: 'Japanese::JLPT Grammar',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'grammar'],
    exampleSentence: 'ちょっと 待って[まって] ください。',
    exampleTranslation: 'Please wait a moment.',
  },
  {
    id: 'gram-3',
    front: '富士山[ふじさん]を {{c1::見たことが[みたことが]::have seen before}} ありますか。',
    reading: 'Verb [た-form] + ことがある',
    meaning: 'Have done before (past experience)',
    category: 'grammar',
    deckName: 'Japanese::JLPT Grammar',
    noteType: 'cloze',
    jlptLevel: 'N5',
    tags: ['N5', 'grammar', 'cloze'],
    exampleSentence: '富士山[ふじさん]を 見た[みた]ことが ありますか。',
    exampleTranslation: 'Have you ever seen Mt. Fuji?',
  },
  {
    id: 'gram-4',
    front: '〜ほうがいい',
    reading: 'Verb [た / ない] + ほうがいい',
    meaning: 'Had better do / Should do',
    category: 'grammar',
    deckName: 'Japanese::JLPT Grammar',
    noteType: 'basic',
    jlptLevel: 'N5',
    tags: ['N5', 'grammar'],
    exampleSentence: '薬[くすり]を 飲んだ[のんだ]ほうが いいですよ。',
    exampleTranslation: 'You should take some medicine.',
  },
  {
    id: 'gram-5',
    front: '〜かもしれない',
    reading: 'Plain form + かもしれない',
    meaning: 'Might, maybe, perhaps',
    category: 'grammar',
    deckName: 'Japanese::JLPT Grammar',
    noteType: 'basic',
    jlptLevel: 'N4',
    tags: ['N4', 'grammar'],
    exampleSentence: '明日[あした]は 雨[あめ]が 降る[ふる]かもしれない。',
    exampleTranslation: 'It might rain tomorrow.',
  },
  {
    id: 'gram-6',
    front: '〜ようにする',
    reading: 'Verb [Dictionary / ない] + ようにする',
    meaning: 'To try to, to make sure to (habitual effort)',
    category: 'grammar',
    deckName: 'Japanese::JLPT Grammar',
    noteType: 'basic',
    jlptLevel: 'N4',
    tags: ['N4', 'grammar'],
    exampleSentence: '毎日[まいにち] 漢字[かんじ]を 練習[れんしゅう]するように しています。',
    exampleTranslation: 'I make a point of practicing kanji every day.',
  },
]

const SRS_STORAGE_KEY = 'nihongo_srs_cards_v2'
const STATS_STORAGE_KEY = 'nihongo_user_stats_v1'
const OPTIONS_STORAGE_KEY = 'nihongo_anki_options_v1'
const REVLOG_STORAGE_KEY = 'nihongo_anki_revlog_v1'

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

export function loadDeckOptions(): AnkiDeckOptions {
  if (typeof window === 'undefined') return DEFAULT_DECK_OPTIONS
  try {
    const raw = localStorage.getItem(OPTIONS_STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_DECK_OPTIONS, ...JSON.parse(raw) }
    }
  } catch {
    // ignore
  }
  return DEFAULT_DECK_OPTIONS
}

export function saveDeckOptions(
  opts: Partial<AnkiDeckOptions>
): AnkiDeckOptions {
  const next = { ...loadDeckOptions(), ...opts }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }
  return next
}

export function loadReviewLogs(): AnkiReviewLog[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(REVLOG_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  // Seed initial 14-day review history so the Anki Heatmap is populated on first visit
  const seeded: AnkiReviewLog[] = []
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  const ratings: CardRating[] = ['good', 'good', 'easy', 'good', 'hard', 'good']
  for (let d = 13; d >= 1; d--) {
    const count = (d % 4) * 4 + 6
    for (let i = 0; i < count; i++) {
      seeded.push({
        id: `seed-${d}-${i}`,
        cardId: `vocab-${(i % 10) + 1}`,
        rating: ratings[(d + i) % ratings.length],
        interval: (i % 7) + 1,
        timestamp: now - d * DAY + i * 1000,
      })
    }
  }
  saveReviewLogs(seeded)
  return seeded
}

export function saveReviewLogs(logs: AnkiReviewLog[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(REVLOG_STORAGE_KEY, JSON.stringify(logs.slice(-2000)))
  } catch {
    // ignore
  }
}

export function appendReviewLog(cardId: string, rating: CardRating, interval: number) {
  const logs = loadReviewLogs()
  logs.push({
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cardId,
    rating,
    interval,
    timestamp: Date.now(),
  })
  saveReviewLogs(logs)
}

export function loadSRSCards(): SRSCard[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: SRSCard) => ({
          ...c,
          deckName: c.deckName || CATEGORY_TO_DECK[c.category] || 'Japanese::Default',
          noteType: c.noteType || 'basic',
          flag: c.flag ?? 0,
          queue: c.queue || 'active',
          lapses: c.lapses ?? 0,
          tags: c.tags || [c.jlptLevel, c.category],
          stability: c.stability ?? Math.max(1, c.interval || 1),
          difficulty: c.difficulty ?? 5.0,
        }))
      }
    }
  } catch {
    // ignore storage errors
  }

  const now = Date.now()
  const initialized: SRSCard[] = DEFAULT_SRS_CARDS.map((card) => ({
    ...card,
    deckName: card.deckName || CATEGORY_TO_DECK[card.category],
    noteType: card.noteType || 'basic',
    flag: 0,
    queue: 'active',
    lapses: 0,
    tags: card.tags || [card.jlptLevel, card.category],
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    stability: 1.0,
    difficulty: 5.0,
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
  deckName?: string
  noteType?: AnkiNoteType
  exampleSentence?: string
  exampleTranslation?: string
  tags?: string[]
}): { added: boolean; card: SRSCard } {
  const cards = loadSRSCards()
  const targetDeck = card.deckName || CATEGORY_TO_DECK[card.category]
  const existing = cards.find(
    (c) => c.front === card.front && (c.deckName === targetDeck || c.category === card.category)
  )
  if (existing) {
    existing.reading = card.reading || existing.reading
    existing.meaning = card.meaning || existing.meaning
    existing.exampleSentence = card.exampleSentence ?? existing.exampleSentence
    existing.exampleTranslation =
      card.exampleTranslation ?? existing.exampleTranslation
    existing.deckName = targetDeck
    existing.dueDate = Date.now()
    existing.queue = 'active'
    saveSRSCards(cards)
    return { added: false, card: existing }
  }

  const newCard: SRSCard = {
    ...card,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    deckName: targetDeck,
    noteType: card.noteType || (card.front.includes('{{c1::') ? 'cloze' : 'basic'),
    flag: 0,
    queue: 'active',
    lapses: 0,
    tags: card.tags || [card.jlptLevel, card.category],
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    stability: 1.0,
    difficulty: 5.0,
    dueDate: Date.now(),
    status: 'new',
  }
  const updated = [newCard, ...cards]
  saveSRSCards(updated)
  return { added: true, card: newCard }
}

/**
 * Bulk imports an array of parsed Anki cards into a target deck in a single localStorage write,
 * replacing any previously broken cards in that deck that lacked English translations.
 */
export function importAnkiDeckCards(
  deckName: string,
  incoming: {
    front: string
    reading: string
    meaning: string
    category: CardCategory
    jlptLevel: string
    noteType?: AnkiNoteType
    exampleSentence?: string
    exampleTranslation?: string
    tags?: string[]
  }[]
): { allCards: SRSCard[]; addedCount: number } {
  // Keep cards from other decks (and purge any old cards from this same deckName so re-import is clean)
  const existingOtherDecks = loadSRSCards().filter(
    (c) => c.deckName !== deckName
  )
  const now = Date.now()
  const newDeckCards: SRSCard[] = incoming.map((card, idx) => ({
    ...card,
    id: `anki-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    deckName,
    noteType:
      card.noteType || (card.front.includes('{{c1::') ? 'cloze' : 'basic'),
    flag: 0,
    queue: 'active',
    lapses: 0,
    tags: card.tags || [card.jlptLevel, card.category],
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    stability: 1.0,
    difficulty: 5.0,
    dueDate: now + idx,
    status: 'new',
  }))

  const allCards = [...newDeckCards, ...existingOtherDecks]
  saveSRSCards(allCards)
  return { allCards, addedCount: newDeckCards.length }
}

/**
 * Supports BOTH Anki FSRS v4.5 (Stability & Difficulty) and Classic SM-2,
 * plus Anki Leech detection.
 */
export function calculateSM2(
  card: SRSCard,
  rating: CardRating,
  options?: AnkiDeckOptions
): SRSCard {
  const opts = options || loadDeckOptions()
  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000
  const MIN_MS = 60 * 1000

  let { interval, repetition, efactor } = card
  let stability = card.stability ?? Math.max(1, interval || 1)
  let difficulty = card.difficulty ?? 5.0
  let lapses = card.lapses ?? 0
  const tags = Array.from(new Set(card.tags || [card.jlptLevel, card.category]))
  let dueDate = now
  let status: SRSCard['status'] = card.status

  // Grade mapping: again=1, hard=2, good=3, easy=4
  const grade =
    rating === 'again' ? 1 : rating === 'hard' ? 2 : rating === 'good' ? 3 : 4

  if (opts.algorithm === 'fsrs') {
    // FSRS v4.5 core state update
    difficulty = Math.min(
      10,
      Math.max(1, difficulty - 0.8 * (grade - 3))
    )
    const retentionFactor = (1 / Math.max(0.7, Math.min(0.97, opts.desiredRetention))) - 1
    const scale = retentionFactor / (1 / 0.9 - 1)

    if (rating === 'again') {
      if (repetition > 0) {
        lapses += 1
        if (lapses >= opts.leechThreshold && !tags.includes('leech')) {
          tags.push('leech')
        }
      }
      repetition = 0
      interval = 0
      stability = Math.max(0.5, stability * 0.3)
      dueDate = now + 1 * MIN_MS
      status = 'learning'
    } else {
      if (repetition === 0) {
        stability =
          rating === 'hard'
            ? 1.0
            : rating === 'good'
            ? Math.max(1, opts.graduatingInterval)
            : Math.max(4, opts.easyInterval)
      } else {
        const mult =
          rating === 'hard'
            ? 1.25
            : rating === 'good'
            ? 1 + (11 - difficulty) * 0.28
            : 1 + (11 - difficulty) * 0.42
        stability = Math.max(1, stability * mult)
      }
      interval = Math.max(1, Math.round(stability * scale))
      repetition += 1
      dueDate = now + interval * DAY_MS
      status = interval >= 21 ? 'mastered' : 'review'
    }
  } else {
    // Classic Anki SM-2 algorithm
    if (rating === 'again') {
      if (repetition > 0) {
        lapses += 1
        if (lapses >= opts.leechThreshold && !tags.includes('leech')) {
          tags.push('leech')
        }
      }
      repetition = 0
      interval = 0
      efactor = Math.max(1.3, efactor - 0.2)
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
      status = interval >= 21 ? 'mastered' : 'review'
    } else if (rating === 'good') {
      if (repetition === 0) {
        interval = opts.graduatingInterval || 1
      } else if (repetition === 1) {
        interval = 4
      } else {
        interval = Math.max(2, Math.round(interval * efactor))
      }
      repetition += 1
      dueDate = now + interval * DAY_MS
      status = interval >= 21 ? 'mastered' : 'review'
    } else if (rating === 'easy') {
      if (repetition === 0) {
        interval = opts.easyInterval || 4
      } else if (repetition === 1) {
        interval = 7
      } else {
        interval = Math.max(4, Math.round(interval * efactor * 1.3))
      }
      repetition += 1
      efactor = Math.min(3.0, efactor + 0.15)
      dueDate = now + interval * DAY_MS
      status = interval >= 21 ? 'mastered' : 'review'
    }
  }

  return {
    ...card,
    interval,
    repetition,
    efactor,
    stability,
    difficulty,
    lapses,
    tags,
    dueDate,
    status,
  }
}

export function getIntervalLabels(
  card: SRSCard,
  options?: AnkiDeckOptions
): Record<CardRating, string> {
  const againCard = calculateSM2(card, 'again', options)
  const hardCard = calculateSM2(card, 'hard', options)
  const goodCard = calculateSM2(card, 'good', options)
  const easyCard = calculateSM2(card, 'easy', options)

  return {
    again: againCard.interval === 0 ? '< 1m' : `${againCard.interval}d`,
    hard: `${hardCard.interval}d`,
    good: `${goodCard.interval}d`,
    easy: `${easyCard.interval}d`,
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

let activeJapaneseAudio: HTMLAudioElement | null = null

export function stopJapaneseSpeech() {
  if (typeof window === 'undefined') return
  try {
    if (activeJapaneseAudio) {
      activeJapaneseAudio.pause()
      activeJapaneseAudio.currentTime = 0
      activeJapaneseAudio = null
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  } catch {
    // ignore
  }
}

export function speakJapanese(
  text: string,
  options?: { rate?: number; onEnd?: () => void; onError?: () => void }
) {
  if (typeof window === 'undefined') return
  // Strip Anki furigana [reading], cloze {{c1::ans::hint}}, HTML, and parenthetical romaji for clean speech
  const cleanText = text
    .replace(/\{\{c\d+::([^}:]+)(?:::[^}]+)?\}\}/g, '$1')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()

  if (!cleanText) {
    options?.onEnd?.()
    return
  }

  stopJapaneseSpeech()

  let hasFallenBack = false

  const fallbackToWebSpeech = () => {
    if (hasFallenBack) return
    hasFallenBack = true

    try {
      if (!('speechSynthesis' in window)) {
        options?.onError?.()
        return
      }

      // Chrome/Windows bugfix: resume if audio engine is locked or paused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'ja-JP'
      utterance.rate = options?.rate ?? 0.95

      const setVoiceAndSpeak = () => {
        try {
          const voices = window.speechSynthesis.getVoices()
          const jaVoice = voices.find(
            (v) =>
              v.lang.toLowerCase().startsWith('ja') ||
              v.lang.toLowerCase().includes('jp')
          )
          if (jaVoice) {
            utterance.voice = jaVoice
          }
        } catch {
          // ignore voice selection error
        }

        if (options?.onEnd) utterance.onend = () => options.onEnd?.()
        if (options?.onError) utterance.onerror = () => options.onError?.()

        window.speechSynthesis.speak(utterance)
      }

      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        setVoiceAndSpeak()
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak()
          window.speechSynthesis.onvoiceschanged = null
        }
        setTimeout(() => {
          if (!window.speechSynthesis.speaking) {
            setVoiceAndSpeak()
          }
        }, 150)
      }
    } catch {
      options?.onError?.()
    }
  }

  try {
    const audio = new Audio(
      `/api/tts?text=${encodeURIComponent(cleanText)}`
    )
    if (options?.rate) {
      audio.playbackRate = Math.max(0.5, Math.min(2.0, options.rate))
    }
    activeJapaneseAudio = audio

    if (options?.onEnd) {
      audio.onended = () => {
        activeJapaneseAudio = null
        options.onEnd?.()
      }
    }

    audio.onerror = () => fallbackToWebSpeech()

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => fallbackToWebSpeech())
    }
  } catch {
    fallbackToWebSpeech()
  }
}

