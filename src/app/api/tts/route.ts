import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// In-memory LRU-like cache for instant repeat playback of Kana & Vocab audio
const ttsCache = new Map<string, Uint8Array>()
const MAX_CACHE_ENTRIES = 500

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const raw = searchParams.get('text') || ''

    const cleanText = raw
      .replace(/\{\{c\d+::([^}:]+)(?:::[^}]+)?\}\}/g, '$1')
      .replace(/\[[^\]]+\]/g, '')
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .slice(0, 200)

    if (!cleanText) {
      return new NextResponse('Missing text', { status: 400 })
    }

    const cached = ttsCache.get(cleanText)
    if (cached) {
      return new NextResponse(Buffer.from(cached), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      })
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(
      cleanText
    )}`

    let response = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      // Secondary fallback to client=gtx
      const gtxUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=gtx&q=${encodeURIComponent(
        cleanText
      )}`
      response = await fetch(gtxUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      })
    }

    if (!response.ok) {
      return new NextResponse('TTS upstream error', { status: 502 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    if (bytes.byteLength > 0) {
      if (ttsCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = ttsCache.keys().next().value
        if (oldestKey) ttsCache.delete(oldestKey)
      }
      ttsCache.set(cleanText, bytes)
    }

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch {
    return new NextResponse('TTS error', { status: 500 })
  }
}
