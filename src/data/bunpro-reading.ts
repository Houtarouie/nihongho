export interface ReadingGrammarNote {
  num: number
  grammar: string
  meaning: string
}

export interface ReadingSentence {
  id: string
  japanese: string // Uses Kanji[furigana] syntax
  english: string
  grammarRefs: number[] // References ReadingGrammarNote.num
}

export interface ReadingPassage {
  id: string // e.g. "N5-1"
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  lessonNumber: number
  titleJp: string
  titleEn: string
  durationLabel: string
  sceneCaption: string
  sceneType: 'classroom' | 'cafe' | 'station' | 'office' | 'shrine'
  grammarNotes: ReadingGrammarNote[]
  sentences: ReadingSentence[]
  comprehensionQuestion: {
    question: string
    options: string[]
    correctIndex: number
    explanation: string
  }
}

const CURATED_PASSAGES: Record<string, Omit<ReadingPassage, 'id' | 'level' | 'lessonNumber'>> = {
  'N5-1': {
    titleJp: '《本[ほん]について話[はな]す》',
    titleEn: 'Talking About Books',
    durationLabel: '00:31',
    sceneCaption: 'Two students comparing textbooks and notebooks in the classroom.',
    sceneType: 'classroom',
    grammarNotes: [
      { num: 1, grammar: 'は', meaning: 'As for... (Highlights sentence topic)' },
      { num: 2, grammar: 'の', meaning: 'Indicates possession (\'s / of)' },
      { num: 3, grammar: 'です', meaning: 'To be, Is (Polite copula)' },
      { num: 4, grammar: 'も', meaning: 'Also, Too, As well' },
      { num: 5, grammar: 'か', meaning: 'Question marking particle' },
      { num: 6, grammar: 'いい', meaning: 'い-Adjective meaning "good"' },
    ],
    sentences: [
      {
        id: 's1',
        japanese: 'これは私[わたし]の本[ほん]です。これも私[わたし]の本[ほん]です。',
        english: 'This is my book. This is also my book.',
        grammarRefs: [1, 2, 3, 4],
      },
      {
        id: 's2',
        japanese: 'これは田中先生[たなかせんせい]の本[ほん]です。これも田中先生[たなかせんせい]の本[ほん]です。',
        english: "This is Professor Tanaka's book. This is also Professor Tanaka's book.",
        grammarRefs: [1, 2, 3, 4],
      },
      {
        id: 's3',
        japanese: 'これは山田先生[やまだせんせい]の本[ほん]ですか。',
        english: "Is this Professor Yamada's book?",
        grammarRefs: [1, 2, 3, 5],
      },
      {
        id: 's4',
        japanese: 'これはあなたの本[ほん]です。これもあなたの本[ほん]ですか。',
        english: 'This is your book. Is this also your book?',
        grammarRefs: [1, 2, 3, 4, 5],
      },
      {
        id: 's5',
        japanese: 'これはいい本[ほん]です。これもいい本[ほん]です。これもいい本[ほん]ですか。',
        english: 'This is a good book. This is also a good book. Is this a good book too?',
        grammarRefs: [1, 3, 4, 5, 6],
      },
    ],
    comprehensionQuestion: {
      question: 'Whose books are being discussed in the second and third lines?',
      options: [
        'Professor Tanaka and Professor Yamada',
        'Kenji and Sakura',
        'Only the speaker’s family',
        'A bookstore clerk',
      ],
      correctIndex: 0,
      explanation: 'Lines 2 and 3 specifically ask about 田中先生の本 (Professor Tanaka\'s book) and 山田先生の本 (Professor Yamada\'s book).',
    },
  },
  'N5-2': {
    titleJp: '《まいにちの朝[あさ]ごはんと学校[がっこう]》',
    titleEn: 'Daily Breakfast and School',
    durationLabel: '00:38',
    sceneCaption: 'Having breakfast at home before heading to the train station.',
    sceneType: 'cafe',
    grammarNotes: [
      { num: 1, grammar: 'が', meaning: 'Subject marking particle' },
      { num: 2, grammar: 'を', meaning: 'Direct object marking particle' },
      { num: 3, grammar: 'ます', meaning: 'Polite verb ending' },
      { num: 4, grammar: 'と', meaning: 'And (connecting nouns)' },
      { num: 5, grammar: 'よ・ね', meaning: 'Emphasis and confirmation particles' },
    ],
    sentences: [
      {
        id: 's1',
        japanese: '私[わたし]はまいにちパンと卵[たまご]を食[た]べますよ。',
        english: 'I eat bread and eggs every day, you know.',
        grammarRefs: [2, 3, 4, 5],
      },
      {
        id: 's2',
        japanese: 'コーヒーは飲[の]みません。水[みず]とお茶[ちゃ]を飲[の]みます。',
        english: 'I do not drink coffee. I drink water and green tea.',
        grammarRefs: [2, 3, 4],
      },
      {
        id: 's3',
        japanese: 'ここは私[わたし]の学校[がっこう]ですね。学生[がくせい]が来[き]ます。',
        english: 'This place here is my school, right? Students come here.',
        grammarRefs: [1, 3, 5],
      },
      {
        id: 's4',
        japanese: 'あそこで日本語[にほんご]の本[ほん]を読[よ]みます。',
        english: 'Over there, I read Japanese books.',
        grammarRefs: [2, 3],
      },
    ],
    comprehensionQuestion: {
      question: 'What does the speaker NOT drink in the morning?',
      options: ['Water (水)', 'Coffee (コーヒー)', 'Green tea (お茶)', 'Milk (牛乳)'],
      correctIndex: 1,
      explanation: 'The speaker states「コーヒーは飲みません」(I do not drink coffee).',
    },
  },
  'N5-3': {
    titleJp: '《図書館[としょかん]での勉強[べんきょう]》',
    titleEn: 'Studying at the Library',
    durationLabel: '00:42',
    sceneCaption: 'Friends meeting at the town library on Saturday morning.',
    sceneType: 'classroom',
    grammarNotes: [
      { num: 1, grammar: 'で', meaning: 'At, In (location of action)' },
      { num: 2, grammar: 'に', meaning: 'At, To, On (time / destination)' },
      { num: 3, grammar: 'がある・がいる', meaning: 'There is (inanimate / animate)' },
      { num: 4, grammar: 'でしょう', meaning: 'Probably, Right?' },
      { num: 5, grammar: '〜んです', meaning: 'Explanatory tone (The fact is...)' },
    ],
    sentences: [
      {
        id: 's1',
        japanese: '土曜日[どようび]に友[とも]だちと図書館[としょかん]で勉強[べんきょう]します。',
        english: 'On Saturday, I study at the library with my friend.',
        grammarRefs: [1, 2],
      },
      {
        id: 's2',
        japanese: 'この図書館[としょかん]にはたくさんの本[ほん]があるんです。',
        english: 'The thing is, there are lots of books in this library.',
        grammarRefs: [2, 3, 5],
      },
      {
        id: 's3',
        japanese: 'あそこに優[やさ]しい先生[せんせい]がいるでしょう。',
        english: 'There is a kind teacher over there, right?',
        grammarRefs: [3, 4],
      },
      {
        id: 's4',
        japanese: 'きのうのテストはとても難[むずか]しかったです。',
        english: "Yesterday's test was very difficult.",
        grammarRefs: [1],
      },
    ],
    comprehensionQuestion: {
      question: 'Where and with whom does the speaker study on Saturday?',
      options: [
        'At home alone',
        'At the library with a friend',
        'At a cafe with a teacher',
        'In the park with classmates',
      ],
      correctIndex: 1,
      explanation: '「土曜日に友だちと図書館で勉強します」means studying at the library with a friend on Saturday.',
    },
  },
  'N4-1': {
    titleJp: '《日本語[にほんご]の勉強法[べんきょうほう]》',
    titleEn: 'Ways of Studying Japanese',
    durationLabel: '00:45',
    sceneCaption: 'Reviewing kanji flashcards and grammar notes at a desk.',
    sceneType: 'office',
    grammarNotes: [
      { num: 1, grammar: '〜やすい・〜にくい', meaning: 'Easy to do / Difficult to do' },
      { num: 2, grammar: 'だんだん', meaning: 'Gradually, Little by little' },
      { num: 3, grammar: '〜ていく・〜てくる', meaning: 'To go on doing / To come to be' },
      { num: 4, grammar: '〜かた', meaning: 'Way of doing, How to ~' },
      { num: 5, grammar: '〜ないで', meaning: 'Without doing ~' },
    ],
    sentences: [
      {
        id: 's1',
        japanese: 'この辞書[じしょ]は字[じ]が大[おお]きくて、とても読[よ]みやすいです。',
        english: 'This dictionary has large print and is very easy to read.',
        grammarRefs: [1],
      },
      {
        id: 's2',
        japanese: '長[なが]い漢字[かんじ]の書[か]きかたは覚[おぼ]えにくいですが、まいにち練習[れんしゅう]しています。',
        english: 'How to write complex kanji is hard to memorize, but I practice every day.',
        grammarRefs: [1, 4],
      },
      {
        id: 's3',
        japanese: '辞書[じしょ]を見[み]ないで、日本語[にほんご]のニュースがだんだんわかるようになってきました。',
        english: 'Without looking at a dictionary, I have gradually come to understand Japanese news.',
        grammarRefs: [2, 3, 5],
      },
    ],
    comprehensionQuestion: {
      question: 'Why does the speaker like this dictionary?',
      options: [
        'Because it is cheap',
        'Because the letters are large and easy to read (読みやすい)',
        'Because it has English comics',
        'Because a friend gave it to them',
      ],
      correctIndex: 1,
      explanation: 'The passage says「この辞書は字が大きくて、とても読みやすいです」.',
    },
  },
}

export const ALL_CURATED_PASSAGES: ReadingPassage[] = [
  { id: 'N5-1', level: 'N5', lessonNumber: 1, ...CURATED_PASSAGES['N5-1'] },
  { id: 'N5-2', level: 'N5', lessonNumber: 2, ...CURATED_PASSAGES['N5-2'] },
  { id: 'N5-3', level: 'N5', lessonNumber: 3, ...CURATED_PASSAGES['N5-3'] },
  { id: 'N4-1', level: 'N4', lessonNumber: 1, ...CURATED_PASSAGES['N4-1'] },
]

export function getReadingPassage(
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
  lessonNumber: number
): ReadingPassage {
  const key = `${level}-${lessonNumber}`
  if (CURATED_PASSAGES[key]) {
    return {
      id: key,
      level,
      lessonNumber,
      ...CURATED_PASSAGES[key],
    }
  }
  return ALL_CURATED_PASSAGES[0]
}
