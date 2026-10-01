/**
 * Comprehensive Japanese Romaji -> Hiragana Live IME Converter
 * Supports standard Hepburn, Kunrei-shiki, sokuon (double consonants),
 * combos (yoon), and intelligent trailing 'n' resolution.
 */

const ROMAJI_TO_HIRAGANA_MAP: Record<string, string> = {
  // Single vowels
  a: 'あ',
  i: 'い',
  u: 'う',
  e: 'え',
  o: 'お',

  // K
  ka: 'か',
  ki: 'き',
  ku: 'く',
  ke: 'け',
  ko: 'こ',
  kya: 'きゃ',
  kyu: 'きゅ',
  kye: 'きぇ',
  kyo: 'きょ',

  // S
  sa: 'さ',
  si: 'し',
  shi: 'し',
  su: 'す',
  se: 'せ',
  so: 'そ',
  sha: 'しゃ',
  shu: 'しゅ',
  she: 'しぇ',
  sho: 'しょ',
  sya: 'しゃ',
  syu: 'しゅ',
  sye: 'しぇ',
  syo: 'しょ',

  // T
  ta: 'た',
  ti: 'ち',
  chi: 'ち',
  tu: 'つ',
  tsu: 'つ',
  te: 'て',
  to: 'と',
  cha: 'ちゃ',
  chu: 'ちゅ',
  che: 'ちぇ',
  cho: 'ちょ',
  tya: 'ちゃ',
  tyu: 'ちゅ',
  tye: 'ちぇ',
  tyo: 'ちょ',

  // N
  na: 'な',
  ni: 'に',
  nu: 'ぬ',
  ne: 'ね',
  no: 'の',
  nya: 'にゃ',
  nyu: 'にゅ',
  nye: 'にぇ',
  nyo: 'にょ',

  // H & F
  ha: 'は',
  hi: 'ひ',
  hu: 'ふ',
  fu: 'ふ',
  he: 'へ',
  ho: 'ほ',
  hya: 'ひゃ',
  hyu: 'ひゅ',
  hye: 'ひぇ',
  hyo: 'ひょ',
  fa: 'ふぁ',
  fi: 'ふぃ',
  fe: 'ふぇ',
  fo: 'ふぉ',
  fyu: 'ふゅ',

  // M
  ma: 'ま',
  mi: 'み',
  mu: 'む',
  me: 'め',
  mo: 'も',
  mya: 'みゃ',
  myu: 'みゅ',
  mye: 'みぇ',
  myo: 'みょ',

  // Y
  ya: 'や',
  yu: 'ゆ',
  yo: 'よ',

  // R & L
  ra: 'ら',
  ri: 'り',
  ru: 'る',
  re: 'れ',
  ro: 'ろ',
  rya: 'りゃ',
  ryu: 'りゅ',
  rye: 'りぇ',
  ryo: 'りょ',
  la: 'ら',
  li: 'り',
  lu: 'る',
  le: 'れ',
  lo: 'ろ',

  // W
  wa: 'わ',
  wi: 'うぃ',
  we: 'うぇ',
  wo: 'を',

  // G
  ga: 'が',
  gi: 'ぎ',
  gu: 'ぐ',
  ge: 'げ',
  go: 'ご',
  gya: 'ぎゃ',
  gyu: 'ぎゅ',
  gye: 'ぎぇ',
  gyo: 'ぎょ',

  // Z
  za: 'ざ',
  zi: 'じ',
  ji: 'じ',
  zu: 'ず',
  ze: 'ぜ',
  zo: 'ぞ',
  ja: 'じゃ',
  ju: 'じゅ',
  je: 'じぇ',
  jo: 'じょ',
  jya: 'じゃ',
  jyu: 'じゅ',
  jye: 'じぇ',
  jyo: 'じょ',
  zya: 'じゃ',
  zyu: 'じゅ',
  zye: 'じぇ',
  zyo: 'じょ',

  // D
  da: 'だ',
  di: 'ぢ',
  du: 'づ',
  de: 'で',
  do: 'ど',
  dya: 'ぢゃ',
  dyu: 'ぢゅ',
  dye: 'ぢぇ',
  dyo: 'ぢょ',

  // B
  ba: 'ば',
  bi: 'び',
  bu: 'ぶ',
  be: 'べ',
  bo: 'ぼ',
  bya: 'びゃ',
  byu: 'びゅ',
  bye: 'びぇ',
  byo: 'びょ',

  // P
  pa: 'ぱ',
  pi: 'ぴ',
  pu: 'ぷ',
  pe: 'ぺ',
  po: 'ぽ',
  pya: 'ぴゃ',
  pyu: 'ぴゅ',
  pye: 'ぴぇ',
  pyo: 'ぴょ',

  // V
  va: 'ゔぁ',
  vi: 'ゔぃ',
  vu: 'ゔ',
  ve: 'ゔぇ',
  vo: 'ゔぉ',

  // Special / Small
  xa: 'ぁ',
  xi: 'ぃ',
  xu: 'ぅ',
  xe: 'ぇ',
  xo: 'ぉ',
  xtsu: 'っ',
  xtu: 'っ',
  xya: 'ゃ',
  xyu: 'ゅ',
  xyo: 'ょ',
  xwa: 'ゎ',
  ltsu: 'っ',
  ltu: 'っ',

  // Punctuation
  '-': 'ー',
  '.': '。',
  ',': '、',
  '?': '？',
  '!': '！',
  '~': '〜',
}

/**
 * Converts a string of Romaji to Hiragana in real time as the user types.
 *
 * @param input Raw text from user's keystrokes
 * @param options.finalizeTrailingN If true (e.g. on Enter/submit), a trailing single 'n' converts to 'ん'
 */
export function convertRomajiToKana(
  input: string,
  options?: { finalizeTrailingN?: boolean }
): string {
  if (!input) return ''

  let result = ''
  let i = 0
  const lower = input.toLowerCase()

  while (i < lower.length) {
    const char = lower[i]

    // If character is already Japanese or whitespace, keep as-is
    if (
      /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\s]/.test(input[i])
    ) {
      result += input[i]
      i++
      continue
    }

    // Double 'n' -> 'ん'
    if (char === 'n') {
      if (i + 1 < lower.length && lower[i + 1] === 'n') {
        result += 'ん'
        i += 2
        continue
      }
      if (i + 1 < lower.length && lower[i + 1] === "'") {
        result += 'ん'
        i += 2
        continue
      }
      // 'n' followed by consonant other than 'y' or vowels -> 'ん'
      if (
        i + 1 < lower.length &&
        !/[aeiouy]/.test(lower[i + 1]) &&
        /[a-z]/.test(lower[i + 1])
      ) {
        result += 'ん'
        i++
        continue
      }
      // Trailing 'n' at end of string
      if (i + 1 === lower.length) {
        if (options?.finalizeTrailingN) {
          result += 'ん'
        } else {
          result += 'n'
        }
        i++
        continue
      }
    }

    // Double consonant (sokuon っ): e.g. tt, kk, ss, pp, cc, dd, gg, bb, zz, jj
    if (
      i + 1 < lower.length &&
      char === lower[i + 1] &&
      /[bcdfghjklmpqrstvwxyz]/.test(char) &&
      char !== 'n'
    ) {
      result += 'っ'
      i++
      continue
    }

    // Special case: 'tch' -> 'っち'
    if (
      char === 't' &&
      i + 2 < lower.length &&
      lower[i + 1] === 'c' &&
      lower[i + 2] === 'h'
    ) {
      result += 'っ'
      i++
      continue
    }

    // Check 4-char match
    const sub4 = lower.slice(i, i + 4)
    if (ROMAJI_TO_HIRAGANA_MAP[sub4]) {
      result += ROMAJI_TO_HIRAGANA_MAP[sub4]
      i += 4
      continue
    }

    // Check 3-char match (e.g. kya, sha, tsu, chi)
    const sub3 = lower.slice(i, i + 3)
    if (ROMAJI_TO_HIRAGANA_MAP[sub3]) {
      result += ROMAJI_TO_HIRAGANA_MAP[sub3]
      i += 3
      continue
    }

    // Check 2-char match (e.g. da, ka, te, no, su)
    const sub2 = lower.slice(i, i + 2)
    if (ROMAJI_TO_HIRAGANA_MAP[sub2]) {
      result += ROMAJI_TO_HIRAGANA_MAP[sub2]
      i += 2
      continue
    }

    // Check 1-char match (e.g. a, i, u, e, o, punctuation)
    if (ROMAJI_TO_HIRAGANA_MAP[char]) {
      result += ROMAJI_TO_HIRAGANA_MAP[char]
      i++
      continue
    }

    // Unmatched character (e.g. partial pending consonant like 'd', 'k', 's')
    result += input[i]
    i++
  }

  return result
}

/**
 * Converts Katakana to Hiragana for uniform answer normalization
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30a1-\u30f6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  )
}

/**
 * Robust answer checker:
 * Handles direct kana match, automatic romaji->kana conversion,
 * katakana/hiragana parity, and optional alternate answers.
 */
export function isAnswerMatching(
  userInput: string,
  expectedAnswer: string,
  alternateAnswers: string[] = []
): boolean {
  const normalize = (s: string) => {
    const finalized = convertRomajiToKana(s.trim(), {
      finalizeTrailingN: true,
    })
    return katakanaToHiragana(finalized)
      .replace(/[。、.!?\s~〜]/g, '')
      .toLowerCase()
  }

  const cleanUser = normalize(userInput)
  if (!cleanUser) return false

  const candidates = [expectedAnswer, ...alternateAnswers].map(normalize)
  return candidates.includes(cleanUser)
}
