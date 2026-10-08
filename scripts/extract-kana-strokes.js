// Script to extract KanjiVG SVG paths for Hiragana and Katakana
const fs = require('fs');
const path = require('path');

const HIRAGANA_CHARS = [
  // Gojuon
  'あ', 'い', 'う', 'え', 'お',
  'か', 'き', 'く', 'け', 'こ',
  'さ', 'し', 'す', 'せ', 'そ',
  'た', 'ち', 'つ', 'て', 'と',
  'な', 'に', 'ぬ', 'ね', 'の',
  'は', 'ひ', 'ふ', 'へ', 'ほ',
  'ま', 'み', 'む', 'め', 'も',
  'や', 'ゆ', 'よ',
  'ら', 'り', 'る', 'れ', 'ろ',
  'わ', 'を', 'ん',
  // Dakuten / Handakuten
  'が', 'ぎ', 'ぐ', 'げ', 'ご',
  'ざ', 'じ', 'ず', 'ぜ', 'ぞ',
  'だ', 'ぢ', 'づ', 'で', 'ど',
  'ば', 'び', 'ぶ', 'べ', 'ぼ',
  'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',
  // Small
  'ゃ', 'ゅ', 'ょ', 'っ'
];

const KATAKANA_CHARS = [
  // Gojuon
  'ア', 'イ', 'ウ', 'エ', 'オ',
  'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ',
  'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ',
  'ヤ', 'ユ', 'ヨ',
  'ラ', 'リ', 'ル', 'レ', 'ロ',
  'ワ', 'ヲ', 'ン',
  // Dakuten / Handakuten
  'ガ', 'ギ', 'グ', 'ゲ', 'ゴ',
  'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ',
  'ダ', 'ヂ', 'ヅ', 'デ', 'ド',
  'バ', 'ビ', 'ブ', 'ベ', 'ボ',
  'パ', 'ピ', 'プ', 'ペ', 'ポ',
  // Small
  'ャ', 'ュ', 'ョ', 'ッ'
];

async function fetchSvg(char) {
  const hex = '0' + char.charCodeAt(0).toString(16).toLowerCase();
  const url = `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch ${char} (${hex}): ${res.status}`);
      return null;
    }
    const text = await res.text();
    return { char, hex, text };
  } catch (err) {
    console.error(`Error fetching ${char}:`, err.message);
    return null;
  }
}

function parseSvg(char, text) {
  // Extract paths: <path id="..." d="..." ... />
  const paths = [];
  const pathRegex = /<path[^>]+d="([^"]+)"/g;
  let match;
  while ((match = pathRegex.exec(text)) !== null) {
    paths.push(match[1]);
  }

  // Extract numbers: <text transform="matrix(1 0 0 1 x y)">number</text>
  const numbers = [];
  const textRegex = /<text transform="matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)">(\d+)<\/text>/g;
  while ((match = textRegex.exec(text)) !== null) {
    numbers.push({
      num: parseInt(match[3], 10),
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
    });
  }

  return {
    char,
    strokes: paths,
    numbers,
    strokeCount: paths.length,
  };
}

async function main() {
  const allChars = [...new Set([...HIRAGANA_CHARS, ...KATAKANA_CHARS])];
  console.log(`Fetching stroke data for ${allChars.length} characters...`);

  const results = {};
  // Fetch in batches of 10
  for (let i = 0; i < allChars.length; i += 10) {
    const chunk = allChars.slice(i, i + 10);
    const fetched = await Promise.all(chunk.map(fetchSvg));
    for (const item of fetched) {
      if (item) {
        const parsed = parseSvg(item.char, item.text);
        results[item.char] = parsed;
      }
    }
    process.stdout.write(`Processed ${Math.min(i + 10, allChars.length)} / ${allChars.length}\r`);
  }
  console.log(`\nSuccessfully fetched ${Object.keys(results).length} characters.`);

  const outDir = path.join(__dirname, '../src/data');
  const outFile = path.join(outDir, 'kana-strokes.json');
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Saved JSON data to ${outFile}`);
}

main();
