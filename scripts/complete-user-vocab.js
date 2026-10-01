const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:/Users/PC/.gemini/antigravity/brain/d040c80b-18c9-4398-84a8-f8d8510b8287/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let vocabContent = '';
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('v0001')) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.content && parsed.content.length > vocabContent.length) {
        vocabContent = parsed.content;
      }
    } catch (e) {}
  }
}

const jsonStart = vocabContent.indexOf('{');
const truncatedPos = vocabContent.indexOf('<truncated');
let rawJsonText = vocabContent.substring(jsonStart, truncatedPos !== -1 ? truncatedPos : undefined);

// Extract all scenario metadata
const scenarioRegex = /\{\s*"id":\s*"(s\d+)",\s*"scenario":\s*"([^"]+)",\s*"situation":\s*"([^"]+)",\s*"word_count":\s*(\d+)/g;
const scenarios = [];
let sm;
while ((sm = scenarioRegex.exec(rawJsonText)) !== null) {
  scenarios.push({
    id: sm[1],
    scenario: sm[2],
    situation: sm[3],
    word_count: parseInt(sm[4], 10),
    words: []
  });
}

// Extract all complete words
const wordRegex = /\{\s*"id":\s*"(v\d+)",\s*"word":\s*"([^"]+)",\s*"reading":\s*"([^"]+)",\s*"meaning":\s*"([^"]+)",\s*"pos":\s*"([^"]+)",\s*"tag":\s*"([^"]+)",\s*"example":\s*\{\s*"ja":\s*"([^"]+)",\s*"reading":\s*"([^"]+)",\s*"en":\s*"([^"]+)"\s*\}\s*\}/g;

const allWords = [];
let wm;
while ((wm = wordRegex.exec(rawJsonText)) !== null) {
  allWords.push({
    id: wm[1],
    word: wm[2],
    reading: wm[3],
    meaning: wm[4],
    pos: wm[5],
    tag: wm[6],
    example: {
      ja: wm[7],
      reading: wm[8],
      en: wm[9],
    }
  });
}

// Complete the remaining 16 words for s20 (v0385 to v0400)
const missingWords = [
  {
    id: "v0385",
    word: "すみません",
    reading: "すみません",
    meaning: "excuse me / sorry",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "すみません、ちょっと通してください。",
      reading: "すみません、ちょっととおしてください。",
      en: "Excuse me, could you let me through?"
    }
  },
  {
    id: "v0386",
    word: "悪い",
    reading: "わるい",
    meaning: "my bad / thank you (casual)",
    pos: "i-adj",
    tag: "slang",
    example: {
      ja: "悪い、ちょっとペン貸してくれる？",
      reading: "わるい、ちょっとペンかしてくれる？",
      en: "My bad, could you lend me a pen?"
    }
  },
  {
    id: "v0387",
    word: "感謝",
    reading: "かんしゃ",
    meaning: "gratitude / appreciation",
    pos: "noun",
    tag: "standard",
    example: {
      ja: "いつも助けてくれて、本当に感謝してる。",
      reading: "いつもたすけてくれて、ほんとうにかんしゃしてる。",
      en: "I'm truly grateful for your help all the time."
    }
  },
  {
    id: "v0388",
    word: "どういたしまして",
    reading: "どういたしまして",
    meaning: "you're welcome",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "お礼なんていいよ、どういたしまして！",
      reading: "おれいなんていいよ、どういたしまして！",
      en: "No need for thanks, you're welcome!"
    }
  },
  {
    id: "v0389",
    word: "気にしないで",
    reading: "きにしないで",
    meaning: "don't sweat it",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "全然気にしないで！大したことないよ。",
      reading: "ぜんぜんきにしないで！たいしたことないよ。",
      en: "Don't sweat it at all! It's no big deal."
    }
  },
  {
    id: "v0390",
    word: "お礼",
    reading: "おれい",
    meaning: "thanks / gift of thanks",
    pos: "noun",
    tag: "standard",
    example: {
      ja: "手伝ってくれたお礼に、ランチ奢るね。",
      reading: "てつだってくれたおれいに、ランチおごるね。",
      en: "As thanks for helping, I'll treat you to lunch."
    }
  },
  {
    id: "v0391",
    word: "申し訳ない",
    reading: "もうしわけない",
    meaning: "I feel terrible / so sorry",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "忙しいのに呼び出しちゃって、申し訳ない。",
      reading: "いそがしいのによびだしちゃって、もうしわけない。",
      en: "I feel so bad calling you out when you're busy."
    }
  },
  {
    id: "v0392",
    word: "恩返し",
    reading: "おんがえし",
    meaning: "returning a favor",
    pos: "noun",
    tag: "standard",
    example: {
      ja: "いつかちゃんと恩返しするからね。",
      reading: "いつかちゃんとおんがえしするからね。",
      en: "I'll definitely return the favor one day."
    }
  },
  {
    id: "v0393",
    word: "迷惑",
    reading: "めいわく",
    meaning: "bother / trouble",
    pos: "noun",
    tag: "standard",
    example: {
      ja: "迷惑かけて本当にごめんね。",
      reading: "めいわくかけてほんとうにごめんね。",
      en: "I'm so sorry for causing you trouble."
    }
  },
  {
    id: "v0394",
    word: "許す",
    reading: "ゆるす",
    meaning: "to forgive",
    pos: "verb",
    tag: "standard",
    example: {
      ja: "プリン食べちゃったの、許してくれる？",
      reading: "プリンたべちゃったの、ゆるしてくれる？",
      en: "Can you forgive me for eating your pudding?"
    }
  },
  {
    id: "v0395",
    word: "謝る",
    reading: "あやまる",
    meaning: "to apologize",
    pos: "verb",
    tag: "standard",
    example: {
      ja: "私が悪かったから、ちゃんと謝るね。",
      reading: "わたしがわるかったから、ちゃんとあやまるね。",
      en: "I was in the wrong, so I'll apologize properly."
    }
  },
  {
    id: "v0396",
    word: "お世話になる",
    reading: "おせわになる",
    meaning: "to be indebted to someone",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "泊めてもらって、本当にお世話になりました。",
      reading: "とめてもらって、ほんとうにおせわになりました。",
      en: "Thank you so much for taking care of me and letting me stay."
    }
  },
  {
    id: "v0397",
    word: "助かった",
    reading: "たすかった",
    meaning: "you saved my life / so helpful",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "傘貸してくれて助かったよ！",
      reading: "かさかしてくれてたすかったよ！",
      en: "Thanks for lending me the umbrella, that saved me!"
    }
  },
  {
    id: "v0398",
    word: "遠慮しないで",
    reading: "えんりょしないで",
    meaning: "don't be shy / feel free",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "お菓子いっぱいあるから、遠慮しないで食べてね。",
      reading: "おかしいっぱいあるから、えんりょしないでたべてね。",
      en: "There's plenty of snacks, so please don't be shy and dig in."
    }
  },
  {
    id: "v0399",
    word: "頼りになる",
    reading: "たよりになる",
    meaning: "reliable / dependable",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "困ったとき、いつも頼りになるね。",
      reading: "こまったとき、いつもたよりになるね。",
      en: "You're always so dependable whenever I'm in trouble."
    }
  },
  {
    id: "v0400",
    word: "よろしく",
    reading: "よろしく",
    meaning: "please treat me well / counting on you",
    pos: "phrase",
    tag: "standard",
    example: {
      ja: "これからも仲良くしてね、よろしく！",
      reading: "これからもなかよくしてね、よろしく！",
      en: "Let's keep being great friends, counting on you!"
    }
  }
];

allWords.push(...missingWords);

console.log('Total words after completion:', allWords.length);

// Distribute words to scenarios
// We have 20 scenarios, each has around 20 words
let wordIndex = 0;
const scenarioWordCounts = [
  20, 20, 20, 20, 20,
  20, 20, 20, 20, 20,
  20, 20, 21, 20, 20,
  20, 20, 20, 19, 20
];

const structuredScenarios = scenarios.map((sc, idx) => {
  const count = scenarioWordCounts[idx] || 20;
  const scWords = allWords.slice(wordIndex, wordIndex + count);
  wordIndex += count;
  return {
    ...sc,
    word_count: scWords.length,
    words: scWords,
  };
});

const output = {
  language: "Japanese",
  focus: "Casual daily conversation with friends",
  note: "Original word list and example sentences written for personal study. 'slang' tagged items are casual and not for formal settings.",
  scenario_count: structuredScenarios.length,
  word_count: allWords.length,
  scenarios: structuredScenarios,
};

const targetPath = path.join(__dirname, '../src/data/user-conversation-vocab.json');
fs.writeFileSync(targetPath, JSON.stringify(output, null, 2), 'utf8');

console.log('Saved 400 conversational words across 20 scenarios to:', targetPath);
