/**
 * Japanese Conjugation & Deconjugation Linguistic Engine
 * Handles Godan, Ichidan, Irregular (Suru/Kuru), and Adjective inflections,
 * reverse deconjugation, and grammatical conjugation rule definitions.
 */

export type VerbGroup = 'godan' | 'ichidan' | 'irregular-suru' | 'irregular-kuru'

export interface VerbConjugationEntry {
  formKey: string
  nameJa: string
  nameEn: string
  kana: string
  kanji: string
  romaji: string
  explanation: string
}

export interface ConjugationFormInfo {
  id: string
  nameJa: string
  nameEn: string
  aliases: string[]
  description: string
  formula: string
  examples: {
    godan: string
    ichidan: string
    suru: string
    kuru: string
  }
}

export interface DeconjugatedResult {
  surface: string
  dictionary: string
  reading: string
  group: VerbGroup
  formKey: string
  formNameEn: string
  formNameJa: string
  explanation: string
}

// Common Godan verbs ending in る that look like Ichidan
const GODAN_RU_EXCEPTions = new Set([
  '帰る', 'かえる',
  '入る', 'はいる',
  '知る', 'しる',
  '走る', 'はしる',
  '切る', 'きる',
  '要る', 'いる',
  '減る', 'へる',
  '滑る', 'すべる',
  '喋る', 'しゃべる',
  '握る', 'にぎる',
  '蹴る', 'ける',
  '限る', 'かぎる',
  '焦る', 'あせる',
])

export function detectVerbGroup(verb: string): VerbGroup {
  if (verb === 'する' || verb.endsWith('する')) return 'irregular-suru'
  if (verb === '来る' || verb === 'くる' || verb.endsWith('くる')) return 'irregular-kuru'
  if (GODAN_RU_EXCEPTions.has(verb)) return 'godan'

  if (verb.endsWith('る')) {
    // If penultimate mora is an 'e' or 'i' sound, likely Ichidan
    const penult = verb.slice(-2, -1)
    if (/[いきしちにひみりぎじぢびぴえけせてねへめれげぜでべぺ]/.test(penult)) {
      return 'ichidan'
    }
  }

  return 'godan'
}

/**
 * Generates all primary conjugations for a Japanese verb
 */
export function conjugateVerb(verb: string, reading?: string): VerbConjugationEntry[] {
  const group = detectVerbGroup(verb)
  const baseReading = reading || verb
  const entries: VerbConjugationEntry[] = []

  // Helpers
  const add = (
    formKey: string,
    nameJa: string,
    nameEn: string,
    kanji: string,
    kana: string,
    romaji: string,
    explanation: string
  ) => {
    entries.push({ formKey, nameJa, nameEn, kanji, kana, romaji, explanation })
  }

  if (group === 'irregular-suru') {
    const prefix = verb.slice(0, -2)
    const pRead = baseReading.slice(0, -2)
    add('dictionary', '辞書形', 'Dictionary (Plain Present)', verb, baseReading, prefix + 'suru', 'Base form; casual present or future.')
    add('masu', 'ます形', 'Polite Present', prefix + 'します', pRead + 'します', prefix + 'shimasu', 'Standard polite statement: "do/does".')
    add('masuNegative', 'ません形', 'Polite Negative', prefix + 'しません', pRead + 'しません', prefix + 'shimasen', 'Polite negation: "do/does not".')
    add('masuPast', 'ました形', 'Polite Past', prefix + 'しました', pRead + 'しました', prefix + 'shimashita', 'Polite completed action: "did".')
    add('masuPastNegative', 'ませんでした形', 'Polite Past Negative', prefix + 'しませんでした', pRead + 'しませんでした', prefix + 'shimasen deshita', 'Polite past negation: "did not".')
    add('negative', 'ない形', 'Plain Negative', prefix + 'しない', pRead + 'しない', prefix + 'shinai', 'Casual negative: "not do".')
    add('past', 'た形', 'Plain Past', prefix + 'した', pRead + 'した', prefix + 'shita', 'Casual past: "did".')
    add('pastNegative', 'なかった形', 'Plain Past Negative', prefix + 'しなかった', pRead + 'しなかった', prefix + 'shinakatta', 'Casual past negative: "did not do".')
    add('te', 'て形', 'Te-form (Connecting)', prefix + 'して', pRead + 'して', prefix + 'shite', 'Connects actions, used with ください/います.')
    add('potential', '可能形', 'Potential Form', prefix + 'できる', pRead + 'できる', prefix + 'dekiru', 'Expresses ability: "can do".')
    add('passive', '受身形', 'Passive Voice', prefix + 'される', pRead + 'される', prefix + 'sareru', 'Action received: "is done by".')
    add('causative', '使役形', 'Causative Form', prefix + 'させる', pRead + 'させる', prefix + 'saseru', 'Make or allow someone to do: "make do".')
    add('volitional', '意向形', 'Volitional Form', prefix + 'しよう', pRead + 'しよう', prefix + 'shiyou', 'Casual suggestion/intent: "let\'s do".')
    add('conditionalBa', 'ば形', 'Conditional (Ba)', prefix + 'すれば', pRead + 'すれば', prefix + 'sureba', 'Hypothetical: "if one does".')
    add('conditionalTara', 'たら形', 'Conditional (Tara)', prefix + 'したら', pRead + 'したら', prefix + 'shitara', 'Condition/when: "if/when one does".')
    return entries
  }

  if (group === 'irregular-kuru') {
    add('dictionary', '辞書形', 'Dictionary (Plain Present)', '来る', 'くる', 'kuru', 'Base form: "to come".')
    add('masu', 'ます形', 'Polite Present', '来ます', 'きます', 'kimasu', 'Polite: "comes".')
    add('masuNegative', 'ません形', 'Polite Negative', '来ません', 'きません', 'kimasen', 'Polite: "does not come".')
    add('masuPast', 'ました形', 'Polite Past', '来ました', 'きました', 'kimashita', 'Polite: "came".')
    add('negative', 'ない形', 'Plain Negative', '来ない', 'こない', 'konai', 'Plain negative: "not come".')
    add('past', 'た形', 'Plain Past', '来た', 'きた', 'kita', 'Plain past: "came".')
    add('te', 'て形', 'Te-form (Connecting)', '来て', 'きて', 'kite', 'Connecting form: "come and...".')
    add('potential', '可能形', 'Potential Form', '来られる', 'こられる', 'korareru', 'Ability: "can come".')
    add('passive', '受身形', 'Passive Voice', '来られる', 'こられる', 'korareru', 'Adversity passive: "affected by someone coming".')
    add('causative', '使役形', 'Causative Form', '来させる', 'こさせる', 'kosaseru', 'Make/let come: "make come".')
    add('volitional', '意向形', 'Volitional Form', '来よう', 'こよう', 'koyou', 'Casual invitation: "let\'s come".')
    add('conditionalBa', 'ば形', 'Conditional (Ba)', '来れば', 'くれば', 'kureba', 'Hypothetical: "if one comes".')
    add('conditionalTara', 'たら形', 'Conditional (Tara)', '来たら', 'きたら', 'kitara', 'Condition: "when/if one comes".')
    return entries
  }

  if (group === 'ichidan') {
    const stem = verb.slice(0, -1)
    const stemRead = baseReading.slice(0, -1)

    add('dictionary', '辞書形', 'Dictionary (Plain Present)', verb, baseReading, stemRead + 'ru', 'Base plain form.')
    add('masu', 'ます形', 'Polite Present', stem + 'ます', stemRead + 'ます', stemRead + 'masu', 'Polite statement: "does".')
    add('masuNegative', 'ません形', 'Polite Negative', stem + 'ません', stemRead + 'ません', stemRead + 'masen', 'Polite negative: "does not".')
    add('masuPast', 'ました形', 'Polite Past', stem + 'ました', stemRead + 'ました', stemRead + 'mashita', 'Polite completed: "did".')
    add('negative', 'ない形', 'Plain Negative', stem + 'ない', stemRead + 'ない', stemRead + 'nai', 'Plain negative: "does not".')
    add('past', 'た形', 'Plain Past', stem + 'た', stemRead + 'た', stemRead + 'ta', 'Plain completed past: "did".')
    add('pastNegative', 'なかった形', 'Plain Past Negative', stem + 'なかった', stemRead + 'なかった', stemRead + 'nakatta', 'Plain past negative: "did not".')
    add('te', 'て形', 'Te-form (Connecting)', stem + 'て', stemRead + 'て', stemRead + 'te', 'Connecting action, used for requests/progressive.')
    add('potential', '可能形', 'Potential Form', stem + 'られる', stemRead + 'られる', stemRead + 'rareru', 'Ability: "can do".')
    add('passive', '受身形', 'Passive Voice', stem + 'られる', stemRead + 'られる', stemRead + 'rareru', 'Action received: "is done by".')
    add('causative', '使役形', 'Causative Form', stem + 'させる', stemRead + 'させる', stemRead + 'saseru', 'Make or allow someone to do: "make do".')
    add('volitional', '意向形', 'Volitional Form', stem + 'よう', stemRead + 'よう', stemRead + 'you', 'Intent or informal "let\'s do".')
    add('conditionalBa', 'ば形', 'Conditional (Ba)', stem + 'れば', stemRead + 'れば', stemRead + 'reba', 'Hypothetical: "if one does".')
    add('conditionalTara', 'たら形', 'Conditional (Tara)', stem + 'たら', stemRead + 'たら', stemRead + 'tara', 'Condition/when: "if/when one does".')
    return entries
  }

  // Godan verb inflection
  const lastChar = verb.slice(-1)
  const stem = verb.slice(0, -1)
  const stemRead = baseReading.slice(0, -1)

  // Consonant shifting for Godan (a, i, u, e, o rows)
  const shiftMap: Record<string, { a: string; i: string; e: string; o: string; te: string; ta: string }> = {
    う: { a: 'わ', i: 'い', e: 'え', o: 'お', te: 'って', ta: 'った' },
    く: { a: 'か', i: 'き', e: 'け', o: 'こ', te: 'いて', ta: 'いた' },
    ぐ: { a: 'が', i: 'ぎ', e: 'げ', o: 'ご', te: 'いで', ta: 'いだ' },
    す: { a: 'さ', i: 'し', e: 'せ', o: 'そ', te: 'して', ta: 'した' },
    つ: { a: 'た', i: 'ち', e: 'て', o: 'と', te: 'って', ta: 'った' },
    ぬ: { a: 'な', i: 'に', e: 'ね', o: 'の', te: 'んで', ta: 'んだ' },
    ぶ: { a: 'ば', i: 'び', e: 'べ', o: 'ぼ', te: 'んで', ta: 'んだ' },
    む: { a: 'ま', i: 'み', e: 'め', o: 'も', te: 'んで', ta: 'んだ' },
    る: { a: 'ら', i: 'り', e: 'れ', o: 'ろ', te: 'って', ta: 'った' },
  }

  // Special case: 行く (iku) -> いって / いった (not いいて)
  const isIku = verb === '行く' || verb === 'いく'
  const shift = shiftMap[lastChar] || { a: 'わ', i: 'い', e: 'え', o: 'お', te: 'って', ta: 'った' }
  const teEnd = isIku ? 'って' : shift.te
  const taEnd = isIku ? 'った' : shift.ta

  add('dictionary', '辞書形', 'Dictionary (Plain Present)', verb, baseReading, baseReading, 'Base plain form.')
  add('masu', 'ます形', 'Polite Present', stem + shift.i + 'ます', stemRead + shift.i + 'ます', stemRead + shift.i + 'masu', 'Polite statement: "does".')
  add('masuNegative', 'ません形', 'Polite Negative', stem + shift.i + 'ません', stemRead + shift.i + 'ません', stemRead + shift.i + 'masen', 'Polite negative: "does not".')
  add('masuPast', 'ました形', 'Polite Past', stem + shift.i + 'ました', stemRead + shift.i + 'ました', stemRead + shift.i + 'mashita', 'Polite completed: "did".')
  add('negative', 'ない形', 'Plain Negative', stem + shift.a + 'ない', stemRead + shift.a + 'ない', stemRead + shift.a + 'nai', 'Plain negative: "does not".')
  add('past', 'た形', 'Plain Past', stem + taEnd, stemRead + taEnd, stemRead + taEnd, 'Plain completed: "did".')
  add('pastNegative', 'なかった形', 'Plain Past Negative', stem + shift.a + 'なかった', stemRead + shift.a + 'なかった', stemRead + shift.a + 'nakatta', 'Plain past negative: "did not".')
  add('te', 'て形', 'Te-form (Connecting)', stem + teEnd, stemRead + teEnd, stemRead + teEnd, 'Connecting form, used for requests/progressive.')
  add('potential', '可能形', 'Potential Form', stem + shift.e + 'る', stemRead + shift.e + 'る', stemRead + shift.e + 'ru', 'Ability: "can do".')
  add('passive', '受身形', 'Passive Voice', stem + shift.a + 'れる', stemRead + shift.a + 'れる', stemRead + shift.a + 'reru', 'Passive voice: "is done by".')
  add('causative', '使役形', 'Causative Form', stem + shift.a + 'せる', stemRead + shift.a + 'せる', stemRead + shift.a + 'seru', 'Make or allow someone to do: "make do".')
  add('volitional', '意向形', 'Volitional Form', stem + shift.o + 'う', stemRead + shift.o + 'う', stemRead + shift.o + 'u', 'Informal intention / suggestion: "let\'s do".')
  add('conditionalBa', 'ば形', 'Conditional (Ba)', stem + shift.e + 'ば', stemRead + shift.e + 'ば', stemRead + shift.e + 'ba', 'Hypothetical condition: "if one does".')
  add('conditionalTara', 'たら形', 'Conditional (Tara)', stem + taEnd + 'ら', stemRead + taEnd + 'ら', stemRead + taEnd + 'ra', 'Temporal / hypothetical: "if/when one does".')

  return entries
}

/**
 * Reverse deconjugator: analyzes a surface form and identifies base verb and inflection
 */
export function deconjugate(input: string): DeconjugatedResult[] {
  const clean = input.trim()
  if (!clean || clean.length < 2) return []

  const results: DeconjugatedResult[] = []

  // Known patterns for reverse inflection
  const patterns: {
    suffix: string
    group: VerbGroup
    reconstruct: (stem: string) => string
    formKey: string
    formNameJa: string
    formNameEn: string
    explanation: string
  }[] = [
    // Polite
    { suffix: 'ました', group: 'godan', reconstruct: (s) => s + 'る', formKey: 'masuPast', formNameJa: 'ました形', formNameEn: 'Polite Past', explanation: 'Past polite action: "did"' },
    { suffix: 'ません', group: 'godan', reconstruct: (s) => s + 'る', formKey: 'masuNegative', formNameJa: 'ません形', formNameEn: 'Polite Negative', explanation: 'Negative polite: "does not"' },
    { suffix: 'ます', group: 'godan', reconstruct: (s) => s + 'る', formKey: 'masu', formNameJa: 'ます形', formNameEn: 'Polite Present', explanation: 'Polite present/future: "does"' },

    // Plain negative & past
    { suffix: 'なかった', group: 'godan', reconstruct: (s) => s + 'う', formKey: 'pastNegative', formNameJa: 'なかった形', formNameEn: 'Plain Past Negative', explanation: 'Casual past negation: "did not"' },
    { suffix: 'ない', group: 'godan', reconstruct: (s) => s + 'う', formKey: 'negative', formNameJa: 'ない形', formNameEn: 'Plain Negative', explanation: 'Casual negation: "not do"' },

    // Te-form & Ta-form
    { suffix: 'ている', group: 'godan', reconstruct: (s) => s, formKey: 'teiru', formNameJa: 'ている形', formNameEn: 'Progressive / State', explanation: 'Ongoing action or state: "is doing / has done"' },
    { suffix: 'ています', group: 'godan', reconstruct: (s) => s, formKey: 'teiruPolite', formNameJa: 'ています形', formNameEn: 'Polite Progressive', explanation: 'Polite ongoing action or state' },
    { suffix: 'て', group: 'godan', reconstruct: (s) => s, formKey: 'te', formNameJa: 'て形', formNameEn: 'Te-form (Connecting)', explanation: 'Connecting action / request base' },
    { suffix: 'で', group: 'godan', reconstruct: (s) => s, formKey: 'teVoiced', formNameJa: 'で形 (て形)', formNameEn: 'Te-form (Voiced)', explanation: 'Connecting form for ぐ, ぬ, ぶ, む verbs' },
    { suffix: 'た', group: 'godan', reconstruct: (s) => s, formKey: 'past', formNameJa: 'た形', formNameEn: 'Plain Past', explanation: 'Casual completed action: "did"' },
    { suffix: 'だ', group: 'godan', reconstruct: (s) => s, formKey: 'pastVoiced', formNameJa: 'だ形 (た形)', formNameEn: 'Plain Past (Voiced)', explanation: 'Casual past form for ぐ, ぬ, ぶ, む verbs' },

    // Potential & Passive
    { suffix: 'られる', group: 'ichidan', reconstruct: (s) => s + 'る', formKey: 'potentialOrPassive', formNameJa: 'られる形', formNameEn: 'Potential / Passive', explanation: 'Expresses ability ("can do") or passive voice ("is done by")' },
    { suffix: 'せる', group: 'ichidan', reconstruct: (s) => s + 'る', formKey: 'causative', formNameJa: '使役形', formNameEn: 'Causative Form', explanation: 'Make or allow someone to do: "make do"' },
    { suffix: 'させる', group: 'ichidan', reconstruct: (s) => s + 'る', formKey: 'causative', formNameJa: '使役形', formNameEn: 'Causative Form', explanation: 'Make or allow someone to do: "make do"' },
  ]

  for (const p of patterns) {
    if (clean.endsWith(p.suffix)) {
      const stem = clean.slice(0, -p.suffix.length)
      if (stem.length > 0) {
        results.push({
          surface: clean,
          dictionary: stem + 'る',
          reading: stem + 'る',
          group: p.group,
          formKey: p.formKey,
          formNameEn: p.formNameEn,
          formNameJa: p.formNameJa,
          explanation: p.explanation,
        })
      }
    }
  }

  return results
}

/**
 * Knowledge base of standard Japanese verb & adjective conjugations
 */
export const CONJUGATION_RULES_DATABASE: ConjugationFormInfo[] = [
  {
    id: 'te-form',
    nameJa: 'て形 (Te-Form)',
    nameEn: 'Te-form / Connecting Form',
    aliases: ['te', 'te-form', 'te form', 'て', 'て形', 'connecting form'],
    description: 'The most versatile conjugation in Japanese. Connects successive verbs, forms polite requests with ください, continuous action with います, and permission with もいい.',
    formula: 'Godan: う・つ・る → って, む・ぶ・ぬ → んで, く → いて, ぐ → いで, す → して | Ichidan: drop る + て | Irregular: する → して, くる → きて',
    examples: {
      godan: '書く (kaku) → 書いて (kaite) | 飲む (nomu) → 飲んで (nonde)',
      ichidan: '食べる (taberu) → 食べて (tabete)',
      suru: '勉強する → 勉強して',
      kuru: '来る (kuru) → 来て (kite)',
    },
  },
  {
    id: 'ta-form',
    nameJa: 'た形 (Ta-Form / Past Plain)',
    nameEn: 'Past Plain Form',
    aliases: ['ta', 'ta-form', 'ta form', 'た', 'た形', 'past tense', 'past plain'],
    description: 'Casual past tense. Follows identical rhythm changes to the て-form (replace て/で with た/だ). Used for completed actions, past experience (〜ことがある), and listing actions (〜たり〜たり).',
    formula: 'Godan: same as て-form with た/だ | Ichidan: drop る + た | Irregular: する → した, くる → きた',
    examples: {
      godan: '行く → 行った | 飲む → 飲んだ',
      ichidan: '食べる → 食べた | 見る → 見た',
      suru: 'する → した',
      kuru: '来る → 来た',
    },
  },
  {
    id: 'nai-form',
    nameJa: 'ない形 (Nai-Form / Negative Plain)',
    nameEn: 'Negative Plain Form',
    aliases: ['nai', 'nai-form', 'nai form', 'ない', 'ない形', 'negative'],
    description: 'Informal negative form. Used for casual statements, negative requests (〜ないでください), and expressing obligation (〜なければならない).',
    formula: 'Godan: u → a + ない (う → わない) | Ichidan: drop る + ない | Irregular: する → しない, くる → こない',
    examples: {
      godan: '話す → 話さない | 買う → 買わない',
      ichidan: '食べる → 食べない',
      suru: 'する → しない',
      kuru: '来る → こない',
    },
  },
  {
    id: 'masu-form',
    nameJa: 'ます形 (Masu-Form / Polite Style)',
    nameEn: 'Polite Present Form',
    aliases: ['masu', 'masu-form', 'masu form', 'ます', 'ます形', 'polite form'],
    description: 'The standard polite register used when speaking with acquaintances, teachers, and superiors. Stem is used for invitations (〜ましょう) and desires (〜たい).',
    formula: 'Godan: u → i + ます | Ichidan: drop る + ます | Irregular: する → します, くる → きます',
    examples: {
      godan: '飲む → 飲みます | 書く → 書きます',
      ichidan: '食べる → 食べます',
      suru: 'する → します',
      kuru: '来る → きます',
    },
  },
  {
    id: 'potential-form',
    nameJa: '可能形 (Potential Form)',
    nameEn: 'Potential Form ("Can do")',
    aliases: ['potential', 'potential-form', 'kanou', 'kanoukei', '可能形', 'can do', 'able to'],
    description: 'Expresses the ability or possibility to perform an action. In potential sentences, the direct object particle を regularly changes to が.',
    formula: 'Godan: u → e + る (書く → 書ける) | Ichidan: drop る + られる (食べる → 食べられる) | Irregular: する → できる, くる → こられる',
    examples: {
      godan: '泳ぐ (oyogu) → 泳げる (oyogeru: can swim)',
      ichidan: '見る (miru) → 見られる (mirareru: can see)',
      suru: '勉強する → 勉強できる',
      kuru: '来る → こられる',
    },
  },
  {
    id: 'passive-form',
    nameJa: '受身形 (Passive Voice)',
    nameEn: 'Passive Voice Form',
    aliases: ['passive', 'passive-form', 'ukemi', '受身形', 'is done by'],
    description: 'Expresses an action received from someone else. Also used for Japanese "suffering passive" (迷惑の受身) when an action inconveniences the speaker.',
    formula: 'Godan: u → a + れる | Ichidan: drop る + られる | Irregular: する → される, くる → こられる',
    examples: {
      godan: '叱る (shikaru) → 叱られる (shikarareru: be scolded)',
      ichidan: '褒める (homeru) → 褒められる (homerareru: be praised)',
      suru: 'する → される',
      kuru: '来る → こられる',
    },
  },
  {
    id: 'causative-form',
    nameJa: '使役形 (Causative Form)',
    nameEn: 'Causative Form ("Make / Let do")',
    aliases: ['causative', 'causative-form', 'shieki', '使役形', 'make do', 'let do'],
    description: 'Indicates making or permitting someone to perform an action.',
    formula: 'Godan: u → a + せる | Ichidan: drop る + させる | Irregular: する → させる, くる → こさせる',
    examples: {
      godan: '読ませる (make/let read)',
      ichidan: '食べさせる (make/let eat)',
      suru: 'する → させる',
      kuru: '来る → こさせる',
    },
  },
  {
    id: 'volitional-form',
    nameJa: '意向形 (Volitional Form)',
    nameEn: 'Volitional Form ("Let\'s do / Intent")',
    aliases: ['volitional', 'volitional-form', 'ikoukei', '意向形', 'lets', 'let\'s'],
    description: 'The informal counterpart to 〜ましょう. Used for casual invitations to friends and for stating intentions with 〜と思っています.',
    formula: 'Godan: u → ou (行こう, 話そう) | Ichidan: drop る + よう (食べよう) | Irregular: する → しよう, くる → こよう',
    examples: {
      godan: '行こう (Let\'s go!) | 飲もう (Let\'s drink!)',
      ichidan: '見よう (Let\'s watch!)',
      suru: 'しよう (Let\'s do!)',
      kuru: 'こよう (Let\'s come!)',
    },
  },
  {
    id: 'conditional-ba',
    nameJa: 'ば形 (Conditional Ba)',
    nameEn: 'Conditional Ba Form ("If")',
    aliases: ['ba', 'ba-form', 'ba form', 'ば', 'ば形', 'conditional', 'hypothetical if'],
    description: 'Focuses on the prerequisite condition itself: "If X happens, Y will naturally follow".',
    formula: 'Godan: u → e + ば | Ichidan: drop る + れば | Irregular: する → すれば, くる → くれば | Adjective: い → ければ',
    examples: {
      godan: '行けば (if one goes) | 安ければ (if it is cheap)',
      ichidan: '食べれば (if one eats)',
      suru: 'すれば',
      kuru: 'くれば',
    },
  },
  {
    id: 'conditional-tara',
    nameJa: 'たら形 (Conditional Tara)',
    nameEn: 'Conditional Tara Form ("If / When")',
    aliases: ['tara', 'tara-form', 'tara form', 'たら', 'たら形', 'when', 'if then'],
    description: 'The most versatile conditional form: past tense た-form + ら. Used for conditions, subsequent future actions, and surprising discoveries.',
    formula: '[Verb Past た-form] + ら',
    examples: {
      godan: '雨が降ったら (if it rains)',
      ichidan: '食べたら (when/if one eats)',
      suru: 'したら',
      kuru: 'きたら',
    },
  },
]
