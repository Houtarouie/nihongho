import { describe, it, expect } from 'vitest'
import {
  evaluateUserStroke,
  parsePathPoints,
  distance,
} from '@/lib/kana/stroke-evaluator'

describe('Kana Stroke Evaluator (Stroke-by-Stroke Recognition)', () => {
  it('accepts correct Stroke 1 of Hiragana あ', () => {
    // Expected stroke 1 of あ: starts near (31, 33) and goes right to (72, 30)
    const userPoints = [
      { x: 31, y: 33 },
      { x: 45, y: 34 },
      { x: 60, y: 32 },
      { x: 72, y: 30 },
    ]

    const result = evaluateUserStroke({
      kana: 'あ',
      expectedStrokeIndex: 0,
      userPoints,
    })

    expect(result.isMatch).toBe(true)
    expect(result.feedbackType).toBe('correct')
    expect(result.message).toContain('Stroke 1')
  })

  it('detects wrong stroke order when user draws Stroke 2 instead of Stroke 1', () => {
    // Stroke 2 of あ starts at top vertical: (49.7, 17.6) and drops down to (49.4, 90.1)
    const userPoints = [
      { x: 50, y: 18 },
      { x: 50, y: 40 },
      { x: 48, y: 70 },
      { x: 49, y: 88 },
    ]

    const result = evaluateUserStroke({
      kana: 'あ',
      expectedStrokeIndex: 0, // Expecting stroke 1, but user drew stroke 2
      userPoints,
    })

    expect(result.isMatch).toBe(false)
    expect(result.feedbackType).toBe('wrong_order')
    expect(result.matchedStrokeIndex).toBe(1) // matched stroke 2 (0-indexed 1)
    expect(result.message).toContain('Wrong stroke order')
    expect(result.message).toContain('stroke 2')
    expect(result.message).toContain('stroke 1 comes first')
  })

  it('detects reverse direction when user draws stroke backwards', () => {
    // Stroke 1 of あ goes LEFT to RIGHT. User draws RIGHT to LEFT.
    const userPoints = [
      { x: 72, y: 30 },
      { x: 55, y: 32 },
      { x: 31, y: 33 },
    ]

    // Note: start (72, 30) is far from expected start (31, 33), but let's test a stroke started near start and drawn backwards
    // For stroke 1: if user starts near (35, 33) and moves LEFT to (10, 33)
    const backwardStroke = [
      { x: 35, y: 33 },
      { x: 25, y: 33 },
      { x: 15, y: 33 },
    ]

    const result = evaluateUserStroke({
      kana: 'あ',
      expectedStrokeIndex: 0,
      userPoints: backwardStroke,
    })

    expect(result.isMatch).toBe(false)
    expect(result.feedbackType).toBe('wrong_direction')
    expect(result.message).toContain('Wrong direction')
  })

  it('rejects strokes that are too short (accidental taps)', () => {
    const tinyTap = [
      { x: 31, y: 33 },
      { x: 32, y: 34 },
    ]

    const result = evaluateUserStroke({
      kana: 'あ',
      expectedStrokeIndex: 0,
      userPoints: tinyTap,
    })

    expect(result.isMatch).toBe(false)
    expect(result.feedbackType).toBe('too_short')
    expect(result.message).toContain('too short')
  })

  it('rejects strokes starting off-target in random corners', () => {
    const offTarget = [
      { x: 95, y: 10 },
      { x: 95, y: 25 },
      { x: 95, y: 40 },
    ]

    const result = evaluateUserStroke({
      kana: 'あ',
      expectedStrokeIndex: 0,
      userPoints: offTarget,
    })

    expect(result.isMatch).toBe(false)
    expect(result.feedbackType).toBe('off_target')
    expect(result.message).toContain('Start stroke 1')
  })

  it('provides confusable directional feedback for Katakana シ vs ツ', () => {
    // In Katakana シ, Stroke 3 sweeps UPWARD from bottom-left (33, 85) to top-right (89, 40)
    const wrongDirShi = [
      { x: 35, y: 85 },
      { x: 35, y: 100 },
    ]

    const result = evaluateUserStroke({
      kana: 'シ',
      expectedStrokeIndex: 2,
      userPoints: wrongDirShi,
    })

    expect(result.isMatch).toBe(false)
    expect(result.feedbackType).toBe('wrong_direction')
    expect(result.message).toContain('sweeps UPWARD')
  })

  it('rejects multi-turn zigzag scribbles (like user screenshot) on Hiragana ま', () => {
    // User draws an erratic zigzag across the canvas instead of a clean horizontal line
    const zigzagScribble = [
      { x: 28, y: 32 },
      { x: 80, y: 32 },
      { x: 28, y: 45 },
      { x: 80, y: 55 },
      { x: 28, y: 70 },
      { x: 80, y: 75 },
    ]

    const result = evaluateUserStroke({
      kana: 'ま',
      expectedStrokeIndex: 0,
      userPoints: zigzagScribble,
    })

    expect(result.isMatch).toBe(false)
    expect(result.feedbackType).toBe('off_target')
    expect(result.message).toContain('without zigzags')
  })

  it('strictly detects wrong stroke order when user draws Stroke 2 of ま instead of Stroke 1', () => {
    // In ま:
    // Stroke 1 is top horizontal: (29.8, 32.3) -> (78.8, 28.2)
    // Stroke 2 is bottom horizontal: (33.8, 51.8) -> (77.0, 46.6)
    const stroke2DrawnFirst = [
      { x: 34, y: 52 },
      { x: 55, y: 50 },
      { x: 77, y: 47 },
    ]

    const result = evaluateUserStroke({
      kana: 'ま',
      expectedStrokeIndex: 0, // Stroke 1 was expected
      userPoints: stroke2DrawnFirst,
    })

    expect(result.isMatch).toBe(false)
    expect(result.feedbackType).toBe('wrong_order')
    expect(result.matchedStrokeIndex).toBe(1) // Identified as Stroke 2 (0-indexed 1)
    expect(result.message).toContain('Wrong stroke order')
    expect(result.message).toContain('stroke 2')
    expect(result.message).toContain('stroke 1 comes first')
  })

  it('strictly accepts correct Stroke 1 of ま when drawn accurately left-to-right', () => {
    const stroke1Accurate = [
      { x: 30, y: 32 },
      { x: 52, y: 31 },
      { x: 78, y: 28 },
    ]

    const result = evaluateUserStroke({
      kana: 'ま',
      expectedStrokeIndex: 0,
      userPoints: stroke1Accurate,
    })

    expect(result.isMatch).toBe(true)
    expect(result.feedbackType).toBe('correct')
    expect(result.message).toContain('Stroke 1 completed')
  })

  it('detects reverse drawing when Stroke 1 of ま is drawn right-to-left', () => {
    // Drawn backwards from right to left
    const stroke1Backwards = [
      { x: 78, y: 28 },
      { x: 52, y: 31 },
      { x: 30, y: 32 },
    ]

    const result = evaluateUserStroke({
      kana: 'ま',
      expectedStrokeIndex: 0,
      userPoints: stroke1Backwards,
    })

    expect(result.isMatch).toBe(false)
    expect(result.feedbackType).toBe('wrong_direction')
    expect(result.message).toContain('Wrong direction')
  })
})
