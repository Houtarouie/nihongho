import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { parseSqliteAnkiNotes } from '@/lib/anki/importer'

export const dynamic = 'force-dynamic'

const KNOWN_APKG_DIRS = [
  'D:/japan',
  'C:/Users/PC/Downloads',
  'C:/Users/PC/Downloads/chl gya toh chand tk/minecraft mods',
]

function extractSqliteFromApkgBuffer(buf: Buffer): Uint8Array | null {
  let eocd = -1
  const minEocd = Math.max(0, buf.length - 65557)
  for (let i = buf.length - 22; i >= minEocd; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd === -1) return null

  const cdCount = buf.readUInt16LE(eocd + 10)
  let pos = buf.readUInt32LE(eocd + 16)
  const candidates: { name: string; data: Uint8Array }[] = []

  for (let e = 0; e < cdCount && pos + 46 <= buf.length; e++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break
    const method = buf.readUInt16LE(pos + 10)
    const compSize = buf.readUInt32LE(pos + 20)
    const nameLen = buf.readUInt16LE(pos + 28)
    const extraLen = buf.readUInt16LE(pos + 30)
    const commentLen = buf.readUInt16LE(pos + 32)
    const localOff = buf.readUInt32LE(pos + 42)
    const name = buf.subarray(pos + 46, pos + 46 + nameLen).toString('utf8')

    if (
      (name === 'collection.anki21' || name === 'collection.anki2') &&
      localOff + 30 <= buf.length
    ) {
      const lNameLen = buf.readUInt16LE(localOff + 26)
      const lExtraLen = buf.readUInt16LE(localOff + 28)
      const start = localOff + 30 + lNameLen + lExtraLen
      const slice = buf.subarray(start, Math.min(buf.length, start + compSize))
      try {
        const dec = method === 8 ? zlib.inflateRawSync(slice) : slice
        candidates.push({
          name,
          data: new Uint8Array(dec.buffer, dec.byteOffset, dec.byteLength),
        })
      } catch {
        // ignore decompression error
      }
    }
    pos += 46 + nameLen + extraLen + commentLen
  }

  candidates.sort((a, b) =>
    a.name === 'collection.anki21' ? -1 : b.name === 'collection.anki21' ? 1 : 0
  )
  return candidates[0]?.data || null
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const deckName =
      searchParams.get('deckName') ||
      'Japanese::Japanese_course_based_on_Tae_Kims_grammar_guide__anime'
    const baseName = deckName.replace(/^Japanese::/i, '').trim()

    for (const dir of KNOWN_APKG_DIRS) {
      const candidatePath = path.join(dir, `${baseName}.apkg`)
      if (fs.existsSync(candidatePath)) {
        const buf = fs.readFileSync(candidatePath)
        const sqliteBytes = extractSqliteFromApkgBuffer(buf)
        if (sqliteBytes) {
          const cards = parseSqliteAnkiNotes(sqliteBytes, deckName, 1500)
          return NextResponse.json({ deckName, cards })
        }
      }
    }

    return NextResponse.json({ deckName, cards: [] })
  } catch {
    return NextResponse.json({ cards: [] }, { status: 500 })
  }
}
