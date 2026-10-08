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
    // If user starts at top-right (89, 40) and sweeps DOWNWARD to (33, 85)
    // Let's test starting near (35, 85) but drawing downward to (35, 105):
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
})
