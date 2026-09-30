import React from 'react'

/**
 * Safely parses Anki Japanese Support furigana syntax `漢字[かんじ]`
 * and Anki Cloze deletion syntax `{{c1::answer::hint}}` into React elements
 * without using dangerouslySetInnerHTML (preventing XSS).
 */
export function renderAnkiText(
  text: string,
  options?: { isClozeRevealed?: boolean }
): React.ReactNode {
  if (!text) return null

  const isRevealed = options?.isClozeRevealed ?? true

  // First split by Cloze pattern: {{c1::answer::hint}} or {{c1::answer}}
  const clozeRegex = /\{\{c\d+::([^}:]+)(?:::([^}]+))?\}\}/g
  const segments: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = clozeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(
        renderFuriganaSegment(
          text.slice(lastIndex, match.index),
          `seg-${lastIndex}`
        )
      )
    }
    const answer = match[1]
    const hint = match[2] || '...'
    if (isRevealed) {
      segments.push(
        <span
          key={`cloze-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold underline decoration-2 underline-offset-4"
        >
          {renderFuriganaSegment(answer, `cloze-ans-${match.index}`)}
        </span>
      )
    } else {
      segments.push(
        <span
          key={`cloze-${match.index}`}
          className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold"
        >
          [{hint}]
        </span>
      )
    }
    lastIndex = clozeRegex.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push(
      renderFuriganaSegment(text.slice(lastIndex), `seg-end-${lastIndex}`)
    )
  }

  return segments.length > 0 ? segments : text
}

function renderFuriganaSegment(
  segment: string,
  keyPrefix: string
): React.ReactNode {
  // Matches Kanji/word followed by [reading], e.g. 食べる[たべる] or 日本語[にほんご]
  const rubyRegex = /([^\s\[\]]+)\[([^\]]+)\]/g
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  let m: RegExpExecArray | null

  while ((m = rubyRegex.exec(segment)) !== null) {
    if (m.index > lastIdx) {
      parts.push(segment.slice(lastIdx, m.index))
    }
    const base = m[1]
    const rt = m[2]
    parts.push(
      <ruby key={`${keyPrefix}-${m.index}`} className="mx-0.5">
        {base}
        <rt className="text-[0.55em] font-normal text-muted-foreground select-none">
          {rt}
        </rt>
      </ruby>
    )
    lastIdx = rubyRegex.lastIndex
  }

  if (lastIdx < segment.length) {
    parts.push(segment.slice(lastIdx))
  }

  return parts.length > 0 ? <React.Fragment key={keyPrefix}>{parts}</React.Fragment> : segment
}

export interface CharDiff {
  char: string
  status: 'correct' | 'wrong' | 'missing'
}

/**
 * Compares user's typed answer with the expected answer (like Anki's {{type:Field}})
 */
export function diffTypedAnswer(
  expectedRaw: string,
  typedRaw: string
): { isExact: boolean; diffs: CharDiff[] } {
  // Normalize by stripping parenthetical romaji if user only typed kana or only romaji
  const cleanExpected = expectedRaw.replace(/\s*\(.*?\)\s*/g, '').trim()
  const cleanTyped = typedRaw.trim()

  const target =
    cleanTyped.toLowerCase() === expectedRaw.trim().toLowerCase()
      ? expectedRaw.trim()
      : cleanExpected

  const diffs: CharDiff[] = []
  const maxLen = Math.max(target.length, cleanTyped.length)
  let allCorrect = target.length > 0 && cleanTyped.length === target.length

  for (let i = 0; i < maxLen; i++) {
    const expChar = target[i]
    const typChar = cleanTyped[i]
    if (expChar && typChar && expChar.toLowerCase() === typChar.toLowerCase()) {
      diffs.push({ char: expChar, status: 'correct' })
    } else if (typChar && !expChar) {
      allCorrect = false
      diffs.push({ char: typChar, status: 'wrong' })
    } else if (expChar && typChar) {
      allCorrect = false
      diffs.push({ char: typChar, status: 'wrong' })
    } else if (expChar && !typChar) {
      allCorrect = false
      diffs.push({ char: expChar, status: 'missing' })
    }
  }

  return { isExact: allCorrect, diffs }
}
