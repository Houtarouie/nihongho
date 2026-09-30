import type { SRSCard, CardCategory, AnkiNoteType } from '@/data/srs-deck'

export interface ParsedAnkiCardInput {
  deckName?: string
  noteType?: AnkiNoteType
  front: string
  reading: string
  meaning: string
  category: CardCategory
  jlptLevel: string
  exampleSentence?: string
  exampleTranslation?: string
  tags: string[]
}

/**
 * Generates an Anki-compatible Tab-Separated Values (.txt) export file
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

export function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\[sound:[^\]]+\]/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<a[^>]*>\s*(link|url|source)\s*<\/a>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u205f/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

export function parseAnkiTSV(
  content: string,
  targetDeckName?: string
): ParsedAnkiCardInput[] {
  const lines = content.split(/\r?\n/)
  const results: ParsedAnkiCardInput[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const cols = line.includes('\t') ? line.split('\t') : line.split(',')
    if (cols.length < 2) continue

    if (cols.length >= 5 && cols[0].includes('::')) {
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
      const jlpt = tags.find((t) => /^N[1-5]$/.test(t)) || 'N5'

      results.push({
        deckName: targetDeckName || deckName.trim(),
        noteType: (['basic', 'reversed', 'cloze', 'type'].includes(
          noteTypeRaw.trim().toLowerCase()
        )
          ? noteTypeRaw.trim().toLowerCase()
          : 'basic') as AnkiNoteType,
        front: stripHtmlTags(front).replace(/\n+/g, ' '),
        reading:
          stripHtmlTags(reading).replace(/\n+/g, ' ') ||
          stripHtmlTags(front).replace(/\n+/g, ' '),
        meaning: stripHtmlTags(meaning).replace(/\n+/g, ' '),
        category,
        jlptLevel: jlpt,
        exampleSentence: example
          ? stripHtmlTags(example).replace(/\n+/g, ' ')
          : undefined,
        tags,
      })
    } else {
      const front = stripHtmlTags(cols[0]).replace(/\n+/g, ' ')
      const meaning = stripHtmlTags(cols[1]).replace(/\n+/g, ' ')
      const reading =
        cols.length >= 3 ? stripHtmlTags(cols[2]).replace(/\n+/g, ' ') : front
      const tags =
        cols.length >= 4
          ? cols[3].trim().split(/\s+/).filter(Boolean)
          : ['imported']

      if (front && meaning) {
        results.push({
          deckName: targetDeckName || 'Japanese::Imported',
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

function readSqliteVarint(
  bytes: Uint8Array,
  pos: number
): { val: number; len: number } {
  let val = 0
  for (let i = 0; i < 8; i++) {
    const b = bytes[pos + i] ?? 0
    val = val * 128 + (b & 0x7f)
    if ((b & 0x80) === 0) return { val, len: i + 1 }
  }
  val = val * 256 + (bytes[pos + 8] ?? 0)
  return { val, len: 9 }
}

function sqliteSerialTypeLen(st: number): number {
  if (st === 0 || st === 8 || st === 9) return 0
  if (st === 1) return 1
  if (st === 2) return 2
  if (st === 3) return 3
  if (st === 4) return 4
  if (st === 5) return 6
  if (st === 6 || st === 7) return 8
  if (st >= 12) return Math.floor((st - 12) / 2)
  return 0
}

/**
 * Maps a single Anki note's fields array + tags into a structured SRSCard input,
 * ensuring the English translation is always mapped to `meaning` and never confused with Kana readings.
 */
export function mapAnkiNoteFieldsToCard(
  rawFields: string[],
  tagsStr: string,
  deckLabel: string
): ParsedAnkiCardInput | null {
  const fields = rawFields.map(stripHtmlTags)
  const tags = tagsStr
    .trim()
    .split(/\s+/)
    .filter((t) => t && /^[\w-]+$/.test(t))
  const jlptMatch = tagsStr.match(/N[1-5]/i)
  const jlptLevel = jlptMatch ? jlptMatch[0].toUpperCase() : 'N5'

  // 1. Specialized handler for JLAB / Tae Kim Anime Grammar Deck (20+ fields)
  if (
    fields.length >= 15 &&
    /^\d+$/.test(fields[0]) &&
    /^\d{10,15}$/.test(fields[1])
  ) {
    const rawExpr = fields[11] || fields[9] || ''
    const front = rawExpr
      .replace(/\[[^\]]+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!front || !/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(front)) {
      return null
    }
    const kana = (fields[13] || fields[12] || front)
      .replace(/\s+/g, ' ')
      .trim()
    const romaji = (fields[21] || '').replace(/\s+/g, ' ').trim()
    const reading =
      romaji && romaji.toLowerCase() !== kana.toLowerCase()
        ? `${kana} (${romaji})`
        : kana

    const rawExplanation = fields[6] || fields[5] || ''
    const paragraphs = rawExplanation
      .split(/\n{2,}/)
      .map((s) => s.replace(/\n+/g, ' ').trim())
      .filter(Boolean)

    const meaning =
      paragraphs[0] ||
      fields[5]?.replace(/\n+/g, ' ').trim() ||
      romaji ||
      'Japanese expression'
    const extraExplanation = paragraphs.slice(1).join(' ')
    const hint =
      fields[5] && fields[5] !== paragraphs[0]
        ? fields[5].replace(/\n+/g, ' ').trim()
        : ''
    const animeSource = fields[2] ? `Anime: ${fields[2]}` : ''
    const furiSentence =
      fields[9] && fields[9].replace(/\s+/g, '') !== front.replace(/\s+/g, '')
        ? fields[9].replace(/\s+/g, ' ').trim()
        : undefined

    return {
      deckName: deckLabel,
      noteType: 'basic',
      front,
      reading,
      meaning,
      category: 'vocabulary',
      jlptLevel,
      exampleSentence: furiSentence,
      exampleTranslation:
        [hint, extraExplanation, animeSource].filter(Boolean).join(' • ') ||
        undefined,
      tags: tags.length > 0 ? tags : ['apkg'],
    }
  }

  // 2. General multi-field Japanese Anki deck handler (2 to 15 fields)
  const hasJP = (s: string) =>
    /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(s)
  const isPOS = (s: string) =>
    /^(noun|verb|adjective|adverb|particle|expression|ichidan|godan|suru|transitive|intransitive|na adjective|i adjective|no adjective|prefix|suffix|conjunction|interjection|pronoun|counter|abbreviation|[,\s/-])+$/i.test(
      s.trim()
    )

  // Also split any multi-line field if a 2-field deck put Reading + English on separate lines in Back
  const expandedFields: string[] = []
  for (const f of fields) {
    if (!f) continue
    if (
      f.includes('\n') &&
      hasJP(f) &&
      /[a-zA-Z]{2,}/.test(f)
    ) {
      for (const line of f.split(/\n+/)) {
        if (line.trim()) expandedFields.push(line.trim())
      }
    } else {
      expandedFields.push(f.replace(/\n+/g, ' ').trim())
    }
  }

  const nonEmpty = expandedFields.filter(
    (f) =>
      f &&
      !/^\d+$/.test(f) &&
      !/^https?:\/\//i.test(f) &&
      !/please update to the latest anki/i.test(f)
  )
  if (nonEmpty.length < 2) return null

  const jpFields = nonEmpty.filter((f) => hasJP(f))
  const enFields = nonEmpty.filter((f) => !hasJP(f) && /[a-zA-Z]/.test(f))
  if (jpFields.length === 0 || enFields.length === 0) return null

  const rawFront = jpFields[0]
  const front = rawFront.replace(/\[[^\]]+\]/g, '').trim()
  if (!front || front.length > 90) return null

  let reading = front
  if (rawFront.includes('[')) {
    reading = rawFront
  } else if (
    jpFields.length >= 2 &&
    jpFields[1].length <= front.length * 3 + 10
  ) {
    reading = jpFields[1]
  }

  const meaningCandidates = enFields.filter((f) => !isPOS(f))
  const primaryEn = meaningCandidates.length > 0 ? meaningCandidates : enFields
  let meaning = primaryEn[0]
  if (
    primaryEn.length >= 2 &&
    primaryEn[1].length < 45 &&
    !/[.!?]$/.test(primaryEn[1])
  ) {
    meaning = `${primaryEn[0]}; ${primaryEn[1]}`
  }

  const isKanaCard =
    /^[\u3040-\u30ff]{1,3}$/.test(front) && /^[a-z()\s-]{1,8}$/i.test(meaning)
  if (isKanaCard) {
    reading = meaning
  }

  const exampleJP = jpFields.find(
    (f) => f !== rawFront && f !== reading && f.length > front.length + 3
  )
  const exampleEN = primaryEn.find(
    (f) =>
      f !== primaryEn[0] &&
      !meaning.includes(f) &&
      (/[.!?]$/.test(f) || f.length > 30)
  )

  return {
    deckName: deckLabel,
    noteType: front.includes('{{c1::') ? 'cloze' : 'basic',
    front,
    reading,
    meaning,
    category: isKanaCard ? 'kana' : 'vocabulary',
    jlptLevel,
    exampleSentence: exampleJP,
    exampleTranslation: exampleEN,
    tags: tags.length > 0 ? tags : ['apkg'],
  }
}

/**
 * Extracts notes directly from an Anki SQLite3 database buffer (`collection.anki21` / `collection.anki2`)
 * by walking SQLite Table B-Tree Leaf Pages (`0x0d`) and reading the 11-column `notes` table.
 */
export function parseSqliteAnkiNotes(
  db: Uint8Array,
  deckLabel: string,
  maxCards = 1500
): ParsedAnkiCardInput[] {
  const cards: ParsedAnkiCardInput[] = []
  const seenFronts = new Set<string>()
  const decoder = new TextDecoder('utf-8', { fatal: false })

  if (db.byteLength > 100) {
    const headerStr = decoder.decode(db.subarray(0, 15))
    if (headerStr === 'SQLite format 3') {
      const view = new DataView(db.buffer, db.byteOffset, db.byteLength)
      const rawPageSize = view.getUint16(16, false)
      const pageSize = rawPageSize === 1 ? 65536 : rawPageSize
      if (pageSize >= 512 && pageSize <= 65536) {
        const numPages = Math.floor(db.byteLength / pageSize)

        for (let p = 0; p < numPages; p++) {
          const pStart = p * pageSize
          const hOff = p === 0 ? 100 : 0
          if (pStart + hOff + 8 > db.byteLength) continue
          const pageType = db[pStart + hOff]
          if (pageType !== 0x0d) continue // Only Table B-Tree Leaf pages

          const cellCount = view.getUint16(pStart + hOff + 3, false)
          for (let c = 0; c < cellCount; c++) {
            const ptrPos = pStart + hOff + 8 + c * 2
            if (ptrPos + 2 > db.byteLength) break
            const cellOff = view.getUint16(ptrPos, false)
            let pos = pStart + cellOff
            if (pos >= pStart + pageSize || pos >= db.byteLength) continue

            const pSize = readSqliteVarint(db, pos)
            pos += pSize.len
            const rowId = readSqliteVarint(db, pos)
            pos += rowId.len

            const payloadStart = pos
            const hSize = readSqliteVarint(db, pos)
            pos += hSize.len
            const hEnd = payloadStart + hSize.val
            if (hEnd > pStart + pageSize || hEnd > db.byteLength) continue

            const sts: number[] = []
            while (pos < hEnd && sts.length < 20) {
              const st = readSqliteVarint(db, pos)
              sts.push(st.val)
              pos += st.len
            }

            // `notes` table in Anki has 11 columns: id, guid, mid, mod, usn, tags(5), flds(6), sfld, csum, flags, data
            if (sts.length === 11) {
              let colPos = hEnd
              for (let k = 0; k < 5; k++) colPos += sqliteSerialTypeLen(sts[k])
              const tagsLen = sqliteSerialTypeLen(sts[5])
              if (colPos + tagsLen > pStart + pageSize) continue
              const tagsStr = decoder.decode(
                db.subarray(colPos, colPos + tagsLen)
              )
              colPos += tagsLen

              const fldsLen = sqliteSerialTypeLen(sts[6])
              if (fldsLen <= 0 || colPos + fldsLen > pStart + pageSize) continue
              const fldsStr = decoder.decode(
                db.subarray(colPos, colPos + fldsLen)
              )
              if (!fldsStr.includes('\x1f')) continue

              const mapped = mapAnkiNoteFieldsToCard(
                fldsStr.split('\x1f'),
                tagsStr,
                deckLabel
              )
              if (mapped && !seenFronts.has(mapped.front)) {
                seenFronts.add(mapped.front)
                cards.push(mapped)
                if (cards.length >= maxCards) return cards
              }
            }
          }
        }
      }
    }
  }

  if (cards.length > 0) return cards

  // Fallback row-boundary scanner if SQLite pages were fragmented/overflowed
  const rawText = decoder.decode(db)
  const rows = rawText.split(/[\x00-\x08\x0b\x0c\x0e-\x1e]+/)
  for (const row of rows) {
    if (!row.includes('\x1f')) continue
    const mapped = mapAnkiNoteFieldsToCard(row.split('\x1f'), '', deckLabel)
    if (mapped && !seenFronts.has(mapped.front)) {
      seenFronts.add(mapped.front)
      cards.push(mapped)
      if (cards.length >= maxCards) break
    }
  }

  return cards
}

async function decompressDeflateRaw(
  slice: Uint8Array
): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null
  try {
    const ds = new DecompressionStream('deflate-raw')
    const writer = ds.writable.getWriter()
    const copy = new Uint8Array(slice.byteLength)
    copy.set(slice)
    writer.write(copy)
    writer.close()
    const resp = new Response(ds.readable)
    const ab = await resp.arrayBuffer()
    return new Uint8Array(ab)
  } catch {
    return null
  }
}

/**
 * Extracts Anki notes directly from a binary .apkg / .colpkg file.
 * Locates the ZIP End of Central Directory (0x06054b50) to jump directly to the Central Directory,
 * prioritizes `collection.anki21` over the legacy `collection.anki2` stub, and parses the SQLite `notes` table.
 */
export async function parseAnkiApkgBinary(
  file: File,
  customDeckName?: string
): Promise<ParsedAnkiCardInput[]> {
  const deckLabel =
    customDeckName ||
    `Japanese::${file.name.replace(/\.(apkg|colpkg)$/i, '').trim() || 'Imported Deck'}`

  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const view = new DataView(buf)
  const candidateDbs: { name: string; data: Uint8Array }[] = []

  // Step 1: Locate ZIP End of Central Directory (EOCD: 0x06054b50) in the last 65KB
  let eocdPos = -1
  const minEocd = Math.max(0, bytes.length - 65557)
  for (let i = bytes.length - 22; i >= minEocd; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdPos = i
      break
    }
  }

  if (eocdPos !== -1) {
    const cdCount = view.getUint16(eocdPos + 10, true)
    let pos = view.getUint32(eocdPos + 16, true)

    for (let e = 0; e < cdCount && pos + 46 <= bytes.length; e++) {
      if (view.getUint32(pos, true) !== 0x02014b50) break

      const compressionMethod = view.getUint16(pos + 10, true)
      const compressedSize = view.getUint32(pos + 20, true)
      const fileNameLen = view.getUint16(pos + 28, true)
      const extraLen = view.getUint16(pos + 30, true)
      const commentLen = view.getUint16(pos + 32, true)
      const localHeaderOffset = view.getUint32(pos + 42, true)

      const fileName = new TextDecoder().decode(
        bytes.subarray(pos + 46, pos + 46 + fileNameLen)
      )

      if (
        (fileName === 'collection.anki21' ||
          fileName === 'collection.anki2' ||
          fileName.endsWith('.txt') ||
          fileName.endsWith('.tsv')) &&
        localHeaderOffset + 30 <= bytes.length
      ) {
        const localNameLen = view.getUint16(localHeaderOffset + 26, true)
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
        const dataEnd = Math.min(bytes.length, dataStart + compressedSize)
        const slice = bytes.subarray(dataStart, dataEnd)

        if (compressionMethod === 0) {
          candidateDbs.push({ name: fileName, data: slice })
        } else if (compressionMethod === 8) {
          const decompressed = await decompressDeflateRaw(slice)
          if (decompressed) {
            candidateDbs.push({ name: fileName, data: decompressed })
          }
        }
      }

      pos += 46 + fileNameLen + extraLen + commentLen
    }
  }

  // Prioritize collection.anki21 (full Anki 2.1 database) over collection.anki2 (which is often a 1-card stub)
  candidateDbs.sort((a, b) =>
    a.name === 'collection.anki21' ? -1 : b.name === 'collection.anki21' ? 1 : 0
  )

  let bestCards: ParsedAnkiCardInput[] = []
  for (const dbEntry of candidateDbs) {
    const parsed = parseSqliteAnkiNotes(dbEntry.data, deckLabel)
    if (parsed.length > bestCards.length) {
      bestCards = parsed
    }
  }

  return bestCards
}
