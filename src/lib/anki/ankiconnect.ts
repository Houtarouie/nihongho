import type { SRSCard } from '@/data/srs-deck'

const ANKI_CONNECT_URL = 'http://127.0.0.1:8765'

async function invokeAnkiConnect<T = unknown>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(ANKI_CONNECT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }),
  })
  if (!response.ok) {
    throw new Error(`AnkiConnect HTTP error: ${response.status}`)
  }
  const data = await response.json()
  if (data.error) {
    throw new Error(String(data.error))
  }
  return data.result as T
}

export async function pingAnkiConnect(): Promise<{
  connected: boolean
  decks: string[]
  error?: string
}> {
  try {
    const decks = await invokeAnkiConnect<string[]>('deckNames')
    return { connected: true, decks }
  } catch (err) {
    return {
      connected: false,
      decks: [],
      error:
        err instanceof Error
          ? err.message
          : 'Could not reach Desktop Anki on port 8765',
    }
  }
}

export async function pushCardsToAnkiConnect(
  deckName: string,
  cards: SRSCard[]
): Promise<{ addedCount: number }> {
  await invokeAnkiConnect('createDeck', { deck: deckName })

  const notes = cards.map((c) => ({
    deckName,
    modelName: 'Basic',
    fields: {
      Front: `${c.front}${c.exampleSentence ? `<br><small>${c.exampleSentence}</small>` : ''}`,
      Back: `<b>${c.reading}</b><br>${c.meaning}${
        c.exampleTranslation ? `<br><i>${c.exampleTranslation}</i>` : ''
      }`,
    },
    options: {
      allowDuplicate: false,
    },
    tags: ['nihongo-app', c.category, c.jlptLevel, ...(c.tags || [])],
  }))

  const results = await invokeAnkiConnect<(number | null)[]>('addNotes', {
    notes,
  })
  const addedCount = Array.isArray(results)
    ? results.filter((id) => id !== null).length
    : 0
  return { addedCount }
}

interface AnkiNoteInfo {
  noteId: number
  tags: string[]
  fields: Record<string, { value: string; order: number }>
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export async function pullCardsFromAnkiConnect(
  deckName: string
): Promise<
  {
    front: string
    reading: string
    meaning: string
    tags: string[]
  }[]
> {
  const noteIds = await invokeAnkiConnect<number[]>('findNotes', {
    query: `deck:"${deckName}"`,
  })
  if (!noteIds || noteIds.length === 0) return []

  const notes = await invokeAnkiConnect<AnkiNoteInfo[]>('notesInfo', {
    notes: noteIds.slice(0, 200),
  })

  return notes
    .map((n) => {
      const fieldValues = Object.values(n.fields || {}).sort(
        (a, b) => a.order - b.order
      )
      const front = stripHtml(fieldValues[0]?.value || '')
      const back = stripHtml(fieldValues[1]?.value || '')
      const reading = fieldValues[2]
        ? stripHtml(fieldValues[2].value)
        : front
      return {
        front,
        reading,
        meaning: back || front,
        tags: n.tags || [],
      }
    })
    .filter((item) => item.front && item.meaning)
}
