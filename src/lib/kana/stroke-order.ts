import rawKanaStrokes from '@/data/kana-strokes.json'

export interface StrokeNumberPosition {
  num: number
  x: number
  y: number
}

export interface KanaStrokeData {
  char: string
  strokes: string[]
  numbers: StrokeNumberPosition[]
  strokeCount: number
  tip?: string
}

export interface WritingGuideRule {
  title: string
  description: string
  example: string
}

export const CALLIGRAPHY_RULES: WritingGuideRule[] = [
  {
    title: 'Top to Bottom',
    description: 'Always begin writing strokes that appear higher in the character before lower ones.',
    example: '三 (ichi, ni, san) - top horizontal line first.',
  },
  {
    title: 'Left to Right',
    description: 'Strokes placed on the left side of a character are written before those on the right.',
    example: 'い (i) - left hook first, right shorter stroke second.',
  },
  {
    title: 'Horizontal before Intersecting Vertical',
    description: 'When horizontal and vertical strokes cross, draw the horizontal stroke first.',
    example: '十 (juu) or 十-like crossings in kana such as た or け.',
  },
  {
    title: 'Center before Symmetrical Wings',
    description: 'When a character has a dominant center vertical stroke with flanking side strokes, write center first.',
    example: '小 (shou / small) or 水 (mizu) or Katakana 小 components.',
  },
  {
    title: 'Dakuten (゛) & Handakuten (゜) Last',
    description: 'Always complete the entire base kana body before placing the quotation marks or circle marks in the top-right.',
    example: 'が (ga) - draw the full か (ka) first, then add the two dots last.',
  },
]

export const KANA_WRITING_TIPS: Record<string, string> = {
  // Hiragana
  あ: 'Stroke 1 is a horizontal line. Stroke 2 drops straight down through it. Stroke 3 starts on the right, curves in a loop through the center, and wraps around.',
  い: 'Stroke 1 (left) is longer and finishes with a subtle upward hook. Stroke 2 (right) is shorter and stops cleanly.',
  う: 'Stroke 1 is a short diagonal dot at top. Stroke 2 is a broad curve bending right and downwards.',
  え: 'Stroke 1 is a diagonal top dot. Stroke 2 is a single flowing stroke: horizontal right, diagonal down-left, then a gentle "Z"-wave.',
  お: 'Stroke 1 is horizontal. Stroke 2 drops down, loops back up, and forms an open belly. Stroke 3 is the floating accent dot at top-right.',
  か: 'Stroke 1 hooks down at the end. Stroke 2 cuts through. Stroke 3 is the outer accent dot at top-right.',
  き: 'Stroke 1 and 2 are parallel horizontal lines. Stroke 3 cuts downward diagonally. Stroke 4 curves gently underneath.',
  さ: 'Stroke 1 is horizontal. Stroke 2 crosses diagonally. Stroke 3 curves around the bottom (separated in clean print font).',
  し: 'One single graceful stroke starting at top-left, dropping down, and sweeping up in a smooth hook.',
  す: 'Stroke 1 is horizontal. Stroke 2 goes straight down, forms a tight loop in the middle, and trails down-left.',
  せ: 'Stroke 1 is horizontal. Stroke 2 is the right vertical hook. Stroke 3 is the left vertical dropping through.',
  そ: 'One continuous stroke forming a "Z" that immediately swoops into a gentle curved "C" bowl at the bottom.',
  た: 'Stroke 1 is horizontal. Stroke 2 slants down-left. Strokes 3 and 4 form a mini "こ" on the right side.',
  ち: 'Stroke 1 slants down-right. Stroke 2 is horizontal. Stroke 3 cuts down and blossoms into a large bottom loop.',
  つ: 'One bold stroke curving right, peaking, and sweeping down-left like a rolling ocean wave.',
  て: 'One continuous stroke: short horizontal right, then curving back down like a crescent moon.',
  と: 'Stroke 1 is a short downward slant. Stroke 2 curves from bottom-left up and around like an open mouth.',
  な: 'Stroke 1 horizontal, stroke 2 vertical slant, stroke 3 upper dot, stroke 4 looping flourish at bottom right.',
  に: 'Stroke 1 is the left vertical pillar with slight hook. Strokes 2 and 3 form a mini "こ" on the right.',
  ぬ: 'Stroke 1 is a downward slant. Stroke 2 loops around and ends with a tight knot (unlike め which has no loop).',
  ね: 'Stroke 1 is vertical. Stroke 2 forms a "Z" shape across the line, looping back down into a final tail knot.',
  の: 'One continuous circular stroke starting near center, sweeping down-left, then soaring around clockwise.',
  は: 'Stroke 1 is the left vertical line with a hook. Stroke 2 is horizontal. Stroke 3 drops down and loops.',
  ひ: 'One fluid smiling stroke: short up-right, down in a bowl, then upward and down again.',
  ふ: 'Stroke 1 top dot, stroke 2 central nose/hook, strokes 3 and 4 are symmetric side drops.',
  へ: 'One single peaked roof stroke: climb up, reach the apex, then slide down longer to the right.',
  ほ: 'Stroke 1 left vertical pillar. Stroke 2 and 3 horizontal bars (top stroke does NOT pierce). Stroke 4 loops.',
  ま: 'Stroke 1 and 2 horizontal bars. Stroke 3 drops down through both, loops at bottom, and exits right.',
  み: 'Stroke 1 forms a loop and tails right. Stroke 2 cuts downward across the tail.',
  む: 'Stroke 1 horizontal. Stroke 2 drops, makes a belly loop, sweeps right with a hook. Stroke 3 is the dot.',
  め: 'Stroke 1 slants down-right. Stroke 2 curves around like an eye (similar to ぬ, but NO loop at the tip).',
  も: 'Stroke 1 is the central hook sweeping up. Strokes 2 and 3 are the two horizontal bars cutting through.',
  や: 'Stroke 1 is the big arching curve. Stroke 2 is the small top tick. Stroke 3 is the diagonal line through.',
  ゆ: 'Stroke 1 sweeps down and loops up-right. Stroke 2 cuts down vertically through the loop.',
  よ: 'Stroke 1 is horizontal. Stroke 2 drops from above, forms a loop at the bottom, and exits right.',
  ら: 'Stroke 1 is top dot. Stroke 2 curves down and around in a soft hook.',
  り: 'Stroke 1 left is short. Stroke 2 right is longer, sweeping downward and curving left.',
  る: 'One continuous line: horizontal, diagonal down, into a loop, ending with a small closed knot inside.',
  ろ: 'Similar to る, but open at the bottom — NO knot inside the tail.',
  わ: 'Stroke 1 is vertical. Stroke 2 sweeps around in a big open circular belly (unlike ね, NO loop at the end).',
  を: 'Stroke 1 horizontal, stroke 2 drops and angles right, stroke 3 is the curving crescent below.',
  ん: 'One single stroke resembling a cursive lowercase "n", curving down, up, and tapering off.',

  // Katakana Confusables & Key Characters
  ア: 'Stroke 1 is horizontal then slants down-left. Stroke 2 curves gently downwards.',
  イ: 'Stroke 1 is a downward-left slant. Stroke 2 is a vertical dropping stroke.',
  ウ: 'Stroke 1 top dot. Stroke 2 left dot. Stroke 3 curves across and drops down.',
  エ: 'Stroke 1 top horizontal. Stroke 2 vertical stem. Stroke 3 bottom horizontal base.',
  オ: 'Stroke 1 horizontal. Stroke 2 vertical with hook. Stroke 3 diagonal slant from the intersection.',
  カ: 'Stroke 1 is the angled corner with hook. Stroke 2 is the crossing diagonal slash.',
  キ: 'Strokes 1 and 2 are parallel horizontals. Stroke 3 cuts straight down diagonally.',
  ク: 'Stroke 1 is a short diagonal. Stroke 2 angles right then sweeps down-left.',
  ケ: 'Stroke 1 is left diagonal. Stroke 2 is top horizontal. Stroke 3 crosses down-left.',
  コ: 'Stroke 1 is top corner (horizontal then down). Stroke 2 is bottom horizontal line.',
  サ: 'Stroke 1 is horizontal. Stroke 2 is left vertical. Stroke 3 is right vertical.',
  シ: '💡 KEY TIP: 3 strokes. Strokes 1 and 2 are horizontal slants aligned vertically on the left. Stroke 3 starts at the BOTTOM-LEFT and sweeps UPWARD towards top-right.',
  ス: 'Stroke 1 angles right then sweeps down-left. Stroke 2 slants down-right.',
  セ: 'Stroke 1 horizontal and down with hook. Stroke 2 vertical cutting through and turning right.',
  ソ: '💡 KEY TIP: 2 strokes. Stroke 1 is a small slant near top-left. Stroke 2 starts high at TOP-RIGHT and sweeps DOWNWARD towards bottom-left.',
  タ: 'Stroke 1 is short diagonal. Stroke 2 is corner. Stroke 3 cuts across the middle.',
  チ: 'Stroke 1 is top diagonal slant. Stroke 2 is horizontal. Stroke 3 curves down and left.',
  ツ: '💡 KEY TIP: 3 strokes. Strokes 1 and 2 are vertical dashes aligned horizontally along the top. Stroke 3 starts at TOP-RIGHT and sweeps DOWNWARD towards bottom-left.',
  テ: 'Stroke 1 is top horizontal. Stroke 2 is middle horizontal. Stroke 3 curves down-left from center.',
  ト: 'Stroke 1 is vertical line. Stroke 2 is diagonal branch slanting down-right.',
  ナ: 'Stroke 1 is horizontal. Stroke 2 is diagonal sweep crossing through.',
  ニ: 'Stroke 1 is top horizontal. Stroke 2 is longer bottom horizontal.',
  ヌ: 'Stroke 1 angles right then curves down-left. Stroke 2 crosses down-right.',
  ネ: 'Stroke 1 is top dot. Stroke 2 is vertical stem. Stroke 3 and 4 complete the right branches.',
  ノ: 'One single smooth stroke sweeping from top-right down to bottom-left.',
  ハ: 'Stroke 1 slants down-left. Stroke 2 slants down-right.',
  ヒ: 'Stroke 1 is horizontal and curves down. Stroke 2 is vertical base turning right.',
  フ: 'One single stroke: horizontal right, bending into a sweeping curve down-left.',
  ヘ: 'One single mountain stroke: climb up to apex, slide down longer.',
  ホ: 'Stroke 1 is horizontal. Stroke 2 is vertical with hook. Strokes 3 and 4 are symmetric side ticks.',
  マ: 'Stroke 1 angles right and down-left. Stroke 2 is the bottom diagonal slash.',
  ミ: 'Three parallel diagonal slashes from top-left to bottom-right: top, middle, bottom.',
  ム: 'Stroke 1 angles down-right then sharp left. Stroke 2 is the closing right dot.',
  メ: 'Stroke 1 is long diagonal slash down-left. Stroke 2 is crossing slash down-right.',
  モ: 'Stroke 1 is top horizontal. Stroke 2 is middle horizontal. Stroke 3 is vertical with hook.',
  ヤ: 'Stroke 1 is top corner and curve. Stroke 2 is crossing vertical line.',
  ユ: 'Stroke 1 is corner and bottom horizontal. Stroke 2 cuts down through the bottom line.',
  ヨ: 'Stroke 1 is top corner and vertical stem. Strokes 2 and 3 are middle and bottom horizontals.',
  ラ: 'Stroke 1 is top horizontal. Stroke 2 is corner with sweeping curve.',
  リ: 'Stroke 1 is left vertical line. Stroke 2 is right longer vertical line with slight curve.',
  ル: 'Stroke 1 slants down-left. Stroke 2 curves down and sweeps up with a hook.',
  レ: 'One single stroke: vertical down, bending sharply into an upward-right hook.',
  ロ: 'Box in 3 strokes: left vertical, top corner down, bottom closing horizontal.',
  ワ: 'Stroke 1 is left vertical. Stroke 2 is top corner curving down-left.',
  ヲ: 'Stroke 1 top horizontal. Stroke 2 middle horizontal. Stroke 3 curves down-left.',
  ン: '💡 KEY TIP: 2 strokes. Stroke 1 is a small flat dash. Stroke 2 starts from the BOTTOM-LEFT and sweeps UPWARD towards top-right.',
}

const STROKE_DATABASE: Record<string, KanaStrokeData> = rawKanaStrokes as unknown as Record<
  string,
  KanaStrokeData
>

/**
 * Retrieve KanjiVG stroke vector data and writing guidance for a given kana character.
 */
export function getKanaStrokes(char: string): KanaStrokeData | null {
  if (!char) return null

  // If compound (e.g. きゃ or キャ), return the first character's strokes or compose
  if (char.length > 1) {
    const first = char[0]
    const base = STROKE_DATABASE[first]
    if (base) {
      return {
        ...base,
        tip: `Compound character: write ${char[0]} first, then add smaller ${char[1]}.`,
      }
    }
  }

  const data = STROKE_DATABASE[char]
  if (!data) return null

  return {
    ...data,
    tip: KANA_WRITING_TIPS[char] || `${data.strokeCount} strokes: follow the numbered order from 1 to ${data.strokeCount}.`,
  }
}

/**
 * Returns whether stroke data is available for this character.
 */
export function hasKanaStrokes(char: string): boolean {
  if (!char) return false
  const primary = char[0]
  return Boolean(STROKE_DATABASE[primary])
}

/**
 * Get writing tip / distinction note for a character.
 */
export function getStrokeWritingTip(char: string): string {
  if (KANA_WRITING_TIPS[char]) return KANA_WRITING_TIPS[char]
  const data = STROKE_DATABASE[char]
  if (data) {
    return `${char} has ${data.strokeCount} strokes. Follow top-to-bottom and left-to-right order.`
  }
  return 'Practice writing with consistent stroke proportions.'
}
