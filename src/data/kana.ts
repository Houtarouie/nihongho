export interface KanaItem {
  kana: string
  romaji: string
  example?: string
  row: string
}

export interface KanaRow {
  rowName: string
  items: (KanaItem | null)[]
}

export const HIRAGANA_GOJUON: KanaRow[] = [
  {
    rowName: 'あ (Vowels)',
    items: [
      { kana: 'あ', romaji: 'a', example: 'あめ (ame - rain)', row: 'a' },
      { kana: 'い', romaji: 'i', example: 'いぬ (inu - dog)', row: 'a' },
      { kana: 'う', romaji: 'u', example: 'うみ (umi - sea)', row: 'a' },
      { kana: 'え', romaji: 'e', example: 'えき (eki - station)', row: 'a' },
      { kana: 'お', romaji: 'o', example: 'おちゃ (ocha - tea)', row: 'a' },
    ],
  },
  {
    rowName: 'か (K)',
    items: [
      { kana: 'か', romaji: 'ka', example: 'かさ (kasa - umbrella)', row: 'ka' },
      { kana: 'き', romaji: 'ki', example: 'き (ki - tree)', row: 'ka' },
      { kana: 'く', romaji: 'ku', example: 'くるま (kuruma - car)', row: 'ka' },
      { kana: 'け', romaji: 'ke', example: 'けさ (kesa - this morning)', row: 'ka' },
      { kana: 'こ', romaji: 'ko', example: 'こども (kodomo - child)', row: 'ka' },
    ],
  },
  {
    rowName: 'さ (S)',
    items: [
      { kana: 'さ', romaji: 'sa', example: 'さくら (sakura - cherry blossom)', row: 'sa' },
      { kana: 'し', romaji: 'shi', example: 'しろ (shiro - white)', row: 'sa' },
      { kana: 'す', romaji: 'su', example: 'すし (sushi)', row: 'sa' },
      { kana: 'せ', romaji: 'se', example: 'せんせい (sensei - teacher)', row: 'sa' },
      { kana: 'そ', romaji: 'so', example: 'そら (sora - sky)', row: 'sa' },
    ],
  },
  {
    rowName: 'た (T)',
    items: [
      { kana: 'た', romaji: 'ta', example: 'たべる (taberu - to eat)', row: 'ta' },
      { kana: 'ち', romaji: 'chi', example: 'ちず (chizu - map)', row: 'ta' },
      { kana: 'つ', romaji: 'tsu', example: 'つき (tsuki - moon)', row: 'ta' },
      { kana: 'て', romaji: 'te', example: 'てがみ (tegami - letter)', row: 'ta' },
      { kana: 'と', romaji: 'to', example: 'とり (tori - bird)', row: 'ta' },
    ],
  },
  {
    rowName: 'な (N)',
    items: [
      { kana: 'な', romaji: 'na', example: 'なつ (natsu - summer)', row: 'na' },
      { kana: 'に', romaji: 'ni', example: 'にほん (nihon - Japan)', row: 'na' },
      { kana: 'ぬ', romaji: 'nu', example: 'ぬの (nuno - cloth)', row: 'na' },
      { kana: 'ね', romaji: 'ne', example: 'ねこ (neko - cat)', row: 'na' },
      { kana: 'の', romaji: 'no', example: 'のむ (nomu - to drink)', row: 'na' },
    ],
  },
  {
    rowName: 'は (H)',
    items: [
      { kana: 'は', romaji: 'ha', example: 'はな (hana - flower)', row: 'ha' },
      { kana: 'ひ', romaji: 'hi', example: 'ひと (hito - person)', row: 'ha' },
      { kana: 'ふ', romaji: 'fu', example: 'ふゆ (fuyu - winter)', row: 'ha' },
      { kana: 'へ', romaji: 'he', example: 'へや (heya - room)', row: 'ha' },
      { kana: 'ほ', romaji: 'ho', example: 'ほし (hoshi - star)', row: 'ha' },
    ],
  },
  {
    rowName: 'ま (M)',
    items: [
      { kana: 'ま', romaji: 'ma', example: 'まど (mado - window)', row: 'ma' },
      { kana: 'み', romaji: 'mi', example: 'みず (mizu - water)', row: 'ma' },
      { kana: 'む', romaji: 'mu', example: 'むし (mushi - insect)', row: 'ma' },
      { kana: 'め', romaji: 'me', example: 'め (me - eye)', row: 'ma' },
      { kana: 'も', romaji: 'mo', example: 'もり (mori - forest)', row: 'ma' },
    ],
  },
  {
    rowName: 'や (Y)',
    items: [
      { kana: 'や', romaji: 'ya', example: 'やま (yama - mountain)', row: 'ya' },
      null,
      { kana: 'ゆ', romaji: 'yu', example: 'ゆき (yuki - snow)', row: 'ya' },
      null,
      { kana: 'よ', romaji: 'yo', example: 'よる (yoru - night)', row: 'ya' },
    ],
  },
  {
    rowName: 'ら (R)',
    items: [
      { kana: 'ら', romaji: 'ra', example: 'らいねん (rainen - next year)', row: 'ra' },
      { kana: 'り', romaji: 'ri', example: 'りんご (ringo - apple)', row: 'ra' },
      { kana: 'る', romaji: 'ru', example: 'るす (rusu - absence)', row: 'ra' },
      { kana: 'れ', romaji: 're', example: 'れきし (rekishi - history)', row: 'ra' },
      { kana: 'ろ', romaji: 'ro', example: 'ろく (roku - six)', row: 'ra' },
    ],
  },
  {
    rowName: 'わ (W/N)',
    items: [
      { kana: 'わ', romaji: 'wa', example: 'わたし (watashi - I)', row: 'wa' },
      null,
      { kana: 'ん', romaji: 'n', example: 'ほん (hon - book)', row: 'wa' },
      null,
      { kana: 'を', romaji: 'wo (o)', example: 'みずをのむ (drink water)', row: 'wa' },
    ],
  },
]

export const HIRAGANA_DAKUTEN: KanaRow[] = [
  {
    rowName: 'が (G)',
    items: [
      { kana: 'が', romaji: 'ga', example: 'がっこう (gakkou - school)', row: 'ga' },
      { kana: 'ぎ', romaji: 'gi', example: 'ぎんこう (ginkou - bank)', row: 'ga' },
      { kana: 'ぐ', romaji: 'gu', example: 'ぐんて (gunte - gloves)', row: 'ga' },
      { kana: 'げ', romaji: 'ge', example: 'げんき (genki - healthy)', row: 'ga' },
      { kana: 'ご', romaji: 'go', example: 'ごはん (gohan - rice/meal)', row: 'ga' },
    ],
  },
  {
    rowName: 'ざ (Z)',
    items: [
      { kana: 'ざ', romaji: 'za', example: 'ざっし (zasshi - magazine)', row: 'za' },
      { kana: 'じ', romaji: 'ji', example: 'じしょ (jisho - dictionary)', row: 'za' },
      { kana: 'ず', romaji: 'zu', example: 'しずか (shizuka - quiet)', row: 'za' },
      { kana: 'ぜ', romaji: 'ze', example: 'かぜ (kaze - wind)', row: 'za' },
      { kana: 'ぞ', romaji: 'zo', example: 'かぞく (kazoku - family)', row: 'za' },
    ],
  },
  {
    rowName: 'だ (D)',
    items: [
      { kana: 'だ', romaji: 'da', example: 'だいがく (daigaku - university)', row: 'da' },
      { kana: 'ぢ', romaji: 'ji (di)', example: 'はなぢ (hanaji - nosebleed)', row: 'da' },
      { kana: 'づ', romaji: 'zu (du)', example: 'つづく (tsuzuku - continue)', row: 'da' },
      { kana: 'で', romaji: 'de', example: 'でんしゃ (densha - train)', row: 'da' },
      { kana: 'ど', romaji: 'do', example: 'どこ (doko - where)', row: 'da' },
    ],
  },
  {
    rowName: 'ば (B)',
    items: [
      { kana: 'ば', romaji: 'ba', example: 'かばん (kaban - bag)', row: 'ba' },
      { kana: 'び', romaji: 'bi', example: 'びょういん (byouin - hospital)', row: 'ba' },
      { kana: 'ぶ', romaji: 'bu', example: 'しんぶん (shinbun - newspaper)', row: 'ba' },
      { kana: 'べ', romaji: 'be', example: 'べんきょう (benkyou - study)', row: 'ba' },
      { kana: 'ぼ', romaji: 'bo', example: 'ぼうし (boushi - hat)', row: 'ba' },
    ],
  },
  {
    rowName: 'ぱ (P)',
    items: [
      { kana: 'ぱ', romaji: 'pa', example: 'ぱん (pan - bread)', row: 'pa' },
      { kana: 'ぴ', romaji: 'pi', example: 'えんぴつ (enpitsu - pencil)', row: 'pa' },
      { kana: 'ぷ', romaji: 'pu', example: 'てんぷら (tenpura)', row: 'pa' },
      { kana: 'ぺ', romaji: 'pe', example: 'ぺん (pen)', row: 'pa' },
      { kana: 'ぽ', romaji: 'po', example: 'さんぽ (sanpo - walk)', row: 'pa' },
    ],
  },
]

export const HIRAGANA_YOON: KanaRow[] = [
  {
    rowName: 'きゃ',
    items: [
      { kana: 'きゃ', romaji: 'kya', example: 'きゃく (kyaku - guest)', row: 'kya' },
      { kana: 'きゅ', romaji: 'kyu', example: 'きゅう (kyuu - nine)', row: 'kya' },
      { kana: 'きょ', romaji: 'kyo', example: 'きょう (kyou - today)', row: 'kya' },
    ],
  },
  {
    rowName: 'しゃ',
    items: [
      { kana: 'しゃ', romaji: 'sha', example: 'しゃしん (shashin - photo)', row: 'sha' },
      { kana: 'しゅ', romaji: 'shu', example: 'しゅみ (shumi - hobby)', row: 'sha' },
      { kana: 'しょ', romaji: 'sho', example: 'しょくじ (shokuji - meal)', row: 'sha' },
    ],
  },
  {
    rowName: 'ちゃ',
    items: [
      { kana: 'ちゃ', romaji: 'cha', example: 'おちゃ (ocha - green tea)', row: 'cha' },
      { kana: 'ちゅ', romaji: 'chu', example: 'ちゅうごく (chuugoku - China)', row: 'cha' },
      { kana: 'ちょ', romaji: 'cho', example: 'ちょっと (chotto - a little)', row: 'cha' },
    ],
  },
  {
    rowName: 'にゃ',
    items: [
      { kana: 'にゃ', romaji: 'nya', example: 'にゃんこ (nyanko - kitty)', row: 'nya' },
      { kana: 'にゅ', romaji: 'nyu', example: 'にゅうがく (nyuugaku - entry)', row: 'nya' },
      { kana: 'にょ', romaji: 'nyo', example: 'にょうぼう (nyoubou - wife)', row: 'nya' },
    ],
  },
  {
    rowName: 'ひゃ',
    items: [
      { kana: 'ひゃ', romaji: 'hya', example: 'ひゃく (hyaku - hundred)', row: 'hya' },
      { kana: 'ひゅ', romaji: 'hyu', example: 'ひゅうが (Hyuuga)', row: 'hya' },
      { kana: 'ひょ', romaji: 'hyo', example: 'ひょう (hyou - table/chart)', row: 'hya' },
    ],
  },
  {
    rowName: 'みゃ',
    items: [
      { kana: 'みゃ', romaji: 'mya', example: 'みゃく (myaku - pulse)', row: 'mya' },
      { kana: 'みゅ', romaji: 'myu', example: 'みゅーじっく (music)', row: 'mya' },
      { kana: 'みょ', romaji: 'myo', example: 'みょうじ (myouji - surname)', row: 'mya' },
    ],
  },
  {
    rowName: 'りゃ',
    items: [
      { kana: 'りゃ', romaji: 'rya', example: 'りゃく (ryaku - abbreviation)', row: 'rya' },
      { kana: 'りゅ', romaji: 'ryu', example: 'りゅうがく (ryuugaku - study abroad)', row: 'rya' },
      { kana: 'りょ', romaji: 'ryo', example: 'りょこう (ryokou - travel)', row: 'rya' },
    ],
  },
  {
    rowName: 'ぎゃ',
    items: [
      { kana: 'ぎゃ', romaji: 'gya', example: 'ぎゃく (gyaku - reverse)', row: 'gya' },
      { kana: 'ぎゅ', romaji: 'gyu', example: 'ぎゅうにゅう (gyuunyuu - milk)', row: 'gya' },
      { kana: 'ぎょ', romaji: 'gyo', example: 'きんぎょ (kingyo - goldfish)', row: 'gya' },
    ],
  },
  {
    rowName: 'じゃ',
    items: [
      { kana: 'じゃ', romaji: 'ja', example: 'じゃあね (jaa ne - see ya)', row: 'ja' },
      { kana: 'じゅ', romaji: 'ju', example: 'じゅう (juu - ten)', row: 'ja' },
      { kana: 'じょ', romaji: 'jo', example: 'じょうず (jouzu - skilled)', row: 'ja' },
    ],
  },
  {
    rowName: 'びゃ',
    items: [
      { kana: 'びゃ', romaji: 'bya', example: 'さんびゃく (sanbyaku - 300)', row: 'bya' },
      { kana: 'びゅ', romaji: 'byu', example: 'びゅう (byuu - whoosh)', row: 'bya' },
      { kana: 'びょ', romaji: 'byo', example: 'びょういん (byouin - hospital)', row: 'bya' },
    ],
  },
  {
    rowName: 'ぴゃ',
    items: [
      { kana: 'ぴゃ', romaji: 'pya', example: 'ろっぴゃく (roppyaku - 600)', row: 'pya' },
      { kana: 'ぴゅ', romaji: 'pyu', example: 'ぴゅーま (puma)', row: 'pya' },
      { kana: 'ぴょ', romaji: 'pyo', example: 'はっぴょう (happyou - presentation)', row: 'pya' },
    ],
  },
]

export const KATAKANA_GOJUON: KanaRow[] = [
  {
    rowName: 'ア (Vowels)',
    items: [
      { kana: 'ア', romaji: 'a', example: 'アメリカ (Amerika - USA)', row: 'a' },
      { kana: 'イ', romaji: 'i', example: 'インド (Indo - India)', row: 'a' },
      { kana: 'ウ', romaji: 'u', example: 'ウール (uuru - wool)', row: 'a' },
      { kana: 'エ', romaji: 'e', example: 'エレベーター (erebeetaa - elevator)', row: 'a' },
      { kana: 'オ', romaji: 'o', example: 'オレンジ (orenji - orange)', row: 'a' },
    ],
  },
  {
    rowName: 'カ (K)',
    items: [
      { kana: 'カ', romaji: 'ka', example: 'カメラ (kamera - camera)', row: 'ka' },
      { kana: 'キ', romaji: 'ki', example: 'キッチン (kitchin - kitchen)', row: 'ka' },
      { kana: 'ク', romaji: 'ku', example: 'クラス (kurasu - class)', row: 'ka' },
      { kana: 'ケ', romaji: 'ke', example: 'ケーキ (keeki - cake)', row: 'ka' },
      { kana: 'コ', romaji: 'ko', example: 'コーヒー (koohii - coffee)', row: 'ka' },
    ],
  },
  {
    rowName: 'サ (S)',
    items: [
      { kana: 'サ', romaji: 'sa', example: 'サラダ (sarada - salad)', row: 'sa' },
      { kana: 'シ', romaji: 'shi', example: 'シャツ (shatsu - shirt)', row: 'sa' },
      { kana: 'ス', romaji: 'su', example: 'スマホ (sumaho - smartphone)', row: 'sa' },
      { kana: 'セ', romaji: 'se', example: 'セーター (seetaa - sweater)', row: 'sa' },
      { kana: 'ソ', romaji: 'so', example: 'ソファ (sofa)', row: 'sa' },
    ],
  },
  {
    rowName: 'タ (T)',
    items: [
      { kana: 'タ', romaji: 'ta', example: 'タクシー (takushii - taxi)', row: 'ta' },
      { kana: 'チ', romaji: 'chi', example: 'チーズ (chiizu - cheese)', row: 'ta' },
      { kana: 'ツ', romaji: 'tsu', example: 'ツアー (tsuaa - tour)', row: 'ta' },
      { kana: 'テ', romaji: 'te', example: 'テレビ (terebi - TV)', row: 'ta' },
      { kana: 'ト', romaji: 'to', example: 'トイレ (toire - restroom)', row: 'ta' },
    ],
  },
  {
    rowName: 'ナ (N)',
    items: [
      { kana: 'ナ', romaji: 'na', example: 'ナイフ (naifu - knife)', row: 'na' },
      { kana: 'ニ', romaji: 'ni', example: 'ニュース (nyuusu - news)', row: 'na' },
      { kana: 'ヌ', romaji: 'nu', example: 'カヌー (kanuu - canoe)', row: 'na' },
      { kana: 'ネ', romaji: 'ne', example: 'ネクタイ (nekutai - necktie)', row: 'na' },
      { kana: 'ノ', romaji: 'no', example: 'ノート (nooto - notebook)', row: 'na' },
    ],
  },
  {
    rowName: 'ハ (H)',
    items: [
      { kana: 'ハ', romaji: 'ha', example: 'ハンバーガー (hamburger)', row: 'ha' },
      { kana: 'ヒ', romaji: 'hi', example: 'ヒーター (hiitaa - heater)', row: 'ha' },
      { kana: 'フ', romaji: 'fu', example: 'フォーク (fooku - fork)', row: 'ha' },
      { kana: 'ヘ', romaji: 'he', example: 'ヘルメット (herumetto - helmet)', row: 'ha' },
      { kana: 'ホ', romaji: 'ho', example: 'ホテル (hoteru - hotel)', row: 'ha' },
    ],
  },
  {
    rowName: 'マ (M)',
    items: [
      { kana: 'マ', romaji: 'ma', example: 'マンガ (manga)', row: 'ma' },
      { kana: 'ミ', romaji: 'mi', example: 'ミルク (miruku - milk)', row: 'ma' },
      { kana: 'ム', romaji: 'mu', example: 'ゲーム (geemu - game)', row: 'ma' },
      { kana: 'メ', romaji: 'me', example: 'メニュー (menyuu - menu)', row: 'ma' },
      { kana: 'モ', romaji: 'mo', example: 'モデル (moderu - model)', row: 'ma' },
    ],
  },
  {
    rowName: 'ヤ (Y)',
    items: [
      { kana: 'ヤ', romaji: 'ya', example: 'タイヤ (taiya - tire)', row: 'ya' },
      null,
      { kana: 'ユ', romaji: 'yu', example: 'ユニフォーム (uniform)', row: 'ya' },
      null,
      { kana: 'ヨ', romaji: 'yo', example: 'ヨーロッパ (Europe)', row: 'ya' },
    ],
  },
  {
    rowName: 'ラ (R)',
    items: [
      { kana: 'ラ', romaji: 'ra', example: 'ラーメン (raamen - ramen)', row: 'ra' },
      { kana: 'リ', romaji: 'ri', example: 'リモコン (rimokon - remote)', row: 'ra' },
      { kana: 'ル', romaji: 'ru', example: 'ルール (ruuru - rule)', row: 'ra' },
      { kana: 'レ', romaji: 're', example: 'レストラン (resutoran - restaurant)', row: 'ra' },
      { kana: 'ロ', romaji: 'ro', example: 'ロボット (robotto - robot)', row: 'ra' },
    ],
  },
  {
    rowName: 'ワ (W/N)',
    items: [
      { kana: 'ワ', romaji: 'wa', example: 'ワイン (wain - wine)', row: 'wa' },
      null,
      { kana: 'ン', romaji: 'n', example: 'パン (pan - bread)', row: 'wa' },
      null,
      { kana: 'ヲ', romaji: 'wo (o)', example: 'ヲタク (wotaku)', row: 'wa' },
    ],
  },
]

export const KATAKANA_DAKUTEN: KanaRow[] = [
  {
    rowName: 'ガ (G)',
    items: [
      { kana: 'ガ', romaji: 'ga', example: 'ガラス (garasu - glass)', row: 'ga' },
      { kana: 'ギ', romaji: 'gi', example: 'ギター (gitaa - guitar)', row: 'ga' },
      { kana: 'グ', romaji: 'gu', example: 'グラス (gurasu - drinking glass)', row: 'ga' },
      { kana: 'ゲ', romaji: 'ge', example: 'ゲーム (geemu - game)', row: 'ga' },
      { kana: 'ゴ', romaji: 'go', example: 'ゴルフ (gorufu - golf)', row: 'ga' },
    ],
  },
  {
    rowName: 'ザ (Z)',
    items: [
      { kana: 'ザ', romaji: 'za', example: 'ピザ (piza - pizza)', row: 'za' },
      { kana: 'ジ', romaji: 'ji', example: 'ジュース (juusu - juice)', row: 'za' },
      { kana: 'ズ', romaji: 'zu', example: 'ズボン (zubon - trousers)', row: 'za' },
      { kana: 'ゼ', romaji: 'ze', example: 'ゼロ (zero - zero)', row: 'za' },
      { kana: 'ゾ', romaji: 'zo', example: 'ゾーン (zoon - zone)', row: 'za' },
    ],
  },
  {
    rowName: 'ダ (D)',
    items: [
      { kana: 'ダ', romaji: 'da', example: 'ダンス (dansu - dance)', row: 'da' },
      { kana: 'ヂ', romaji: 'ji (di)', example: 'ハナヂ (hanaji - nosebleed)', row: 'da' },
      { kana: 'ヅ', romaji: 'zu (du)', example: 'ツヅク (tsuzuku - continue)', row: 'da' },
      { kana: 'デ', romaji: 'de', example: 'デザイン (dezain - design)', row: 'da' },
      { kana: 'ド', romaji: 'do', example: 'ドア (doa - door)', row: 'da' },
    ],
  },
  {
    rowName: 'バ (B)',
    items: [
      { kana: 'バ', romaji: 'ba', example: 'バス (basu - bus)', row: 'ba' },
      { kana: 'ビ', romaji: 'bi', example: 'ビール (biiru - beer)', row: 'ba' },
      { kana: 'ブ', romaji: 'bu', example: 'テーブル (teeburu - table)', row: 'ba' },
      { kana: 'ベ', romaji: 'be', example: 'ベッド (beddo - bed)', row: 'ba' },
      { kana: 'ボ', romaji: 'bo', example: 'ボール (booru - ball)', row: 'ba' },
    ],
  },
  {
    rowName: 'パ (P)',
    items: [
      { kana: 'パ', romaji: 'pa', example: 'パソコン (pasokon - PC)', row: 'pa' },
      { kana: 'ピ', romaji: 'pi', example: 'ピアノ (piano)', row: 'pa' },
      { kana: 'プ', romaji: 'pu', example: 'プール (puuru - pool)', row: 'pa' },
      { kana: 'ペ', romaji: 'pe', example: 'ペット (petto - pet)', row: 'pa' },
      { kana: 'ポ', romaji: 'po', example: 'ポケット (poketto - pocket)', row: 'pa' },
    ],
  },
]

export const KATAKANA_YOON: KanaRow[] = [
  {
    rowName: 'キャ',
    items: [
      { kana: 'キャ', romaji: 'kya', example: 'キャンプ (kyanpu - camp)', row: 'kya' },
      { kana: 'キュ', romaji: 'kyu', example: 'バーベキュー (BBQ)', row: 'kya' },
      { kana: 'キョ', romaji: 'kyo', example: 'キョート (Kyoto)', row: 'kya' },
    ],
  },
  {
    rowName: 'シャ',
    items: [
      { kana: 'シャ', romaji: 'sha', example: 'シャワー (shawaa - shower)', row: 'sha' },
      { kana: 'シュ', romaji: 'shu', example: 'シューズ (shuuzu - shoes)', row: 'sha' },
      { kana: 'ショ', romaji: 'sho', example: 'ショッピング (shopping)', row: 'sha' },
    ],
  },
  {
    rowName: 'チャ',
    items: [
      { kana: 'チャ', romaji: 'cha', example: 'チャンス (chansu - chance)', row: 'cha' },
      { kana: 'チュ', romaji: 'chu', example: 'シチュー (shichuu - stew)', row: 'cha' },
      { kana: 'チョ', romaji: 'cho', example: 'チョコレート (chocolate)', row: 'cha' },
    ],
  },
  {
    rowName: 'ニャ',
    items: [
      { kana: 'ニャ', romaji: 'nya', example: 'ニャー (nyaa - meow)', row: 'nya' },
      { kana: 'ニュ', romaji: 'nyu', example: 'ニュース (nyuusu - news)', row: 'nya' },
      { kana: 'ニョ', romaji: 'nyo', example: 'ニョッキ (gnocchi)', row: 'nya' },
    ],
  },
  {
    rowName: 'ヒャ',
    items: [
      { kana: 'ヒャ', romaji: 'hya', example: 'ヒャク (hyaku)', row: 'hya' },
      { kana: 'ヒュ', romaji: 'hyu', example: 'ヒューマン (human)', row: 'hya' },
      { kana: 'ヒョ', romaji: 'hyo', example: 'ヒョウ (hyou - leopard)', row: 'hya' },
    ],
  },
  {
    rowName: 'ミャ',
    items: [
      { kana: 'ミャ', romaji: 'mya', example: 'ミャンマー (Myanmar)', row: 'mya' },
      { kana: 'ミュ', romaji: 'myu', example: 'ミュージック (music)', row: 'mya' },
      { kana: 'ミョ', romaji: 'myo', example: 'ミョウバン (alum)', row: 'mya' },
    ],
  },
  {
    rowName: 'リャ',
    items: [
      { kana: 'リャ', romaji: 'rya', example: 'リャマ (llama)', row: 'rya' },
      { kana: 'リュ', romaji: 'ryu', example: 'リュック (rucksack)', row: 'rya' },
      { kana: 'リョ', romaji: 'ryo', example: 'マトリョーシカ (matryoshka)', row: 'rya' },
    ],
  },
  {
    rowName: 'ギャ',
    items: [
      { kana: 'ギャ', romaji: 'gya', example: 'ギャラリー (gallery)', row: 'gya' },
      { kana: 'ギュ', romaji: 'gyu', example: 'フィギュア (figure)', row: 'gya' },
      { kana: 'ギョ', romaji: 'gyo', example: 'ギョーザ (gyoza)', row: 'gya' },
    ],
  },
  {
    rowName: 'ジャ',
    items: [
      { kana: 'ジャ', romaji: 'ja', example: 'ジャケット (jacket)', row: 'ja' },
      { kana: 'ジュ', romaji: 'ju', example: 'ジュース (juice)', row: 'ja' },
      { kana: 'ジョ', romaji: 'jo', example: 'ジョギング (jogging)', row: 'ja' },
    ],
  },
  {
    rowName: 'ビャ',
    items: [
      { kana: 'ビャ', romaji: 'bya', example: 'ビャクダン (sandalwood)', row: 'bya' },
      { kana: 'ビュ', romaji: 'byu', example: 'ビュッフェ (buffet)', row: 'bya' },
      { kana: 'ビョ', romaji: 'byo', example: 'ビョウ (second)', row: 'bya' },
    ],
  },
  {
    rowName: 'ピャ',
    items: [
      { kana: 'ピャ', romaji: 'pya', example: 'ピャー (sound effect)', row: 'pya' },
      { kana: 'ピュ', romaji: 'pyu', example: 'コンピュータ (computer)', row: 'pya' },
      { kana: 'ピョ', romaji: 'pyo', example: 'ピョンヤン (Pyongyang)', row: 'pya' },
    ],
  },
]

export interface LessonItem {
  id: string
  sectionNumber: number
  title: string
  subtitle: string
  jlptLevel: string
  summary: string
  keyPoints: {
    japanese: string
    reading: string
    romaji: string
    english: string
    note: string
  }[]
}

export const CURRICULUM_LESSONS: LessonItem[] = [
  {
    id: 'greetings-aisatsu',
    sectionNumber: 2,
    title: 'Basic Greetings (挨拶 - Aisatsu)',
    subtitle: 'Essential daily expressions for polite conversation.',
    jlptLevel: 'N5',
    summary:
      'Japanese greetings (Aisatsu) change depending on the time of day and your relationship with the listener. Mastering these phrases is the fastest way to start speaking naturally.',
    keyPoints: [
      {
        japanese: 'おはようございます',
        reading: 'おはようございます',
        romaji: 'Ohayou gozaimasu',
        english: 'Good morning (Polite)',
        note: 'Drop ございます (gozaimasu) with close friends and family.',
      },
      {
        japanese: 'こんにちは',
        reading: 'こんにちは',
        romaji: 'Konnichiwa',
        english: 'Hello / Good afternoon',
        note: 'Spelled with the topic particle は (wa) at the end, not わ.',
      },
      {
        japanese: 'こんばんは',
        reading: 'こんばんは',
        romaji: 'Konbanwa',
        english: 'Good evening',
        note: 'Also spelled with は (wa) at the end.',
      },
      {
        japanese: 'ありがとうございます',
        reading: 'ありがとうございます',
        romaji: 'Arigatou gozaimasu',
        english: 'Thank you very much',
        note: 'Use ありがとうございました when thanking someone for something already completed.',
      },
      {
        japanese: 'すみません',
        reading: 'すみません',
        romaji: 'Sumimasen',
        english: 'Excuse me / I am sorry / Thank you for the trouble',
        note: 'Used to get attention at restaurants, apologize lightly, or express gratitude.',
      },
    ],
  },
  {
    id: 'self-introduction',
    sectionNumber: 2,
    title: 'Self Introduction (自己紹介 - Jikoshoukai)',
    subtitle: 'Introduce your name, nationality, and occupation.',
    jlptLevel: 'N5',
    summary:
      'A standard Japanese self-introduction starts with はじめまして (Nice to meet you), states your name and background using [Topic] は [Noun] です, and closes with よろしくお願いします.',
    keyPoints: [
      {
        japanese: 'はじめまして。',
        reading: 'はじめまして。',
        romaji: 'Hajimemashite.',
        english: 'Nice to meet you (for the first time).',
        note: 'Always used as the very first phrase when meeting someone new.',
      },
      {
        japanese: 'わたしは ケンジ です。',
        reading: 'わたしは けんじ です。',
        romaji: 'Watashi wa Kenji desu.',
        english: 'I am Kenji.',
        note: 'In natural conversation you can also just say「ケンジです」.',
      },
      {
        japanese: 'にほんごの がくせい です。',
        reading: 'にほんごの がくせい です。',
        romaji: 'Nihongo no gakusei desu.',
        english: 'I am a student of Japanese.',
        note: 'の (no) connects two nouns together.',
      },
      {
        japanese: 'どうぞ よろしく おねがいします。',
        reading: 'どうぞ よろしく おねがいします。',
        romaji: 'Douzo yoroshiku onegaishimasu.',
        english: 'Pleased to meet you / Please treat me well.',
        note: 'Essential closing phrase in every self-introduction.',
      },
    ],
  },
  {
    id: 'wa-vs-ga',
    sectionNumber: 3,
    title: 'Sentence Structure: は vs が & Core Particles',
    subtitle: 'Understand how Japanese particles glue sentences together.',
    jlptLevel: 'N5',
    summary:
      'Japanese uses word-order Subject–Object–Verb (SOV). Particles attach after nouns to show their grammatical role: は marks the topic ("As for X..."), が identifies the specific subject, and を marks the direct object.',
    keyPoints: [
      {
        japanese: 'わたしは りんごを たべます。',
        reading: 'わたしは りんごを たべます。',
        romaji: 'Watashi wa ringo wo tabemasu.',
        english: 'I eat an apple.',
        note: 'は marks the topic (I), を marks the direct object (apple), and the verb comes at the end.',
      },
      {
        japanese: 'だれが きましたか？ ―― たけしさんが きました。',
        reading: 'だれが きましたか？ ―― たけしさんが きました。',
        romaji: 'Dare ga kimashita ka? — Takeshi-san ga kimashita.',
        english: 'Who came? — Takeshi came.',
        note: 'Use が (not は) with question words like だれ (who) and when introducing new/specific subject information.',
      },
      {
        japanese: 'まいにち としょかんで べんきょうします。',
        reading: 'まいにち としょかんで べんきょうします。',
        romaji: 'Mainichi toshokan de benkyou shimasu.',
        english: 'I study at the library every day.',
        note: 'で marks the location where an action takes place.',
      },
      {
        japanese: 'あした とうきょうに いきます。',
        reading: 'あした とうきょうに いきます。',
        romaji: 'Ashita Toukyou ni ikimasu.',
        english: 'I will go to Tokyo tomorrow.',
        note: 'に (or へ) marks destination of movement.',
      },
    ],
  },
  {
    id: 'tai-form',
    sectionNumber: 4,
    title: 'Expressing Desires: 「〜たい」 (Want to do)',
    subtitle: 'Conjugate verbs into the ~tai form to say what you want to do.',
    jlptLevel: 'N5',
    summary:
      'To say "I want to [verb]", take the polite ます (masu) stem of a verb, drop ます, and attach たいです (tai desu). Because 〜たい behaves like an い-adjective, its negative is 〜たくないです (do not want to) and past is 〜たかったです (wanted to).',
    keyPoints: [
      {
        japanese: 'にほんへ いきたいです。',
        reading: 'にほんへ いきたいです。',
        romaji: 'Nihon e ikitai desu.',
        english: 'I want to go to Japan.',
        note: 'いきます (ikimasu) → いき (stem) + たいです = いきたいです.',
      },
      {
        japanese: 'すしを たべたいです。',
        reading: 'すしを たべたいです。',
        romaji: 'Sushi wo tabetai desu.',
        english: 'I want to eat sushi.',
        note: 'With 〜たい, the object can be marked with either を or が (すしが たべたいです).',
      },
      {
        japanese: 'きょうは なにも したくないです。',
        reading: 'きょうは なにも したくないです。',
        romaji: 'Kyou wa nanimo shitakunai desu.',
        english: 'I do not want to do anything today.',
        note: 'します → したい → したくない (negative i-adjective conjugation).',
      },
      {
        japanese: 'あたらしい カメラが ほしいです。',
        reading: 'あたらしい かめらが ほしいです。',
        romaji: 'Atarashii kamera ga hoshii desu.',
        english: 'I want a new camera.',
        note: 'Use [Verb stem + たい] for wanting to DO an action, and [Noun + が ほしい] for wanting a THING.',
      },
    ],
  },
]
