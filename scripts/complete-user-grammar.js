const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/user-grammar-extracted.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Fix n1-031
const n1_031 = data.grammar.find(g => g.id === 'n1-031');
if (n1_031) {
  n1_031.examples = [
    {
      ja: "彼は黒ずくめの服装だった。",
      reading: "かれはくろずくめのふくそうだった。",
      en: "He was dressed all in black."
    },
    {
      ja: "今日はいいことずくめだった。",
      reading: "きょうはいいことずくめだった。",
      en: "Today was full of good things."
    },
    {
      ja: "結構ずくめの話だが、本当だろうか。",
      reading: "けっこうずくめのはなしだが、ほんとうだろうか。",
      en: "It sounds like all good news, but is it really true?"
    }
  ];
}

const missingN1 = [
  {
    id: "n1-032",
    level: "N1",
    title: "~まみれ",
    meaning: "Covered in ~ / smeared with ~",
    structure: "Noun + まみれ",
    explanation: "Describes something being covered all over with an unpleasant substance like mud, blood, sweat, or dust.",
    nuance: "Negative nuance. Usually used with sticky or messy physical substances.",
    examples: [
      {
        ja: "泥まみれになって遊んだ。",
        reading: "どろまみれになってあそんだ。",
        en: "We played until we were covered in mud."
      },
      {
        ja: "借金まみれの生活から抜け出したい。",
        reading: "しゃっきんまみれのせいかつからぬけだしたい。",
        en: "I want to escape a life buried in debt."
      },
      {
        ja: "彼は汗まみれで走っていた。",
        reading: "かれはあせまみれではしっていた。",
        en: "He was running drenched in sweat."
      }
    ]
  },
  {
    id: "n1-033",
    level: "N1",
    title: "~たるもの",
    meaning: "As someone who is / in the position of ~",
    structure: "Noun + たるもの",
    explanation: "Expresses what is naturally expected or required of someone who holds a certain duty, profession, or status.",
    nuance: "High formal register. Often followed by strong moral obligation (べきだ, なければならない).",
    examples: [
      {
        ja: "医者たるもの、患者の命を最優先にすべきだ。",
        reading: "いしゃたるもの、かんじゃのいのちをさいゆうせんにすべきだ。",
        en: "As a doctor, one should prioritize the patient's life above all."
      },
      {
        ja: "指導者たるものは、常に冷静でなければならない。",
        reading: "しどうしゃたるものは、つねにれいせいでなければならない。",
        en: "A leader must always remain calm."
      },
      {
        ja: "プロの選手たるもの、ファンを大切にするべきだ。",
        reading: "プロのせんしゅたるもの、ファンをたいせつにするべきだ。",
        en: "As a professional athlete, one should value the fans."
      }
    ]
  },
  {
    id: "n1-034",
    level: "N1",
    title: "~っぱなし",
    meaning: "Leaving ~ as it is / left in a state",
    structure: "Verb [ます stem] + っぱなし",
    explanation: "Indicates that an action or condition continues without the expected subsequent action being taken.",
    nuance: "Generally carries an annoyed or critical tone regarding negligence.",
    examples: [
      {
        ja: "ドアを開けっぱなしにしないでください。",
        reading: "ドアをあけっぱなしにしないでください。",
        en: "Please do not leave the door open."
      },
      {
        ja: "一日中立ちっぱなしで足が痛い。",
        reading: "いちにちじゅうたちっぱなしであしがいたい。",
        en: "My legs hurt from being on my feet all day."
      },
      {
        ja: "電気をつけっぱなしで寝てしまった。",
        reading: "でんきをつけっぱなしでねてしまった。",
        en: "I fell asleep with the lights left on."
      }
    ]
  },
  {
    id: "n1-035",
    level: "N1",
    title: "~はおろか",
    meaning: "Let alone ~ / not to mention ~",
    structure: "Noun (+ 助詞) + はおろか",
    explanation: "States that something obvious or easier is not even possible, so something harder is certainly out of the question.",
    nuance: "Usually followed by a negative statement emphasizing the extreme shortfall.",
    examples: [
      {
        ja: "彼は漢字はおろか、ひらがなも読めない。",
        reading: "かれはかんじはおろか、ひらがなもよめない。",
        en: "He cannot read hiragana, let alone kanji."
      },
      {
        ja: "忙しくて旅行はおろか、休む暇もない。",
        reading: "いそがしくてりょこうはおろか、やすむひまもない。",
        en: "I'm so busy I don't even have time to rest, let alone travel."
      },
      {
        ja: "怪我をして歩くことはおろか、立つこともできない。",
        reading: "けがをしてあるくことはおろか、たつこともできない。",
        en: "Because of my injury, I can't even stand, let alone walk."
      }
    ]
  },
  {
    id: "n1-036",
    level: "N1",
    title: "~が早いか",
    meaning: "No sooner had ~ than / the instant ~",
    structure: "Verb [辞書形 / た形] + が早いか",
    explanation: "Describes an immediate, almost instantaneous subsequent action taking place right as the first finishes.",
    nuance: "Cannot be used for speaker's intentional volition; describes an observed sudden event.",
    examples: [
      {
        ja: "終業のベルが鳴るが早いか、生徒たちは教室を飛び出した。",
        reading: "しゅうぎょうのベルがなるがはやいか、せいとたちはきょうしつをとびだした。",
        en: "No sooner had the dismissal bell rung than students rushed out of the room."
      },
      {
        ja: "彼は席に着くが早いか、お弁当を開けた。",
        reading: "かれはせきにつくがはやいか、おべんとうをあけた。",
        en: "The moment he sat down, he opened his bento."
      },
      {
        ja: "知らせを聞くが早いか、彼女は病院へ駆けつけた。",
        reading: "しらせをきくがはやいか、かのじょはびょういんへかけつけた。",
        en: "As soon as she heard the news, she rushed to the hospital."
      }
    ]
  },
  {
    id: "n1-037",
    level: "N1",
    title: "~や否や",
    meaning: "The moment ~ / as soon as ~",
    structure: "Verb [辞書形] + や否や",
    explanation: "Describes the moment an event occurs, immediately followed by another sudden, unplanned occurrence.",
    nuance: "Formal, literary written expression.",
    examples: [
      {
        ja: "彼の顔を見るや否や、彼女は泣き出してしまった。",
        reading: "かれのかおをみるやいなや、かのじょはなきだしてしまった。",
        en: "The moment she saw his face, she burst into tears."
      },
      {
        ja: "空が暗くなるや否や、大雨が降り始めた。",
        reading: "そらがくらくなるやいなや、おおあめがふりはじめた。",
        en: "No sooner had the sky darkened than heavy rain began falling."
      },
      {
        ja: "アナウンスが流れるや否や、観客が立ち上がった。",
        reading: "アナウンスがながれるやいなや、かんきゃくがたちあがった。",
        en: "The instant the announcement played, the audience stood up."
      }
    ]
  },
  {
    id: "n1-038",
    level: "N1",
    title: "~そばから",
    meaning: "As soon as ~ (repeatedly undone or negated)",
    structure: "Verb [辞書形 / た形] + そばから",
    explanation: "Used when doing an action is immediately negated or countered repeatedly, expressing futility or exasperation.",
    nuance: "Emphasizes recurring frustration: as soon as one step is done, it's undone.",
    examples: [
      {
        ja: "部屋を片付けるそばから、子どもが散らかしていく。",
        reading: "へやをかたづけるそばから、こどもがちらかしていく。",
        en: "As fast as I tidy the room, the child messes it up again."
      },
      {
        ja: "新しい単語を覚えるそばから忘れてしまう。",
        reading: "あたらしいたんごをおぼえるそばからわすれてしまう。",
        en: "As quickly as I memorize new vocabulary words, I forget them."
      },
      {
        ja: "注意するそばから同じ間違いを繰り返す。",
        reading: "ちゅういするそばからおなじまちがいをくりかえす。",
        en: "No sooner are they warned than they repeat the exact same mistake."
      }
    ]
  },
  {
    id: "n1-039",
    level: "N1",
    title: "~なり",
    meaning: "Immediately upon ~ / as soon as ~",
    structure: "Verb [辞書形] + なり",
    explanation: "Indicates that right after doing an action, a sudden, somewhat unexpected subsequent action is taken by the same subject.",
    nuance: "Third-person subject in the past tense. Expresses quick, impulsive action.",
    examples: [
      {
        ja: "彼は電話を切るなり、急いで部屋を出て行った。",
        reading: "かれはでんわをきるなり、いそいでへやをでていった。",
        en: "Immediately upon hanging up the phone, he hurried out of the room."
      },
      {
        ja: "帰宅するなり、ソファに倒れ込んで眠ってしまった。",
        reading: "きたくするなり、ソファにたおれこんでねむってしまった。",
        en: "As soon as he got home, he collapsed onto the couch and fell asleep."
      },
      {
        ja: "知らせを聞くなり、彼は顔色を変えた。",
        reading: "しらせをきくなり、かれはかおいろをかえた。",
        en: "Upon hearing the news, his expression changed instantly."
      }
    ]
  },
  {
    id: "n1-040",
    level: "N1",
    title: "~ごとき / ~ごとく",
    meaning: "Like ~ / as if ~ / the likes of ~",
    structure: "Noun + ごとき (modifies noun) / ごとく (modifies verb/adj)",
    explanation: "Classical expression meaning 'like' or 'as if'. Can also be used to deprecate oneself or belittle an opponent.",
    nuance: "Literary and dramatic. Often used in speeches, literature, or self-deprecation.",
    examples: [
      {
        ja: "私ごとき若輩者に、このような大役は務まりません。",
        reading: "わたしごときじゃくはいしゃに、このようなたいやくはつとまりません。",
        en: "A novice like me is not suited for such a major role."
      },
      {
        ja: "矢のごとく速く走り去った。",
        reading: "やのごとくはやくはしりさった。",
        en: "He ran away as swiftly as an arrow."
      },
      {
        ja: "一度の失敗ごときで諦めてはいけない。",
        reading: "いちどのしっぱいごときであきらめてはいけない。",
        en: "You must not give up over something as minor as a single failure."
      }
    ]
  },
  {
    id: "n1-041",
    level: "N1",
    title: "~と相まって",
    meaning: "Coupled with ~ / combined with ~",
    structure: "Noun + と相まって",
    explanation: "Two factors combine synergistically to produce a notable outcome or stronger effect.",
    nuance: "Formal written/spoken Japanese. Usually produces an enhanced positive or pronounced effect.",
    examples: [
      {
        ja: "彼の才能が努力と相まって、素晴らしい成果を生んだ。",
        reading: "かれのさいのうがどりょくとあいまって、すばらしいせいかをうんだ。",
        en: "His talent, coupled with hard work, produced magnificent results."
      },
      {
        ja: "美しい夕暮れが潮風と相まって、特別な雰囲気を醸し出していた。",
        reading: "うつくしいゆうぐれがしおかぜとあいまって、とくべつなふんいきをかもしだしていた。",
        en: "The beautiful sunset combined with the sea breeze created a magical atmosphere."
      },
      {
        ja: "好天と祝日が相まって、行楽地は大勢の人で賑わった。",
        reading: "こうてんとしゅくじつがあいまって、こうらくちはおおぜいのひとでにぎわった。",
        en: "The fine weather coupled with the holiday drew huge crowds to the resort."
      }
    ]
  },
  {
    id: "n1-042",
    level: "N1",
    title: "~にたえない",
    meaning: "Cannot bear to ~ / deeply (feel emotion)",
    structure: "Verb [辞書形] + にたえない / Noun + にたえない",
    explanation: "Expresses that something is too painful/embarrassing to bear, or that an emotion (gratitude, regret) is overwhelmingly deep.",
    nuance: "High formal register; very common in formal addresses, letters, and JLPT reading.",
    examples: [
      {
        ja: "皆様の温かいご支援には、感謝にたえません。",
        reading: "みなさまのあたたかいごしえんには、かんしゃにたえません。",
        en: "I cannot express enough gratitude for everyone's warm support."
      },
      {
        ja: "彼の無礼な振る舞いは、目にするにたえない。",
        reading: "かれのぶれいなふるまいは、めにするにたえない。",
        en: "His rude behavior is simply unbearable to watch."
      },
      {
        ja: "このような悲惨な事故は、聞くにたえない。",
        reading: "このようなひさんなじこは、きくにたえない。",
        en: "Such a tragic accident is too painful to even hear about."
      }
    ]
  }
];

// Append missing ones if not already present
for (const item of missingN1) {
  if (!data.grammar.some(g => g.id === item.id)) {
    data.grammar.push(item);
  }
}

data.count = data.grammar.length;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Updated user-grammar-extracted.json. Total count:', data.grammar.length);
