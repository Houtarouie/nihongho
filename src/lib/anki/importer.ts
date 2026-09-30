import type { SRSCard, CardCategory, AnkiNoteType } from '@/data/srs-deck'

/**
 * Generates an Anki-compatible Tab-Separated Values (.txt) export file
 * with standard Anki 2.1.54+ headers (#separator:tab, #deck column:1, #tags column:7)
 */
export function exportToAnkiTSV(cards: SRSCard[]): string {
  const lines: string[] = [
    '#separator:tab',
    '#html:false',
    '#deck column:1',
    '#notetype column:2',
    '#tags column:7',
  ]

  for (const c of cards) {
    const deck = (c.deckName || `Japanese::${c.category}`).replace(/\t|\n/g, ' ')
    const noteType = c.noteType || 'Basic'
    const front = c.front.replace(/\t|\n/g, ' ')
    const reading = c.reading.replace(/\t|\n/g, ' ')
    const meaning = c.meaning.replace(/\t|\n/g, ' ')
    const example = (c.exampleSentence || '').replace(/\t|\n/g, ' ')
    const tags = [c.category, c.jlptLevel, ...(c.tags || [])]
      .filter(Boolean)
      .join(' ')

    lines.push(
      [deck, noteType, front, reading, meaning, example, tags].join('\t')
    )
  }

  return lines.join('\n')
}

/**
 * Parses an Anki TSV/CSV/TXT file into card objects.
 * Supports 2-column (Front, Back) and multi-column Nihongo/Anki exports.
 */
export function parseAnkiTSV(content: string): {
  deckName?: string
  noteType?: AnkiNoteType
  front: string
  reading: string
  meaning: string
  category: CardCategory
  jlptLevel: string
  exampleSentence?: string
  tags: string[]
}[] {
  const lines = content.split(/\r?\n/)
  const results: {
    deckName?: string
    noteType?: AnkiNoteType
    front: string
    reading: string
    meaning: string
    category: CardCategory
    jlptLevel: string
    exampleSentence?: string
    tags: string[]
  }[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const cols = line.includes('\t') ? line.split('\t') : line.split(',')
    if (cols.length < 2) continue

    if (cols.length >= 5 && cols[0].includes('::')) {
      // Full 7-column export format: Deck, NoteType, Front, Reading, Meaning, Example, Tags
      const [deckName, noteTypeRaw, front, reading, meaning, example, tagsRaw] =
        cols
      const tags = (tagsRaw || '').split(/\s+/).filter(Boolean)
      const category: CardCategory = tags.includes('kanji')
        ? 'kanji'
        : tags.includes('grammar')
        ? 'grammar'
        : tags.includes('kana')
        ? 'kana'
        : 'vocabulary'
      const jlpt =
        tags.find((t) => /^N[1-5]$/.test(t)) || 'N5'

      results.push({
        deckName: deckName.trim(),
        noteType: (['basic', 'reversed', 'cloze', 'type'].includes(
          noteTypeRaw.trim().toLowerCase()
        )
          ? noteTypeRaw.trim().toLowerCase()
          : 'basic') as AnkiNoteType,
        front: front.trim(),
        reading: reading.trim() || front.trim(),
        meaning: meaning.trim(),
        category,
        jlptLevel: jlpt,
        exampleSentence: example?.trim() || undefined,
        tags,
      })
    } else {
      // Standard Anki 2- or 3-column format: Front, Back, [Tags]
      const front = cols[0].trim()
      const meaning = cols[1].trim()
      const reading = cols.length >= 3 ? cols[2].trim() : front
      const tags =
        cols.length >= 4 ? cols[3].trim().split(/\s+/).filter(Boolean) : ['imported']

      if (front && meaning) {
        results.push({
          deckName: 'Japanese::Imported',
          noteType: front.includes('{{c1::') ? 'cloze' : 'basic',
          front,
          reading,
          meaning,
          category: 'vocabulary',
          jlptLevel: 'N5',
          tags,
        })
      }
    }
  }

  return results
}
