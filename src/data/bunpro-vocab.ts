export interface VocabExampleSentence {
  japanese: string // Supports Kanji[furigana]
  english: string
}

export interface BunproVocabItem {
  id: string
  word: string
  furigana: string
  romaji: string
  meaning: string
  partOfSpeech: string
  pitchAccent: string // e.g. "[0] 平板 (Heiban)" or "[2] 中高 (Nakadaka)"
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  listCategory: 'JLPT' | 'Bunpro Core' | 'Textbook (Genki)' | 'Community'
  sentences: VocabExampleSentence[]
}

export const BUNPRO_VOCAB_ITEMS: BunproVocabItem[] = [
  // N5
  {
    id: 'bv-1',
    word: '私',
    furigana: 'わたし',
    romaji: 'watashi',
    meaning: 'I, me, myself',
    partOfSpeech: 'Pronoun',
    pitchAccent: '[0] 平板',
    jlptLevel: 'N5',
    listCategory: 'JLPT',
    sentences: [
      {
        japanese: 'これは私[わたし]の本[ほん]です。',
        english: 'This is my book.',
      },
      {
        japanese: '私[わたし]は日本語[にほんご]の学生[がくせい]です。',
        english: 'I am a Japanese language student.',
      },
    ],
  },
  {
    id: 'bv-2',
    word: '先生',
    furigana: 'せんせい',
    romaji: 'sensei',
    meaning: 'teacher, professor, doctor, master',
    partOfSpeech: 'Noun',
    pitchAccent: '[3] 尾高',
    jlptLevel: 'N5',
    listCategory: 'JLPT',
    sentences: [
      {
        japanese: 'これは田中先生[たなかせんせい]の本[ほん]です。',
        english: "This is Professor Tanaka's book.",
      },
      {
        japanese: '山田先生[やまだせんせい]はとても優[やさ]しいです。',
        english: 'Professor Yamada is very kind.',
      },
    ],
  },
  {
    id: 'bv-3',
    word: '図書館',
    furigana: 'としょかん',
    romaji: 'toshokan',
    meaning: 'library',
    partOfSpeech: 'Noun',
    pitchAccent: '[2] 中高',
    jlptLevel: 'N5',
    listCategory: 'Textbook (Genki)',
    sentences: [
      {
        japanese: 'まいにち図書館[としょかん]で勉強[べんきょう]します。',
        english: 'I study at the library every day.',
      },
      {
        japanese: '図書館[としょかん]で本[ほん]を借[か]りました。',
        english: 'I borrowed a book from the library.',
      },
    ],
  },
  {
    id: 'bv-4',
    word: '電車',
    furigana: 'でんしゃ',
    romaji: 'densha',
    meaning: 'train, electric train',
    partOfSpeech: 'Noun',
    pitchAccent: '[0] 平板 / [1] 頭高',
    jlptLevel: 'N5',
    listCategory: 'Bunpro Core',
    sentences: [
      {
        japanese: '毎朝[まいあさ]、電車[でんしゃ]で会社[かいしゃ]へ行[い]きます。',
        english: 'Every morning, I go to the office by train.',
      },
      {
        japanese: '次[つぎ]の電車[でんしゃ]は何時[なんじ]ですか。',
        english: 'What time is the next train?',
      },
    ],
  },
  // N4
  {
    id: 'bv-5',
    word: '約束',
    furigana: 'やくそく',
    romaji: 'yakusoku',
    meaning: 'promise, appointment, engagement',
    partOfSpeech: 'Noun / Suru-Verb',
    pitchAccent: '[0] 平板',
    jlptLevel: 'N4',
    listCategory: 'JLPT',
    sentences: [
      {
        japanese: '今日[きょう]は友[とも]だちと約束[やくそく]があります。',
        english: 'Today I have an appointment with a friend.',
      },
      {
        japanese: '約束[やくそく]の時間[じかん]に遅[おく]れないでください。',
        english: 'Please do not be late for the promised time.',
      },
    ],
  },
  {
    id: 'bv-6',
    word: '準備',
    furigana: 'じゅんび',
    romaji: 'junbi',
    meaning: 'preparation, arrangements, setup',
    partOfSpeech: 'Noun / Suru-Verb',
    pitchAccent: '[1] 頭高',
    jlptLevel: 'N4',
    listCategory: 'Bunpro Core',
    sentences: [
      {
        japanese: '旅行[りょこう]の準備[じゅんび]はもう終[お]わりましたか。',
        english: 'Have you already finished preparing for the trip?',
      },
      {
        japanese: '試験[しけん]のためにしっかり準備[じゅんび]しました。',
        english: 'I prepared thoroughly for the exam.',
      },
    ],
  },
  {
    id: 'bv-7',
    word: '経験',
    furigana: 'けいけん',
    romaji: 'keiken',
    meaning: 'experience, personal knowledge',
    partOfSpeech: 'Noun / Suru-Verb',
    pitchAccent: '[0] 平板',
    jlptLevel: 'N4',
    listCategory: 'Textbook (Genki)',
    sentences: [
      {
        japanese: '日本[にほん]での生活[せいかつ]はとてもいい経験[けいけん]になりました。',
        english: 'Living in Japan became a very good experience.',
      },
      {
        japanese: 'いろんなことを経験[けいけん]したいです。',
        english: 'I want to experience various things.',
      },
    ],
  },
  // N3
  {
    id: 'bv-8',
    word: '影響',
    furigana: 'えいきょう',
    romaji: 'eikyou',
    meaning: 'influence, effect, impact',
    partOfSpeech: 'Noun / Suru-Verb',
    pitchAccent: '[0] 平板',
    jlptLevel: 'N3',
    listCategory: 'JLPT',
    sentences: [
      {
        japanese: '台風[たいふう]の影響[えいきょう]で電車[でんしゃ]が止[と]まっています。',
        english: 'Due to the influence of the typhoon, the trains are stopped.',
      },
      {
        japanese: '彼[かれ]の音楽[おんがく]に大[おお]きな影響[えいきょう]を受[う]けました。',
        english: 'I was greatly influenced by his music.',
      },
    ],
  },
  {
    id: 'bv-9',
    word: '雰囲気',
    furigana: 'ふんいき',
    romaji: 'fun-iki',
    meaning: 'atmosphere, mood, ambiance, vibe',
    partOfSpeech: 'Noun',
    pitchAccent: '[3] 中高',
    jlptLevel: 'N3',
    listCategory: 'Community',
    sentences: [
      {
        japanese: 'このカフェはとても落[お]ち着[つ]いた雰囲気[ふんいき]ですね。',
        english: 'This cafe has a very calm atmosphere, doesn’t it?',
      },
      {
        japanese: 'なんだかいつもと違[ちが]う雰囲気[ふんいき]がする。',
        english: 'Somehow it feels like a different vibe than usual.',
      },
    ],
  },
  {
    id: 'bv-10',
    word: '確認',
    furigana: 'かくにん',
    romaji: 'kakunin',
    meaning: 'confirmation, verification, check',
    partOfSpeech: 'Noun / Suru-Verb',
    pitchAccent: '[0] 平板',
    jlptLevel: 'N3',
    listCategory: 'Bunpro Core',
    sentences: [
      {
        japanese: '念[ねん]のため、もういちど予定[よてい]を確認[かくにん]しましょう。',
        english: 'Just to be sure, let’s confirm the schedule one more time.',
      },
      {
        japanese: 'メールの内容[ないよう]をご確認[かくにん]ください。',
        english: 'Please check the contents of the email.',
      },
    ],
  },
  // N2
  {
    id: 'bv-11',
    word: '把握',
    furigana: 'はあく',
    romaji: 'haaku',
    meaning: 'grasp, catch, understanding thoroughly',
    partOfSpeech: 'Noun / Suru-Verb',
    pitchAccent: '[0] 平板',
    jlptLevel: 'N2',
    listCategory: 'JLPT',
    sentences: [
      {
        japanese: '現状[げんじょう]を正確[せいかく]に把握[はあく]することが重要[じゅうよう]だ。',
        english: 'It is important to accurately grasp the current situation.',
      },
      {
        japanese: '問題[もんだい]の原因[げんいん]をまだ把握[はあく]できていない。',
        english: 'We have not yet been able to grasp the cause of the problem.',
      },
    ],
  },
  {
    id: 'bv-12',
    word: '妥協',
    furigana: 'だきょう',
    romaji: 'dakyou',
    meaning: 'compromise, giving in',
    partOfSpeech: 'Noun / Suru-Verb',
    pitchAccent: '[0] 平板',
    jlptLevel: 'N2',
    listCategory: 'Community',
    sentences: [
      {
        japanese: '品質[ひんしつ]にかけては決[けっ]して妥協[だきょう]しないつもりだ。',
        english: 'When it comes to quality, I intend never to compromise.',
      },
      {
        japanese: 'お互[たが]いに少[すこ]しずつ妥協[だきょう]して合意[ごうい]に至[いた]った。',
        english: 'We compromised a little with each other and reached an agreement.',
      },
    ],
  },
  // N1
  {
    id: 'bv-13',
    word: '顕著',
    furigana: 'けんちょ',
    romaji: 'kencho',
    meaning: 'remarkable, striking, conspicuous, notable',
    partOfSpeech: 'な-Adjective / Noun',
    pitchAccent: '[1] 頭高',
    jlptLevel: 'N1',
    listCategory: 'JLPT',
    sentences: [
      {
        japanese: '近年[きんねん]、地球温暖化[ちきゅうおんだいか]の影響[えいきょう]が顕著[けんちょ]に表[あらわ]れている。',
        english: 'In recent years, the effects of global warming have appeared conspicuously.',
      },
      {
        japanese: 'その地域[ちいき]では人口減少[じんこうげんしょう]の傾向[けいこう]が特[とく]に顕著[けんちょ]だ。',
        english: 'In that region, the trend of population decline is particularly striking.',
      },
    ],
  },
  {
    id: 'bv-14',
    word: '不可欠',
    furigana: 'ふかけつ',
    romaji: 'fukaketsu',
    meaning: 'indispensable, essential, vital',
    partOfSpeech: 'な-Adjective / Noun',
    pitchAccent: '[0] 平板',
    jlptLevel: 'N1',
    listCategory: 'Bunpro Core',
    sentences: [
      {
        japanese: '信頼関係[しんらいかんけい]はチームワークにおいて不可欠[ふかけつ]な要素[ようそ]である。',
        english: 'A relationship of trust is an indispensable element in teamwork.',
      },
      {
        japanese: '語学[ごがく]の習得[しゅうとく]には毎日[まいにち]の継続[けいぞく]が不可欠[ふかけつ]だ。',
        english: 'Daily continuation is essential for mastering a language.',
      },
    ],
  },
]
