const fs = require('fs');
const readline = require('readline');

async function parseUserGrammar() {
  const fileStream = fs.createReadStream('C:/Users/PC/.gemini/antigravity/brain/d040c80b-18c9-4398-84a8-f8d8510b8287/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let lastUser = '';
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes('Original explanations and examples')) {
        lastUser = obj.content;
      }
    } catch {}
  }

  // Find all complete grammar objects { ... }
  // We can find the start of each { "id": "n... and cut before the next one
  const pattern = /\{\s*"id":\s*"(n[1-5]-\d{3})"/g;
  const matches = [];
  let m;
  while ((m = pattern.exec(lastUser)) !== null) {
    matches.push({ id: m[1], index: m.index });
  }

  console.log('Total matched grammar items:', matches.length);
  const items = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    let end;
    if (i + 1 < matches.length) {
      // Find the last '},' before the next item
      const chunk = lastUser.slice(start, matches[i + 1].index);
      const lastClose = chunk.lastIndexOf('},');
      if (lastClose !== -1) {
        end = start + lastClose + 1;
      } else {
        end = matches[i + 1].index;
      }
    } else {
      // Last item: find last valid closing brace
      const sub = lastUser.slice(start);
      // It might be incomplete due to truncation
      const lastExampleClose = sub.lastIndexOf('}');
      end = start + sub.length;
    }

    const jsonSnippet = lastUser.slice(start, end).trim().replace(/,\s*$/, '');
    try {
      const parsed = JSON.parse(jsonSnippet);
      items.push(parsed);
    } catch (e) {
      console.log('Failed to parse item', matches[i].id, 'snippet length:', jsonSnippet.length);
      // Try to repair if examples array was cut off
      const jaIdx = jsonSnippet.indexOf('"ja":');
      if (jaIdx !== -1) {
        const repaired = jsonSnippet.replace(/,\s*"examples":\s*\[[\s\S]*$/, '') + ',"examples":[]}';
        try {
          items.push(JSON.parse(repaired));
          console.log('  Successfully repaired', matches[i].id);
        } catch (e2) {
          console.log('  Repair failed for', matches[i].id);
        }
      }
    }
  }

  console.log('Successfully extracted full objects:', items.length);
  const countsByLevel = {};
  for (const item of items) {
    countsByLevel[item.level] = (countsByLevel[item.level] || 0) + 1;
  }
  console.log('Counts by level:', countsByLevel);

  fs.writeFileSync('C:/Users/PC/.gemini/antigravity/scratch/nihongo/src/data/user-grammar-extracted.json', JSON.stringify({
    language: 'Japanese',
    source: 'Original explanations and examples written for personal study',
    count: items.length,
    grammar: items
  }, null, 2));

  console.log('Saved to src/data/user-grammar-extracted.json');
}

parseUserGrammar();
