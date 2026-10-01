const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/user-grammar-extracted.json'), 'utf8'));

// Unit mapping helpers
const LESSON_MAP = {
  // N5
  'n5-001': 'Lesson 1 – Topic, Subject & Direct Objects',
  'n5-002': 'Lesson 1 – Topic, Subject & Direct Objects',
  'n5-003': 'Lesson 1 – Topic, Subject & Direct Objects',
  'n5-004': 'Lesson 1 – Topic, Subject & Direct Objects',
  'n5-005': 'Lesson 1 – Topic, Subject & Direct Objects',
  'n5-006': 'Lesson 1 – Topic, Subject & Direct Objects',

  'n5-007': 'Lesson 2 – Connections, Directions & Polite Forms',
  'n5-008': 'Lesson 2 – Connections, Directions & Polite Forms',
  'n5-009': 'Lesson 2 – Connections, Directions & Polite Forms',
  'n5-010': 'Lesson 2 – Connections, Directions & Polite Forms',
  'n5-011': 'Lesson 2 – Connections, Directions & Polite Forms',
  'n5-012': 'Lesson 2 – Connections, Directions & Polite Forms',

  'n5-013': 'Lesson 3 – Actions, Requests & Existence',
  'n5-014': 'Lesson 3 – Actions, Requests & Existence',
  'n5-015': 'Lesson 3 – Actions, Requests & Existence',
  'n5-016': 'Lesson 3 – Actions, Requests & Existence',
  'n5-017': 'Lesson 3 – Actions, Requests & Existence',
  'n5-018': 'Lesson 3 – Actions, Requests & Existence',

  'n5-019': 'Lesson 4 – Descriptions & Comparisons',
  'n5-020': 'Lesson 4 – Descriptions & Comparisons',
  'n5-021': 'Lesson 4 – Descriptions & Comparisons',
  'n5-022': 'Lesson 4 – Descriptions & Comparisons',
  'n5-023': 'Lesson 4 – Descriptions & Comparisons',
  'n5-024': 'Lesson 4 – Descriptions & Comparisons',

  'n5-025': 'Lesson 5 – Likes, Reasons & Sequencing',
  'n5-026': 'Lesson 5 – Likes, Reasons & Sequencing',
  'n5-027': 'Lesson 5 – Likes, Reasons & Sequencing',
  'n5-028': 'Lesson 5 – Likes, Reasons & Sequencing',
  'n5-029': 'Lesson 5 – Likes, Reasons & Sequencing',
  'n5-030': 'Lesson 5 – Likes, Reasons & Sequencing',

  'n5-031': 'Lesson 6 – Numbers, Time & Ability',
  'n5-032': 'Lesson 6 – Numbers, Time & Ability',
  'n5-033': 'Lesson 6 – Numbers, Time & Ability',
  'n5-034': 'Lesson 6 – Numbers, Time & Ability',
  'n5-035': 'Lesson 6 – Numbers, Time & Ability',
};

function getLessonForPoint(item) {
  if (LESSON_MAP[item.id]) return LESSON_MAP[item.id];
  
  // Dynamic calculation for N4, N3, N2, N1
  const num = parseInt(item.id.split('-')[1], 10);
  const lvl = item.level;

  if (lvl === 'N4') {
    if (num <= 6) return 'Lesson 1 – Permissions, Obligations & Thoughts';
    if (num <= 12) return 'Lesson 2 – Explanations, Experiences & Conditions';
    if (num <= 18) return 'Lesson 3 – Hypotheses, Voices & Extremes';
    if (num <= 24) return 'Lesson 4 – Ease, Simultaneous Action & Favors';
    if (num <= 30) return 'Lesson 5 – Completion, Habits & Conjecture';
    return 'Lesson 6 – Resemblance, Causes & Politeness';
  }
  if (lvl === 'N3') {
    if (num <= 6) return 'Lesson 1 – Nuance & Expectations';
    if (num <= 12) return 'Lesson 2 – Tendencies, Time & Degree';
    if (num <= 18) return 'Lesson 3 – Difficulty, Propensity & Causes';
    if (num <= 24) return 'Lesson 4 – Inevitability & Relationships';
    if (num <= 30) return 'Lesson 5 – Perspectives & Negatives';
    if (num <= 36) return 'Lesson 6 – Alternative Negations & Desires';
    return 'Lesson 7 – Necessity, Extent & Immediate Action';
  }
  if (lvl === 'N2') {
    if (num <= 7) return 'Lesson 1 – Contrast & Compensation';
    if (num <= 14) return 'Lesson 2 – Grounds, Scope & Bases';
    if (num <= 21) return 'Lesson 3 – Range, Inevitability & Emotion';
    if (num <= 28) return 'Lesson 4 – Capability, Progression & Difficulty';
    if (num <= 35) return 'Lesson 5 – Limits & Strong Negation';
    if (num <= 41) return 'Lesson 6 – Principles, Advice & Consequences';
    return 'Lesson 7 – Endings, Excess & Directional Time';
  }
  if (lvl === 'N1') {
    if (num <= 6) return 'Lesson 1 – Defying Obstacles & Dual Actions';
    if (num <= 12) return 'Lesson 2 – Formality, Extremes & Exclusivity';
    if (num <= 18) return 'Lesson 3 – Emphasis, Negation & Compulsion';
    if (num <= 24) return 'Lesson 4 – Fate, Purpose & Hypothetical Tone';
    if (num <= 30) return 'Lesson 5 – Regrets, Audacity & Exclusivity';
    if (num <= 36) return 'Lesson 6 – States, Position & Instantaneous Events';
    return 'Lesson 7 – Immediate Succession & Emotional Depth';
  }
  return `${lvl} Core Topics`;
}

function findClozeTarget(g, ex) {
  const ja = ex.ja;

  // Custom targets for trickier points
  const customMap = {
    'n5-011': ['でした', 'じゃない', 'です', 'だ'],
    'n5-012': ['行かない', '行きませんでした', '食べました', '飲みます', 'ませんでした', 'ました', 'ません', 'ます'],
    'n5-013': ['住んでいます', '結婚しています', '読んでいます', 'ています', 'ている', 'でいます'],
    'n5-014': ['待ってください', '話してください', '書いてください', 'てください', 'でください'],
    'n5-015': ['走らないでください', '忘れないでください', '撮らないでください', 'ないでください'],
    'n5-016': ['食べたくない', '行きたいです', '食べたいです', 'たいです', 'たい', 'たくない'],
    'n5-017': ['休みましょう', '飲みませんか', '行きましょう', 'ましょう', 'ませんか'],
    'n5-018': ['います', 'あります'],
    'n5-019': ['暑くなかった', '安いです', '大きい', '安い', '暑い'],
    'n5-020': ['親切じゃない', 'きれいです', '静かな', 'きれい', '静か'],
    'n5-021': ['ですか', 'か'],
    'n5-022': ['よね', 'ね', 'よ'],
    'n5-023': ['より'],
    'n5-024': ['ほうが'],
    'n5-025': ['下手です', '好きです', '上手です', '下手', '好き', '上手', '嫌い'],
    'n5-026': ['から'],
    'n5-027': ['でしょう'],
    'n5-028': ['帰ってから', '食べてから', 'てから'],
    'n5-029': ['安くて', '行って', '起きて', 'て'],
    'n5-030': ['上手になりました', '寒くなりました', '医者になりたい', 'なりました', 'なりたい', 'なる'],
    'n5-031': ['五人', '二冊', '三つ'],
    'n5-032': ['何時に', 'だれ', 'どこに', 'いつ', 'どう', '何', '誰', 'どこ'],
    'n5-033': ['どれ', 'あの', 'その', 'この', 'これ', 'それ', 'あれ'],
    'n5-034': ['先週', '五日', '月曜日'],
    'n5-035': ['撮ることができます', '話すことができますか', '泳ぐことができます', 'ことができます', 'ことができる'],
    // N4
    'n4-001': ['入ってもいいですか', '使ってもいいです', '食べてもいいですか', 'てもいいですか', 'てもいいです', 'てもいい'],
    'n4-002': ['遅れちゃだめだよ', '入ってはいけません', '撮ってはいけません', 'てはいけません', 'てはいけない', 'ちゃだめ'],
    'n4-003': ['もう帰らなきゃ', 'なきゃ', '払わなければなりません', '勉強しなければならない', '行かなければならない', 'なければならない', 'なければなりません'],
    'n4-004': ['急がなくてもいいです', '来なくてもいいです', '食べなくてもいいです', 'なくてもいいです', 'なくてもいい'],
    'n4-005': ['勝つと思う', '降ると思います', 'いいと思います', 'と思う', 'と思います'],
    'n4-006': ['言っていました', 'と言いました', 'と言って', 'と言う', 'と言った'],
    'n4-007': ['なんです', 'のです', 'んです'],
    'n4-008': ['食べたことがない', '行ったことがある', '食べたことがある', '見たことがあります', 'ことがない', 'ことがある', 'ことがあります'],
    'n4-009': ['たり、買い物したり', '本を読んだり', 'たり〜たり', 'たり'],
    'n4-010': ['食べられません', '来られますか', '作れます', '話せます', '泳げます', '読める', '食べられる', '行ける', '泳げる'],
    'n4-011': ['帰ろう', '休もう', '食べよう', '行こう', 'よう', 'おう'],
    'n4-012': ['着いたら', 'あったら', '安かったら', 'たら'],
    'n4-013': ['春になると', '押すと', '曲がると', 'と'],
    'n4-014': ['安ければ', '行けば', 'よければ', 'ば'],
    'n4-015': ['日本へ行くなら', '京都なら', '彼なら', 'なら'],
    'n4-016': ['読まれている', '降られて', '盗まれました', '叱られました', '褒められました', 'られました', 'れる', 'られる'],
    'n4-017': ['遊ばせて', '待たせて', '食べさせました', '行かせました', 'させました', 'せた', 'させた'],
    'n4-018': ['静かすぎて', '食べすぎました', '飲みすぎました', '高すぎます', '食べすぎた', 'すぎて', 'すぎた', 'すぎます', 'すぎる'],
    'n4-019': ['使いにくいです', '見やすいです', '読みやすいです', 'やすい', 'にくい'],
    'n4-020': ['見ながら', '聞きながら', '飲みながら', 'ながら'],
    'n4-021': ['見に行きました', '買いに行きます', '食べに行きます', 'に行きます', 'に行きました'],
    'n4-022': ['手伝ってもらった', 'もらった', '教えてくれました', '買ってくれました', 'あげました', 'くれました', 'もらいました'],
    'n4-023': ['着てみて', '食べてみた', '行ってみたい', '着てみます', '行ってみます', '食べてみます', 'てみます', 'てみる', 'てみた', 'てみたい'],
    'n4-024': ['開けておいて', 'ておいて', '予約しておきました', '買っておきます', '書いておきます', 'ておきます', 'ておいた', 'ておく'],
    'n4-025': ['食べちゃった', 'ちゃった', '落としてしまいました', '忘れてしまった', '食べてしまいました', 'てしまいました', 'てしまった'],
    'n4-026': ['貼ってあります', '書いてあります', '並べてあります', 'てあります', 'てある'],
    'n4-027': ['ように', 'ようになる', 'ようになりました'],
    'n4-028': ['ことにした', 'ことになりました', 'ことにしました', 'ことにする', 'ことになる'],
    'n4-029': ['降るそうです', '高いそうです', '降るそうだ', 'おいしいそうだ', '結婚するそうだ', 'そうです', 'そうだ'],
    'n4-030': ['おいしそうです', '降りそうです', '落ちそうだ', '雨が降りそうだ', 'おいしそうだ', 'そうに', 'そうです', 'そうだ'],
    'n4-031': ['みたいに', 'みたいだ', 'ようだ', 'ようです'],
    'n4-032': ['男らしい', '雨らしい', '春らしい', 'らしい'],
    'n4-033': ['かもしれない', 'かもしれません'],
    'n4-034': ['はずがない', 'はずです', 'はずだ'],
    'n4-035': ['健康のために', '留学するために', 'ために'],
    'n4-036': ['雨なので', '急いでいたので', '好きなので', 'ので'],
    'n4-037': ['勉強したのに', '約束したのに', '高いのに', 'のに'],
    'n4-038': ['召し上がりますか', 'お持ちします', 'お読みになります', 'ご覧になります', 'お〜になる', 'お〜する'],
    // N3 specific
    'n3-003': ['ようにしています', 'ようにします', 'ようにする', 'ようにしている'],
    'n3-004': ['ことになっています', 'ことになっている'],
    'n3-015': ['忘れっぽくて', 'っぽくて', 'っぽい'],
    'n3-018': ['のため', 'ために'],
    'n3-019': ['ことはありません', 'ことはない'],
    'n3-022': ['ということです', 'ということですか', 'とのことです', 'ということだ', 'とのことだ'],
    'n3-030': ['に違いない', '違いない'],
    'n3-031': ['ないで', 'なくて'],
    'n3-032': ['ずに'],
    'n3-033': ['ようだ', 'ように', 'ような'],
    'n3-034': ['飼いたがっている', '食べたがらない', '行きたがっている', '食べたがる', 'たがっている', 'たがらない', 'たがる'],
    'n3-035': ['手伝ってほしい', '来てほしい', 'てほしい'],
    'n3-036': ['言えばよかった', '買えばよかった', 'ばよかった'],
    'n3-037': ['行かないと', '勉強しないといけない', 'ないと', 'ないといけない'],
    'n3-038': ['はずだ', 'に違いない', 'かもしれない'],
    'n3-039': ['くらい', 'ぐらい'],
    'n3-040': ['ほど'],
    'n3-041': ['知っていながら', '残念ながら', 'ながらも', 'ながら'],
    'n3-042': ['たとたんに', 'たとたん'],
    // N2 specific
    'n2-017': ['に応えたい', 'に応えて', 'に応じて'],
    'n2-021': ['笑わずにはいられなかった', '泣かずにはいられなかった', 'ずにはいられなかった', 'ずにはいられない', 'ないではいられない'],
    'n2-022': ['決めかねます', 'しかねます', 'かねます', 'かねる', 'かねない'],
    'n2-023': ['あり得ない', '得ない', 'うる', 'える'],
    'n2-037': ['べきだ', 'べきではない', 'ものではない'],
    'n2-045': ['くせに'],
    'n2-046': ['ように言われた', 'ように頼まれた', 'ように注意された', 'ように言う'],
    'n2-047': ['寒くなってきた', '買ってきます', 'てきた', 'てきます', '増えてきた', '変わっていく', '生きていく', 'てくる', 'ていく'],
    // N1 specific
    'n1-003': ['生まれながらの', 'ながらに', 'ながらの'],
    'n1-018': ['驚かせずにはおかなかった', 'ずにはおかなかった', 'ないではおかない', 'ずにはおかない'],
    'n1-019': ['余儀なくされた', '余儀なくされる'],
    'n1-020': ['禁じ得なかった', '禁じ得ない'],
    'n1-021': ['免れない', '免れなかった'],
    'n1-028': ['までもなく', 'には及びません', 'までもない', 'には及ばない'],
    'n1-031': ['ずくめ', 'いいことずくめ', '黒ずくめ'],
    'n1-032': ['まみれ', '泥まみれ', '借金まみれ', '汗まみれ'],
    'n1-033': ['たるもの', 'たるものは'],
    'n1-034': ['っぱなし', '開けっぱなし', '立ちっぱなし', 'つけっぱなし'],
    'n1-035': ['はおろか'],
    'n1-036': ['が早いか'],
    'n1-037': ['や否や'],
    'n1-038': ['そばから'],
    'n1-039': ['なり'],
    'n1-040': ['ごとき', 'ごとく'],
    'n1-041': ['相まって', 'と相まって'],
    'n1-042': ['にたえない', 'に堪えない', 'にたえません'],
  };

  if (customMap[g.id]) {
    for (const c of customMap[g.id]) {
      if (ja.includes(c)) return c;
    }
  }

  // General candidate extraction
  const tokens = [];
  const text = g.title + ' ' + (g.structure || '');
  const matches = text
    .replace(/[~～]/g, '')
    .split(/[\s/+・/()（）/、,]/)
    .filter(t => t.length > 0 && !['Noun', 'Verb', 'Adjective', 'comment', 'predicate', 'action', 'Tool', 'Place', 'Time'].includes(t));

  for (const m of matches) {
    if (m.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/)) {
      tokens.push(m);
    }
  }

  tokens.sort((a,b) => b.length - a.length);
  for (const t of tokens) {
    if (ja.includes(t)) return t;
  }

  // Fallback: search for first 2-3 hiragana particles/endings
  return null;
}

let unhandled = [];
const enriched = raw.grammar.map(item => {
  const lesson = getLessonForPoint(item);
  const cleanGrammar = item.title
    .replace(/[~～]/g, '')
    .split(/[\s(/（]/)[0]
    .trim() || item.title;

  const enrichedExamples = item.examples.map((ex, exIdx) => {
    let target = findClozeTarget(item, ex);
    if (!target) {
      unhandled.push({ id: item.id, title: item.title, ja: ex.ja });
      // best-effort fallback
      target = cleanGrammar;
    }

    const clozePrompt = ex.ja.includes(target)
      ? ex.ja.replace(target, '____')
      : ex.ja;
    const clozeAnswer = target;
    const clozeHint = item.meaning;

    const japaneseHtml = ex.ja.includes(target)
      ? ex.ja.replace(target, `<span class="text-[#e15b64] font-bold">${target}</span>`)
      : `<span class="text-[#e15b64] font-bold">${ex.ja}</span>`;

    const englishHtml = `<span class="text-[#e15b64] underline decoration-dotted font-semibold">${ex.en}</span>`;

    return {
      id: `${item.id}-ex${exIdx + 1}`,
      plainJapanese: ex.ja,
      reading: ex.reading,
      plainEnglish: ex.en,
      clozePrompt,
      clozeAnswer,
      clozeHint,
      japaneseHtml,
      englishHtml,
    };
  });

  return {
    ...item,
    grammar: cleanGrammar,
    lesson,
    examples: enrichedExamples,
  };
});

console.log('Processed 204 items.');
console.log('Unhandled cloze targets:', unhandled.length);
if (unhandled.length > 0) {
  console.log('Sample unhandled:', unhandled.slice(0, 10));
}

fs.writeFileSync(
  path.join(__dirname, '../src/data/user-grammar-curated.json'),
  JSON.stringify({ count: enriched.length, grammar: enriched }, null, 2),
  'utf8'
);
