import {
  HIRAGANA_GOJUON,
  HIRAGANA_DAKUTEN,
  HIRAGANA_YOON,
  KATAKANA_GOJUON,
  KATAKANA_DAKUTEN,
  KATAKANA_YOON,
  type KanaItem,
} from '@/data/kana'

/**
 * Cognitive Science "Confusion Pairs" (Visual & Phonetic look-alikes in Hiragana & Katakana)
 * Used for Discrimination Practice so distractors are genuinely challenging look-alikes.
 */
export const KANA_CONFUSION_GROUPS: Record<string, string[]> = {
  // Katakana notorious look-alikes
  シ: ['ツ', 'ン', 'ソ', 'ミ'],
  ツ: ['シ', 'ソ', 'ン', 'ミ'],
  ソ: ['ン', 'シ', 'ツ', 'ノ'],
  ン: ['ソ', 'シ', 'ツ', 'ノ'],
  ア: ['マ', 'ヤ', 'ム'],
  マ: ['ア', 'ム', 'ヤ'],
  ク: ['タ', 'ケ', 'ワ', 'フ'],
  タ: ['ク', 'ヌ', 'ケ'],
  コ: ['ユ', 'ヨ', 'ロ'],
  ユ: ['コ', 'ヨ', 'エ'],
  ウ: ['ワ', 'フ', 'ラ'],
  ワ: ['ウ', 'フ', 'ク'],
  ヌ: ['ス', 'フ', 'タ'],
  ス: ['ヌ', 'マ', 'フ'],
  チ: ['テ', 'ナ', 'ラ'],
  テ: ['チ', 'ラ', 'ナ'],
  // Hiragana notorious look-alikes
  あ: ['お', 'め', 'ぬ'],
  お: ['あ', 'す', 'む'],
  ね: ['れ', 'わ', 'ぬ'],
  れ: ['ね', 'わ', 'い'],
  わ: ['ね', 'れ', 'ち'],
  ぬ: ['め', 'ね', 'あ'],
  め: ['ぬ', 'あ', 'の'],
  る: ['ろ', 'そ', 'う'],
  ろ: ['る', 'そ', 'ら'],
  さ: ['き', 'ち', 'ら'],
  き: ['さ', 'ま', 'も'],
  は: ['ほ', 'ま', 'よ'],
  ほ: ['は', 'ま', 'よ'],
  ち: ['ら', 'さ', 'ろ'],
  ら: ['ち', 'ろ', 'う'],
  い: ['り', 'こ', 'け'],
  り: ['い', 'け', 'に'],
}

export const CONFUSION_MNEMONICS: Record<string, string> = {
  シ: 'シ (shi): The two small strokes are horizontal (left-to-right), sweeping UP from the bottom.',
  ツ: 'ツ (tsu): The two small strokes are vertical (top-to-bottom), sweeping DOWN from the top.',
  ソ: 'ソ (so): Starts at the top and sweeps DOWN (like ツ but with 1 dot).',
  ン: 'ン (n): Starts at the left and sweeps UP (like シ but with 1 dot).',
  ね: 'ね (ne): Ends with a little loop at the bottom right (like a cat ねこ curling its tail).',
  れ: 'れ (re): Kicks outward at the bottom right with NO loop.',
  わ: 'わ (wa): Smooth round curve on the right with NO loop and NO outward kick.',
  ぬ: 'ぬ (nu): Has a loop at the bottom right (noodles ぬ are loopy!).',
  め: 'め (me): Same shape as ぬ, but NO loop at the end.',
  る: 'る (ru): Has a small loop at the bottom (ruby loop).',
  ろ: 'ろ (ro): Same as る, but NO loop at the bottom.',
  さ: 'さ (sa): Has 1 horizontal bar across the top.',
  き: 'き (ki): Has 2 horizontal bars across the top (looks like a key).',
  は: 'は (ha): No top hat above the right loop.',
  ほ: 'ほ (ho): Has a top horizontal roof over the right side (2 horizontal lines).',
}

export type KanaDeckScope =
  | 'gojuon'
  | 'dakuten'
  | 'yoon'
  | 'confusion'
  | 'all'
  | 'custom'

export function getKanaPool(
  script: 'hiragana' | 'katakana' | 'both',
  scope: KanaDeckScope
): KanaItem[] {
  const rows = []
  if (script === 'hiragana' || script === 'both') {
    if (scope === 'gojuon' || scope === 'all' || scope === 'confusion')
      rows.push(...HIRAGANA_GOJUON)
    if (scope === 'dakuten' || scope === 'all') rows.push(...HIRAGANA_DAKUTEN)
    if (scope === 'yoon' || scope === 'all') rows.push(...HIRAGANA_YOON)
  }
  if (script === 'katakana' || script === 'both') {
    if (scope === 'gojuon' || scope === 'all' || scope === 'confusion')
      rows.push(...KATAKANA_GOJUON)
    if (scope === 'dakuten' || scope === 'all') rows.push(...KATAKANA_DAKUTEN)
    if (scope === 'yoon' || scope === 'all') rows.push(...KATAKANA_YOON)
  }

  const flat: KanaItem[] = []
  for (const r of rows) {
    for (const item of r.items) {
      if (item) flat.push(item)
    }
  }

  if (scope === 'confusion') {
    const confusionItems = flat.filter((i) => KANA_CONFUSION_GROUPS[i.kana])
    return confusionItems.length >= 4 ? confusionItems : flat
  }

  return flat
}

/**
 * Generates 4 multiple-choice options prioritizing Confusion Pairs (look-alikes)
 * instead of trivially easy random distractors.
 */
export function buildSmartDistractors(
  target: KanaItem,
  pool: KanaItem[],
  mode: 'kana-to-romaji' | 'romaji-to-kana'
): string[] {
  const correctValue =
    mode === 'kana-to-romaji' ? cleanRomaji(target.romaji) : target.kana

  const isHiragana = /^[\u3040-\u309f]/.test(target.kana)
  const isKatakana = /^[\u30a0-\u30ff]/.test(target.kana)
  const matchesScript = (kana: string) => {
    if (isHiragana) return /^[\u3040-\u309f]/.test(kana)
    if (isKatakana) return /^[\u30a0-\u30ff]/.test(kana)
    return true
  }

  const lookAlikeKanas = (KANA_CONFUSION_GROUPS[target.kana] || []).filter(matchesScript)
  const lookAlikeItems = pool.filter(
    (p) => lookAlikeKanas.includes(p.kana) && matchesScript(p.kana)
  )

  const candidateValues: string[] = []
  for (const item of lookAlikeItems) {
    const val =
      mode === 'kana-to-romaji' ? cleanRomaji(item.romaji) : item.kana
    if (val !== correctValue && !candidateValues.includes(val)) {
      candidateValues.push(val)
    }
  }

  // Fill remaining slots from current pool matching script
  for (const item of pool) {
    if (candidateValues.length >= 3) break
    if (mode === 'romaji-to-kana' && !matchesScript(item.kana)) continue
    const val =
      mode === 'kana-to-romaji' ? cleanRomaji(item.romaji) : item.kana
    if (val !== correctValue && !candidateValues.includes(val)) {
      candidateValues.push(val)
    }
  }

  // If pool was small (e.g. only 2 or 5 items selected), pull extra distractors from base gojuon pool of the target script
  if (candidateValues.length < 3) {
    const targetScript = isHiragana ? 'hiragana' : isKatakana ? 'katakana' : 'both'
    const fallbackPool = getKanaPool(targetScript, 'gojuon')
    for (const item of fallbackPool) {
      if (candidateValues.length >= 3) break
      if (mode === 'romaji-to-kana' && !matchesScript(item.kana)) continue
      const val =
        mode === 'kana-to-romaji' ? cleanRomaji(item.romaji) : item.kana
      if (val !== correctValue && !candidateValues.includes(val)) {
        candidateValues.push(val)
      }
    }
  }

  const options = [correctValue, ...candidateValues.slice(0, 3)]
  // Deterministic sort based on string characters so SSR/CSR stay consistent
  return options.sort((a, b) => a.localeCompare(b))
}

export function cleanRomaji(romaji: string): string {
  return romaji.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase()
}

export interface SentenceScrambleItem {
  id: string
  english: string
  hint: string
  jlptLevel: string
  correctTiles: string[]
  distractorTiles: string[]
  fullJapanese: string
}

export const SENTENCE_SCRAMBLE_CHALLENGES: SentenceScrambleItem[] = [
  {
    id: 'sent-1',
    english: 'I eat an apple every day.',
    hint: 'Use は for topic and を for direct object (SOV order).',
    jlptLevel: 'N5',
    correctTiles: ['わたし', 'は', 'まいにち', 'りんご', 'を', 'たべます'],
    distractorTiles: ['が', 'に'],
    fullJapanese: 'わたしはまいにちりんごをたべます',
  },
  {
    id: 'sent-2',
    english: 'I want to go to Japan next year.',
    hint: 'Time + Destination + へ + Verb (~たいです).',
    jlptLevel: 'N5',
    correctTiles: ['らいねん', 'にほん', 'へ', 'いきたい', 'です'],
    distractorTiles: ['を', 'で'],
    fullJapanese: 'らいねんにほんへいきたいです',
  },
  {
    id: 'sent-3',
    english: 'I study Japanese at the library.',
    hint: 'Use で to mark the location where an action happens.',
    jlptLevel: 'N5',
    correctTiles: ['としょかん', 'で', 'にほんご', 'を', 'べんきょうします'],
    distractorTiles: ['に', 'へ'],
    fullJapanese: 'としょかんでにほんごをべんきょうします',
  },
  {
    id: 'sent-4',
    english: 'Please wait a moment.',
    hint: 'Polite request using て-form + ください.',
    jlptLevel: 'N5',
    correctTiles: ['ちょっと', 'まって', 'ください'],
    distractorTiles: ['まちます', 'ないで'],
    fullJapanese: 'ちょっとまってください',
  },
  {
    id: 'sent-5',
    english: 'Have you ever seen Mt. Fuji?',
    hint: 'Past experience uses Verb [た-form] + ことがありますか.',
    jlptLevel: 'N5',
    correctTiles: ['ふじさん', 'を', 'みた', 'ことが', 'ありますか'],
    distractorTiles: ['みる', 'たい'],
    fullJapanese: 'ふじさんをみたことがありますか',
  },
  {
    id: 'sent-6',
    english: 'You should take some medicine.',
    hint: 'Advice uses Verb [た-form] + ほうがいいです.',
    jlptLevel: 'N5',
    correctTiles: ['くすり', 'を', 'のんだ', 'ほうが', 'いいです'],
    distractorTiles: ['のむ', 'つもり'],
    fullJapanese: 'くすりをのんだほうがいいです',
  },
]
