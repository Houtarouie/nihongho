import grammarData from '@/data/grammar.json'
import curatedUserGrammar from '@/data/user-grammar-curated.json'

export interface GrammarPointSummary {
  grammar: string
  meaning: string
  level: string
  lesson?: string | null
  title?: string
  track?: 'core' | 'reference'
}

export interface GrammarExampleItem {
  id: string
  japaneseHtml: string // with <ruby> and <span class="grammar-hl">
  plainJapanese: string
  englishHtml: string // with <span class="grammar-hl">
  plainEnglish: string
  clozePrompt: string // e.g. "大学生____。"
  clozeAnswer: string // e.g. "です"
  clozeHint: string // e.g. "[Polite copula]"
  registerNote?: string
}

export interface GrammarRelationCard {
  grammar: string
  reading?: string
  meaning: string
  level: string
  badgeTag?: string // e.g. "Beginner 1"
  comparisonText: string
  registerTag: 'Casual' | 'Polite' | 'Humble/Keigo' | 'Literary/Formal' | 'Neutral'
}

export interface GrammarComponentVocab {
  word: string
  reading: string
  meaning: string
  level: string
}

export interface GrammarPointRichDetail {
  grammar: string
  displayTitle: string
  reading?: string
  meaning: string
  level: string
  lesson: string
  cautionBanner: string
  structures: string[]
  metadata: {
    partOfSpeech: string
    partOfSpeechTooltip: string
    wordType: string
    wordTypeTooltip: string
    register: 'Polite' | 'Casual' | 'Formal / Written' | 'Humble / Honorific' | 'Standard'
    registerTooltip: string
  }
  aboutParagraphs: string[]
  aboutExamples: GrammarExampleItem[]
  allExamples: GrammarExampleItem[]
  topicCard: {
    title: string
    subtitle: string
    description: string
    readTime: string
  }
  synonyms: GrammarRelationCard[]
  antonyms: GrammarRelationCard[]
  related: GrammarRelationCard[]
  vocabItems: GrammarComponentVocab[]
  resources: {
    mnemonic: string
    commonMistake: string
    readingPassageLesson: number
  }
}

// Hand-crafted rich detail for です (matching Screenshots 1, 2, 3 verbatim) and core N5 points
const CURATED_GRAMMAR_DETAILS: Record<string, Partial<GrammarPointRichDetail>> = {
  'です': {
    displayTitle: 'です',
    reading: 'です',
    meaning: 'To be, Is',
    cautionBanner: 'Unlike だ, です is often used with both い-Adjectives and な-Adjectives',
    structures: ['Noun + です', 'Adjective + です'],
    metadata: {
      partOfSpeech: 'Auxiliary Verb',
      partOfSpeechTooltip:
        '助動詞 (Jodōshi) — Attaches to nouns and adjectives to inflect politeness and assertion.',
      wordType: 'Dependent Word',
      wordTypeTooltip:
        '付属語 (Fuzokugo) — Cannot stand alone; must attach to a preceding noun or adjective.',
      register: 'Polite',
      registerTooltip:
        '丁寧語 (Teineigo) — Standard polite speech suitable for strangers, coworkers, and teachers.',
    },
    aboutParagraphs: [
      "Similarly to だ, です is an auxiliary verb that is an expression of determination or assertion. It states that something 'is' a certain way. です is considered to be the polite variation of だ. Keep in mind though that although their roles are similar, both だ and です are standalone structures.",
      'です connects to words in exactly the same way as だ, but is also regularly seen attached to the end of い-Adjectives.',
    ],
    aboutExamples: [
      {
        id: 'desu-1',
        japaneseHtml:
          '<ruby>大学生<rt>だいがくせい</rt></ruby><span class="text-primary font-bold">です</span>。',
        plainJapanese: '大学生です。',
        englishHtml:
          'I <span class="text-primary underline decoration-dotted font-semibold">am</span> a college student.',
        plainEnglish: 'I am a college student.',
        clozePrompt: '大学生____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula (am/is)',
        registerNote: 'Standard polite self-introduction to someone you just met.',
      },
      {
        id: 'desu-2',
        japaneseHtml:
          '<ruby>店<rt>みせ</rt></ruby><span class="text-primary font-bold">です</span>。',
        plainJapanese: '店です。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> a store.',
        plainEnglish: 'It is a store.',
        clozePrompt: '店____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula (is)',
        registerNote: 'Polite statement identifying a place or noun.',
      },
      {
        id: 'desu-3',
        japaneseHtml:
          '<ruby>綺麗<rt>きれい</rt></ruby><span class="text-primary font-bold">です</span>。',
        plainJapanese: '綺麗です。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> beautiful.',
        plainEnglish: 'It is beautiful.',
        clozePrompt: '綺麗____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula after な-adjective',
        registerNote: 'Polite statement with a な-Adjective.',
      },
      {
        id: 'desu-4',
        japaneseHtml:
          '<ruby>面白<rt>おもしろ</rt></ruby>い<span class="text-primary font-bold">です</span>。',
        plainJapanese: '面白いです。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> funny.',
        plainEnglish: 'It is funny.',
        clozePrompt: '面白い____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite marker after い-adjective',
        registerNote: 'Unlike だ, です can directly follow an い-Adjective!',
      },
    ],
    allExamples: [
      {
        id: 'desu-ex-1',
        japaneseHtml:
          'あなた<span class="text-primary font-bold">です</span>。',
        plainJapanese: 'あなたです。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> you.',
        plainEnglish: 'It is you.',
        clozePrompt: 'あなた____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula',
      },
      {
        id: 'desu-ex-2',
        japaneseHtml:
          'ペン<span class="text-primary font-bold">です</span>。',
        plainJapanese: 'ペンです。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> a pen.',
        plainEnglish: 'It is a pen.',
        clozePrompt: 'ペン____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula',
      },
      {
        id: 'desu-ex-3',
        japaneseHtml:
          'さくら<span class="text-primary font-bold">です</span>。',
        plainJapanese: 'さくらです。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> Sakura.',
        plainEnglish: 'It is Sakura.',
        clozePrompt: 'さくら____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula',
      },
      {
        id: 'desu-ex-4',
        japaneseHtml:
          '<ruby>大学生<rt>だいがくせい</rt></ruby><span class="text-primary font-bold">です</span>。',
        plainJapanese: '大学生です。',
        englishHtml:
          'I <span class="text-primary underline decoration-dotted font-semibold">am</span> a college student.',
        plainEnglish: 'I am a college student.',
        clozePrompt: '大学生____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula',
      },
      {
        id: 'desu-ex-5',
        japaneseHtml:
          '<ruby>店<rt>みせ</rt></ruby><span class="text-primary font-bold">です</span>。',
        plainJapanese: '店です。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> a store.',
        plainEnglish: 'It is a store.',
        clozePrompt: '店____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula',
      },
      {
        id: 'desu-ex-6',
        japaneseHtml:
          '<ruby>綺麗<rt>きれい</rt></ruby><span class="text-primary font-bold">です</span>。',
        plainJapanese: '綺麗です。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> beautiful.',
        plainEnglish: 'It is beautiful.',
        clozePrompt: '綺麗____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula',
      },
      {
        id: 'desu-ex-7',
        japaneseHtml:
          '<ruby>面白<rt>おもしろ</rt></ruby>い<span class="text-primary font-bold">です</span>。',
        plainJapanese: '面白いです。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> funny.',
        plainEnglish: 'It is funny.',
        clozePrompt: '面白い____。',
        clozeAnswer: 'です',
        clozeHint: 'Polite copula',
      },
    ],
    topicCard: {
      title: 'Welcome to Japanese Grammar! 日本語へようこそ！',
      subtitle: 'N5 Topic',
      description:
        "Welcome to the start of the N5 learning path! The goal of this first Topic is to learn how to make declarative statements using the Japanese equivalents of 'is'. This is fundamental to almost any language, and is achieved in Japanese through the use of だ and です.",
      readTime: '2m',
    },
    synonyms: [
      {
        grammar: 'だ',
        meaning: 'To be, Is',
        level: 'N5',
        badgeTag: 'Beginner 1',
        comparisonText:
          "だ and です both function like the English 'is.' The main difference is politeness: だ is casual and used in plain speech with friends or family, whereas です is polite.",
        registerTag: 'Casual',
      },
      {
        grammar: 'でございます',
        reading: 'でございます',
        meaning: 'To be, Polite copula',
        level: 'N4',
        comparisonText:
          "です and でございます are both polite forms of 'is' or 'to be.' です is polite and commonly used in everyday conversation, while でございます is hyper-polite keigo used in customer service and formal announcements.",
        registerTag: 'Humble/Keigo',
      },
      {
        grammar: 'である',
        meaning: 'Formal or literary だ, Authoritative, Copula',
        level: 'N3',
        comparisonText:
          "です is often used as the polite form of だ, which is similar in meaning to 'is' or 'to be' in English. It's polite in spoken Japanese, whereas である is used in formal writing, essays, and news articles.",
        registerTag: 'Literary/Formal',
      },
    ],
    antonyms: [
      {
        grammar: 'じゃない',
        meaning: "Is not, Isn't",
        level: 'N5',
        comparisonText:
          "です works like 'is' or 'to be' in English and is used to politely state something in everyday conversation. じゃない (or polite じゃないです / じゃありません) negates that statement to mean 'is not.'",
        registerTag: 'Casual',
      },
    ],
    related: [
      {
        grammar: '〜んです・のです',
        reading: 'んです・のです',
        meaning: 'Explanatory, Emphasis, The fact is',
        level: 'N5',
        comparisonText:
          '〜んです・のです are used to clarify context, provide background information, give reasons, or express curiosity, building directly on top of です.',
        registerTag: 'Polite',
      },
      {
        grammar: 'がある',
        reading: 'がある',
        meaning: 'To be, There is',
        level: 'N5',
        comparisonText:
          "The phrase 〜がある is used to show existence or possession ('There is a book'), whereas です identifies or describes a state ('It is a book').",
        registerTag: 'Neutral',
      },
      {
        grammar: 'だった・でした',
        meaning: 'Was, Were (Past tense)',
        level: 'N5',
        comparisonText:
          "です and だった・でした are all forms of 'is' or 'to be,' but they show different tenses. です is used for the present or future, while でした is the polite past tense of です.",
        registerTag: 'Polite',
      },
    ],
    vocabItems: [
      { word: '大学生', reading: 'だいがくせい', meaning: 'college student', level: 'N5' },
      { word: '店', reading: 'みせ', meaning: 'store, shop', level: 'N5' },
      { word: '綺麗', reading: 'きれい', meaning: 'pretty, clean, beautiful', level: 'N5' },
      { word: '面白い', reading: 'おもしろい', meaning: 'interesting, funny', level: 'N5' },
      { word: 'あなた', reading: 'あなた', meaning: 'you', level: 'N5' },
      { word: 'ペン', reading: 'ぺん', meaning: 'pen', level: 'N5' },
      { word: 'さくら', reading: 'さくら', meaning: 'cherry blossom / Sakura', level: 'N5' },
      { word: '先生', reading: 'せんせい', meaning: 'teacher, doctor', level: 'N5' },
      { word: '学生', reading: 'がくせい', meaning: 'student', level: 'N5' },
      { word: '本', reading: 'ほん', meaning: 'book', level: 'N5' },
      { word: 'これ', reading: 'これ', meaning: 'this one', level: 'N5' },
      { word: 'それ', reading: 'それ', meaning: 'that one', level: 'N5' },
      { word: 'あれ', reading: 'あれ', meaning: 'that one over there', level: 'N5' },
      { word: '日本語', reading: 'にほんご', meaning: 'Japanese language', level: 'N5' },
      { word: '元気', reading: 'げんき', meaning: 'healthy, energetic', level: 'N5' },
      { word: '静か', reading: 'しずか', meaning: 'quiet, peaceful', level: 'N5' },
      { word: '今日', reading: 'きょう', meaning: 'today', level: 'N5' },
    ],
  },
  'だ': {
    displayTitle: 'だ',
    reading: 'だ',
    meaning: 'To be, Is',
    cautionBanner: 'Never attach だ directly after an い-Adjective (✗ 高いだ → ✓ 高い)',
    structures: ['Noun + だ', 'な-Adjective + だ'],
    metadata: {
      partOfSpeech: 'Auxiliary Verb',
      partOfSpeechTooltip:
        '助動詞 (Jodōshi) — Plain-form copula asserting identity or state.',
      wordType: 'Dependent Word',
      wordTypeTooltip:
        '付属語 (Fuzokugo) — Attaches directly to nouns and な-adjective stems.',
      register: 'Standard',
      registerTooltip:
        '常体 (Jōtai) — Used with close friends, family, and inside subordinate clauses.',
    },
    aboutParagraphs: [
      "だ is the plain, standard auxiliary verb used to declare that something 'is' a certain way. It pairs with Nouns and な-Adjectives in casual conversation and is also required inside many grammatical subordinate clauses (such as 〜と思う).",
      'Be careful: unlike です, だ cannot follow an い-Adjective directly because い-Adjectives already have their own built-in assertive conjugation.',
    ],
    aboutExamples: [
      {
        id: 'da-1',
        japaneseHtml:
          '<ruby>本<rt>ほん</rt></ruby><span class="text-primary font-bold">だ</span>。',
        plainJapanese: '本だ。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> a book.',
        plainEnglish: 'It is a book.',
        clozePrompt: '本____。',
        clozeAnswer: 'だ',
        clozeHint: 'Standard copula',
      },
      {
        id: 'da-2',
        japaneseHtml:
          '<ruby>学生<rt>がくせい</rt></ruby><span class="text-primary font-bold">だ</span>。',
        plainJapanese: '学生だ。',
        englishHtml:
          'I <span class="text-primary underline decoration-dotted font-semibold">am</span> a student.',
        plainEnglish: 'I am a student.',
        clozePrompt: '学生____。',
        clozeAnswer: 'だ',
        clozeHint: 'Standard copula',
      },
      {
        id: 'da-3',
        japaneseHtml:
          '<ruby>静<rt>しず</rt></ruby>か<span class="text-primary font-bold">だ</span>。',
        plainJapanese: '静かだ。',
        englishHtml:
          'It <span class="text-primary underline decoration-dotted font-semibold">is</span> quiet.',
        plainEnglish: 'It is quiet.',
        clozePrompt: '静か____。',
        clozeAnswer: 'だ',
        clozeHint: 'Standard copula',
      },
    ],
    synonyms: [
      {
        grammar: 'です',
        meaning: 'To be, Is',
        level: 'N5',
        badgeTag: 'Beginner 1',
        comparisonText:
          'です is the polite counterpart to だ. While だ is used with friends and family, です is used with acquaintances, teachers, and strangers.',
        registerTag: 'Polite',
      },
      {
        grammar: 'である',
        meaning: 'Formal or literary だ, Authoritative, Copula',
        level: 'N3',
        comparisonText:
          'Both だ and である are plain-form copulas, but だ is conversational while である sounds literary, academic, or authoritative.',
        registerTag: 'Literary/Formal',
      },
    ],
    antonyms: [
      {
        grammar: 'じゃない',
        meaning: "Is not, Isn't",
        level: 'N5',
        comparisonText:
          'じゃない is the direct casual negative of だ. Replace だ with じゃない to state that a noun or な-adjective is NOT something.',
        registerTag: 'Casual',
      },
    ],
  },
}

// Helper to extract lesson number (1..10) from lesson string
function parseLessonNumber(lesson?: string | null): number {
  if (!lesson) return 1
  const match = lesson.match(/Lesson\s+(\d+)/i)
  if (match) {
    const n = parseInt(match[1], 10)
    if (n >= 1 && n <= 10) return n
  }
  return 1
}

// Deterministic metadata & examples generator for all 979 points
export function getGrammarPointDetail(
  item: GrammarPointSummary
): GrammarPointRichDetail {
  const cleanTitle = item.grammar.split(' ')[0]
  const curated = CURATED_GRAMMAR_DETAILS[item.grammar] || CURATED_GRAMMAR_DETAILS[cleanTitle]
  const matchedCurated = curatedUserGrammar.grammar.find(
    (g) =>
      g.grammar === item.grammar ||
      g.grammar === cleanTitle ||
      g.title === item.grammar ||
      (item.title && g.title === item.title) ||
      g.title.startsWith(item.grammar) ||
      item.grammar.startsWith(g.grammar) ||
      (g.level === item.level && g.meaning.toLowerCase() === item.meaning.toLowerCase())
  )

  const lessonStr =
    matchedCurated?.lesson ||
    item.lesson ||
    `${item.level} Core Grammar – Essential Expressions`
  const lessonNum = parseLessonNumber(item.lesson)

  // Determine register & part of speech heuristically if not curated
  const isParticle =
    cleanTitle.length <= 2 &&
    ['は', 'が', 'も', 'の', 'か', 'よ', 'ね', 'を', 'に', 'で', 'へ', 'と', 'や', 'から', 'まで'].includes(
      cleanTitle
    )
  const isPolite =
    cleanTitle.includes('ます') ||
    cleanTitle.includes('です') ||
    cleanTitle.includes('ござい') ||
    cleanTitle.includes('いたし') ||
    item.meaning.toLowerCase().includes('polite')
  const isCasual =
    cleanTitle === 'だ' ||
    cleanTitle.includes('じゃ') ||
    cleanTitle.includes('ちゃう') ||
    item.level === '関西弁'
  const isFormal =
    item.level === 'N2' ||
    item.level === 'N1' ||
    item.meaning.toLowerCase().includes('formal') ||
    item.meaning.toLowerCase().includes('literary')

  const defaultMetadata: GrammarPointRichDetail['metadata'] = {
    partOfSpeech: isParticle
      ? 'Particle (助詞)'
      : cleanTitle.startsWith('〜') || cleanTitle.length <= 3
        ? 'Auxiliary / Expression'
        : 'Grammar Pattern',
    partOfSpeechTooltip: isParticle
      ? '助詞 (Joshi) — Postpositional particle that marks the grammatical role of the preceding word or clause.'
      : '文型・助動詞 — Grammatical structure that modifies the nuance, tense, or modality of a clause.',
    wordType: 'Dependent Structure',
    wordTypeTooltip:
      'Attaches to a preceding Noun, Verb, or Adjective to form a complete grammatical phrase.',
    register: isPolite
      ? 'Polite'
      : isCasual
        ? 'Casual'
        : isFormal
          ? 'Formal / Written'
          : 'Standard',
    registerTooltip: isPolite
      ? '丁寧語 (Teineigo) — Used in polite everyday conversation.'
      : isCasual
        ? '常体 (Jōtai) — Used in casual speech with close friends and family.'
        : isFormal
          ? '硬い表現 — Frequently used in news, literature, formal speeches, and JLPT reading sections.'
          : 'Used across both spoken and written Japanese depending on final verb conjugation.',
  }

  const defaultStructures = isParticle
    ? [`Noun + ${cleanTitle}`, `Phrase + ${cleanTitle}`]
    : [
        `Verb [辞書形 / た形] + ${cleanTitle.replace(/^〜/, '')}`,
        `Noun (+ の / だ) + ${cleanTitle.replace(/^〜/, '')}`,
        `い-Adjective / な-Adjective + ${cleanTitle.replace(/^〜/, '')}`,
      ]

  const defaultCaution = isParticle
    ? `Pay close attention to the word immediately preceding ${cleanTitle}—Japanese particles always mark the word BEFORE them, never after.`
    : `Watch the attachment form before ${cleanTitle} (${item.level})—mixing up Noun + の vs Verb stem is the #1 JLPT trap for "${item.meaning}".`

  const defaultAbout = [
    `In Japanese (${item.level}), ${cleanTitle} is a core structure used to express "${item.meaning}". It appears in ${lessonStr} and is essential for both natural conversation and reading comprehension.`,
    `When using ${cleanTitle}, pay attention to the register (${defaultMetadata.register}) and how it links the speaker's intent to the rest of the sentence. Practice the audio examples below with both Sentence and Translation toggles to lock in instant recall.`,
  ]

  const coreToken = cleanTitle.replace(/^〜/, '')

  const defaultExamples: GrammarExampleItem[] = [
    {
      id: `${cleanTitle}-1`,
      japaneseHtml: `<ruby>今日<rt>きょう</rt></ruby>の<ruby>会話<rt>かいわ</rt></ruby>では「<span class="text-[#e15b64] font-bold">${coreToken}</span>」を<ruby>使<rt>つか</rt></ruby>います。`,
      plainJapanese: `今日の会話では「${coreToken}」を使います。`,
      englishHtml: `In today's conversation, we use "<span class="text-[#e15b64] underline decoration-dotted font-semibold">${item.meaning}</span>".`,
      plainEnglish: `In today's conversation, we use "${item.meaning}".`,
      clozePrompt: `今日の会話では「____」を使います。`,
      clozeAnswer: coreToken,
      clozeHint: item.meaning,
      registerNote: 'Standard polite context sentence.',
    },
    {
      id: `${cleanTitle}-2`,
      japaneseHtml: `<ruby>先生<rt>せんせい</rt></ruby>もこの<span class="text-[#e15b64] font-bold">${coreToken}</span>の<ruby>表現<rt>ひょうげん</rt></ruby>をよく<ruby>説明<rt>せつめい</rt></ruby>します。`,
      plainJapanese: `先生もこの${coreToken}の表現をよく説明します。`,
      englishHtml: `The teacher also often explains this expression meaning "<span class="text-[#e15b64] underline decoration-dotted font-semibold">${item.meaning}</span>".`,
      plainEnglish: `The teacher also often explains this expression meaning "${item.meaning}".`,
      clozePrompt: `先生もこの____の表現をよく説明します。`,
      clozeAnswer: coreToken,
      clozeHint: item.meaning,
      registerNote: 'Classroom / academic example.',
    },
    {
      id: `${cleanTitle}-3`,
      japaneseHtml: `<ruby>友達<rt>ともだち</rt></ruby>と<ruby>話<rt>はな</rt></ruby>すとき、<span class="text-[#e15b64] font-bold">${coreToken}</span>はとても<ruby>便利<rt>べんり</rt></ruby>です。`,
      plainJapanese: `友達と話すとき、${coreToken}はとても便利です。`,
      englishHtml: `When speaking with friends, "<span class="text-[#e15b64] underline decoration-dotted font-semibold">${item.meaning}</span>" is very useful.`,
      plainEnglish: `When speaking with friends, "${item.meaning}" is very useful.`,
      clozePrompt: `友達と話すとき、____はとても便利です。`,
      clozeAnswer: coreToken,
      clozeHint: item.meaning,
      registerNote: 'Everyday conversational usage.',
    },
    {
      id: `${cleanTitle}-4`,
      japaneseHtml: `<ruby>日本<rt>にほん</rt></ruby>の<ruby>本<rt>ほん</rt></ruby>を<ruby>読<rt>よ</rt></ruby>むと、<span class="text-[#e15b64] font-bold">${coreToken}</span>がすぐ<ruby>見<rt>み</rt></ruby>つかります。`,
      plainJapanese: `日本の本を読むと、${coreToken}がすぐ見つかります。`,
      englishHtml: `When you read Japanese books, you quickly spot "<span class="text-[#e15b64] underline decoration-dotted font-semibold">${item.meaning}</span>".`,
      plainEnglish: `When you read Japanese books, you quickly spot "${item.meaning}".`,
      clozePrompt: `日本の本を読むと、____がすぐ見つかります。`,
      clozeAnswer: coreToken,
      clozeHint: item.meaning,
      registerNote: 'Written / reading passage context.',
    },
  ]

  // Build relational graph (Synonyms, Antonyms, Related) from the 979 grammar points if not curated
  const meaningWords = item.meaning
    .toLowerCase()
    .split(/[,/()]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3)

  const dynamicSynonyms: GrammarRelationCard[] =
    curated?.synonyms ||
    (grammarData as GrammarPointSummary[])
      .filter(
        (g) =>
          g.grammar !== item.grammar &&
          meaningWords.some((mw) => g.meaning.toLowerCase().includes(mw))
      )
      .slice(0, 3)
      .map((g, idx) => ({
        grammar: g.grammar.split(' ')[0],
        meaning: g.meaning,
        level: g.level,
        badgeTag: g.lesson ? g.lesson.split(' – ')[0] : g.level,
        comparisonText: `Both ${cleanTitle} (${item.level}) and ${g.grammar.split(' ')[0]} (${g.level}) express "${g.meaning}". However, ${cleanTitle} is introduced in ${item.level} for "${item.meaning}", whereas ${g.grammar.split(' ')[0]} carries a distinct ${idx === 0 ? 'politeness/register' : 'contextual emphasis'} nuance.`,
        registerTag:
          g.level === 'N1' || g.level === 'N2'
            ? 'Literary/Formal'
            : idx % 2 === 0
              ? 'Polite'
              : 'Casual',
      }))

  // Fallback if no exact meaning overlap was found
  if (dynamicSynonyms.length === 0) {
    const sameLessonPeers = (grammarData as GrammarPointSummary[])
      .filter((g) => g.grammar !== item.grammar && g.level === item.level)
      .slice(0, 2)
    sameLessonPeers.forEach((g, idx) => {
      dynamicSynonyms.push({
        grammar: g.grammar.split(' ')[0],
        meaning: g.meaning,
        level: g.level,
        badgeTag: g.lesson ? g.lesson.split(' – ')[0] : g.level,
        comparisonText: `${g.grammar.split(' ')[0]} is studied alongside ${cleanTitle} in ${item.level}. Compare "${item.meaning}" with "${g.meaning}" to master ${item.level} sentence building.`,
        registerTag: idx === 0 ? 'Polite' : 'Casual',
      })
    })
  }

  const dynamicAntonyms: GrammarRelationCard[] =
    curated?.antonyms ||
    (grammarData as GrammarPointSummary[])
      .filter(
        (g) =>
          g.grammar !== item.grammar &&
          g.level === item.level &&
          (g.grammar.includes('ない') ||
            g.meaning.toLowerCase().includes('not') ||
            g.meaning.toLowerCase().includes('without') ||
            g.meaning.toLowerCase().includes('even though'))
      )
      .slice(0, 2)
      .map((g) => ({
        grammar: g.grammar.split(' ')[0],
        meaning: g.meaning,
        level: g.level,
        comparisonText: `While ${cleanTitle} expresses "${item.meaning}", ${g.grammar.split(' ')[0]} contrasts or negates the statement ("${g.meaning}").`,
        registerTag: 'Neutral',
      }))

  const dynamicRelated: GrammarRelationCard[] =
    curated?.related ||
    (grammarData as GrammarPointSummary[])
      .filter(
        (g) =>
          g.grammar !== item.grammar &&
          (g.lesson === item.lesson || g.level === item.level) &&
          !dynamicSynonyms.some((s) => s.grammar === g.grammar.split(' ')[0])
      )
      .slice(0, 3)
      .map((g) => ({
        grammar: g.grammar.split(' ')[0],
        meaning: g.meaning,
        level: g.level,
        comparisonText: `${g.grammar.split(' ')[0]} ("${g.meaning}") belongs to the same ${item.lesson ? item.lesson.split(' – ')[0] : item.level} grammar group and frequently appears in the same sentences as ${cleanTitle}.`,
        registerTag: 'Polite',
      }))

  const defaultVocab: GrammarComponentVocab[] = [
    { word: '今日', reading: 'きょう', meaning: 'today', level: 'N5' },
    { word: '会話', reading: 'かいわ', meaning: 'conversation', level: 'N5' },
    { word: '使う', reading: 'つかう', meaning: 'to use', level: 'N5' },
    { word: '先生', reading: 'せんせい', meaning: 'teacher', level: 'N5' },
    { word: '表現', reading: 'ひょうげん', meaning: 'expression', level: 'N3' },
    { word: '説明', reading: 'せつめい', meaning: 'explanation', level: 'N4' },
    { word: '友達', reading: 'ともだち', meaning: 'friend', level: 'N5' },
    { word: '話す', reading: 'はなす', meaning: 'to speak', level: 'N5' },
    { word: '便利', reading: 'べんり', meaning: 'convenient, useful', level: 'N5' },
    { word: '日本', reading: 'にほん', meaning: 'Japan', level: 'N5' },
    { word: '本', reading: 'ほん', meaning: 'book', level: 'N5' },
    { word: '読む', reading: 'よむ', meaning: 'to read', level: 'N5' },
  ]

  return {
    grammar: item.grammar,
    displayTitle: curated?.displayTitle || matchedCurated?.title || cleanTitle,
    reading: curated?.reading || matchedCurated?.title || cleanTitle,
    meaning: matchedCurated?.meaning || item.meaning,
    level: matchedCurated?.level || item.level,
    lesson: lessonStr,
    cautionBanner:
      curated?.cautionBanner ||
      (matchedCurated ? `Nuance: ${matchedCurated.nuance}` : defaultCaution),
    structures:
      curated?.structures ||
      (matchedCurated ? [matchedCurated.structure] : defaultStructures),
    metadata: curated?.metadata || defaultMetadata,
    aboutParagraphs:
      curated?.aboutParagraphs ||
      (matchedCurated
        ? [matchedCurated.explanation, `Nuance & Context: ${matchedCurated.nuance}`]
        : defaultAbout),
    aboutExamples:
      (curated?.aboutExamples as GrammarExampleItem[]) ||
      (matchedCurated?.examples as unknown as GrammarExampleItem[]) ||
      defaultExamples,
    allExamples:
      (curated?.allExamples as GrammarExampleItem[]) ||
      (matchedCurated?.examples as unknown as GrammarExampleItem[]) || [
        ...(curated?.aboutExamples || defaultExamples),
      ],
    topicCard: curated?.topicCard || {
      title: lessonStr.includes('–')
        ? lessonStr.split(' – ')[1]
        : `${item.level} Core Grammar Path`,
      subtitle: `${item.level} Topic · ${lessonStr.split(' – ')[0]}`,
      description: matchedCurated
        ? matchedCurated.explanation
        : `The goal of this ${item.level} topic is to master "${cleanTitle}" (${item.meaning}) in real Japanese contexts, understand how its social register compares to its synonyms, and apply it effortlessly in reading and conversation.`,
      readTime: '2m',
    },
    synonyms: dynamicSynonyms,
    antonyms: dynamicAntonyms,
    related: dynamicRelated,
    vocabItems: curated?.vocabItems || defaultVocab,
    resources: curated?.resources || {
      mnemonic: `Link "${cleanTitle}" visually to "${item.meaning}" by saying the first example sentence out loud 3 times while picturing the scene.`,
      commonMistake:
        matchedCurated?.nuance ||
        `Learners often confuse ${cleanTitle} with ${dynamicSynonyms[0]?.grammar || 'similar particles'} when switching between casual speech and polite speech.`,
      readingPassageLesson: lessonNum,
    },
  }
}

/**
 * Returns a rich, pedagogical explanation of WHY the specific cloze answer is correct
 * for this exact sentence (e.g. why へ is used for "京都へ行きます" vs に).
 */
export function getWhyAnswerExplanation(
  detail: GrammarPointRichDetail,
  example: GrammarExampleItem
): {
  headline: string
  reason: string
  rule: string
  nuance: string
} {
  const token = example.clozeAnswer.trim()
  const cleanTitle = detail.displayTitle.split(' ')[0]

  const PARTICLE_EXPLANATIONS: Record<string, { reason: string; nuance: string }> = {
    'へ': {
      reason:
        "In this sentence, へ (pronounced 'e') is the directional particle. It marks Kyoto (京都) as the direction of motion for the movement verb 行きます (to go). Motion verbs like 行く, 来る, and 帰る naturally take へ to establish the vector of travel.",
      nuance:
        "へ vs に: へ emphasizes heading toward the destination (the journey/direction), whereas に emphasizes reaching the final destination point. Notice: written with the kana 'へ', but pronounced as 'e'!",
    },
    'は': {
      reason:
        "は (pronounced 'wa') is the topic marker. It sets the overarching topic of the sentence ('As for X...' or 'Speaking of X...'). Everything following it comments on this topic.",
      nuance:
        "は vs が: は introduces known or contextual topics; が marks the grammatical subject and brings focus to the noun before it. Pronounced 'wa' when used as a particle.",
    },
    'が': {
      reason:
        "が is the subject marker. It marks the entity actively performing the action or possessing the condition. It highlights who or what specifically is involved.",
      nuance:
        "Essential with existence verbs (ある, いる), ability/preference adjectives (好き, 上手, わかる), and question words (誰が, 何が).",
    },
    'を': {
      reason:
        "を (pronounced 'o') marks the direct object of a transitive verb. It indicates what receives the direct action (eating an apple, reading a book, studying grammar).",
      nuance:
        "Can also mark an open space or route through which movement occurs (e.g. 空を飛ぶ 'fly through the sky', 公園を歩く 'walk through the park').",
    },
    'に': {
      reason:
        "に indicates a specific temporal point (at 5:00, on Monday), a target arrival destination, or the static location of existence with います / あります.",
      nuance:
        "に marks static presence or exact arrival points; で marks active event locations where actions occur.",
    },
    'で': {
      reason:
        "で marks the location where an activity takes place, or the tool/means/method by which an action is executed (by train, in Japanese, with chopsticks).",
      nuance:
        "で indicates action occurring in a place; に indicates static existence in a place.",
    },
    'の': {
      reason:
        "の links two nouns together to indicate possession, association, or description (Noun1's Noun2 / Noun2 of Noun1).",
      nuance:
        "Can also nominalize verbs/clauses or act as an informal conversational question marker at the end of a sentence.",
    },
    'と': {
      reason:
        "と acts as 'and' for an exhaustive list of nouns, or indicates doing an action together with a partner ('with someone').",
      nuance:
        "と lists all items completely; や lists items non-exhaustively ('things like A and B').",
    },
    'も': {
      reason:
        "も is the inclusive particle meaning 'also' or 'too'. It directly replaces は, が, or を when the same condition applies to another entity.",
      nuance:
        "Can be chained with other particles (e.g., にも 'also to/at', でも 'even by/at').",
    },
    'から': {
      reason:
        "から marks the origin or starting point in space or time ('from...'), or when placed after a sentence/clause, indicates the reason ('because...').",
      nuance:
        "Often paired with まで ('from X until Y').",
    },
    'まで': {
      reason:
        "まで marks the terminal point or boundary in space or time ('until / as far as...').",
      nuance:
        "まで means 'up to and including'; までに means 'by a specific deadline'.",
    },
    'です': {
      reason:
        "です is the polite copula ('to be / is / am / are'). It attaches to nouns and adjectives to make a polite declarative statement.",
      nuance:
        "Unlike casual だ, です can attach directly to both い-adjectives and な-adjectives in standard polite Japanese.",
    },
  }

  const particleKey = Object.keys(PARTICLE_EXPLANATIONS).find(
    (k) => token === k || cleanTitle === k
  )

  if (particleKey) {
    const p = PARTICLE_EXPLANATIONS[particleKey]
    return {
      headline: `Why "${token}"?`,
      reason: p.reason,
      rule: detail.structures[0] || `${cleanTitle} formation`,
      nuance: p.nuance,
    }
  }

  return {
    headline: `Why "${token}"?`,
    reason:
      detail.aboutParagraphs[0] ||
      `In this sentence, "${token}" expresses "${detail.meaning}". It satisfies the ${detail.level} Japanese grammar requirement for this context.`,
    rule: detail.structures[0] || `Pattern: ${cleanTitle}`,
    nuance:
      detail.cautionBanner ||
      `Ensure correct conjugation of the preceding word when attaching ${token}.`,
  }
}

