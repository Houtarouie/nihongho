import { getKanaStrokes } from './stroke-order'

export interface Point2D {
  x: number
  y: number
}

export type StrokeFeedbackType =
  | 'correct'
  | 'wrong_order'
  | 'wrong_direction'
  | 'too_short'
  | 'off_target'

export interface StrokeEvaluationResult {
  isMatch: boolean
  feedbackType: StrokeFeedbackType
  matchedStrokeIndex?: number
  message: string
}

/**
 * Euclidean distance between two points in 2D space.
 */
export function distance(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

/**
 * Parses SVG path string `d` into key anchor points along the trajectory.
 * Works deterministically in any environment (Browser, Node, Vitest).
 */
export function parsePathPoints(d: string): Point2D[] {
  let currX = 0
  let currY = 0
  const points: Point2D[] = []
  const commands = d.match(/([a-zA-Z])([^a-zA-Z]*)/g) || []

  for (const cmdStr of commands) {
    const type = cmdStr[0]
    const args = (cmdStr.slice(1).match(/-?[\d.]+/g) || []).map(Number)

    if (type === 'M') {
      currX = args[0]
      currY = args[1]
      points.push({ x: currX, y: currY })
    } else if (type === 'm') {
      currX += args[0]
      currY += args[1]
      points.push({ x: currX, y: currY })
    } else if (type === 'c') {
      for (let i = 0; i < args.length; i += 6) {
        currX += args[i + 4]
        currY += args[i + 5]
        points.push({ x: currX, y: currY })
      }
    } else if (type === 'C') {
      for (let i = 0; i < args.length; i += 6) {
        currX = args[i + 4]
        currY = args[i + 5]
        points.push({ x: currX, y: currY })
      }
    } else if (type === 'l') {
      for (let i = 0; i < args.length; i += 2) {
        currX += args[i]
        currY += args[i + 1]
        points.push({ x: currX, y: currY })
      }
    } else if (type === 's') {
      for (let i = 0; i < args.length; i += 4) {
        currX += args[i + 2]
        currY += args[i + 3]
        points.push({ x: currX, y: currY })
      }
    }
  }

  return points
}

/**
 * Calculates total path length across sampled points.
 */
export function getPointsLength(points: Point2D[]): number {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i])
  }
  return len
}

/**
 * Resamples an array of points into N evenly spaced points along the path.
 */
export function resamplePoints(points: Point2D[], count: number = 10): Point2D[] {
  if (points.length <= 1) return points
  const totalLen = getPointsLength(points)
  if (totalLen <= 0) return Array(count).fill(points[0])

  const interval = totalLen / (count - 1)
  const resampled: Point2D[] = [points[0]]

  let currentDist = 0
  let targetDist = interval
  let ptIdx = 1

  while (ptIdx < points.length && resampled.length < count - 1) {
    const prev = points[ptIdx - 1]
    const curr = points[ptIdx]
    const segLen = distance(prev, curr)

    if (currentDist + segLen >= targetDist) {
      const ratio = (targetDist - currentDist) / (segLen || 1)
      const interp = {
        x: prev.x + ratio * (curr.x - prev.x),
        y: prev.y + ratio * (curr.y - prev.y),
      }
      resampled.push(interp)
      targetDist += interval
    } else {
      currentDist += segLen
      ptIdx++
    }
  }

  while (resampled.length < count) {
    resampled.push(points[points.length - 1])
  }

  return resampled
}

/**
 * Returns directional advice for strokes, including katakana confusables (シ vs ツ, ソ vs ン).
 */
export function getDirectionFeedback(char: string, strokeIndex: number): string | null {
  if (char === 'シ' && strokeIndex === 2) {
    return 'Stroke 3 of シ sweeps UPWARD from bottom-left to top-right (unlike ツ which sweeps downward).'
  }
  if (char === 'ツ' && strokeIndex === 2) {
    return 'Stroke 3 of ツ sweeps DOWNWARD from top-right to bottom-left (unlike シ which sweeps upward).'
  }
  if (char === 'ン' && strokeIndex === 1) {
    return 'Stroke 2 of ン sweeps UPWARD from bottom-left (unlike ソ which sweeps downward).'
  }
  if (char === 'ソ' && strokeIndex === 1) {
    return 'Stroke 2 of ソ sweeps DOWNWARD from top-right (unlike ン which sweeps upward).'
  }
  return null
}

/**
 * Evaluates a user-drawn stroke against the expected stroke in a kana character.
 * Enforces stroke order, starting point, and drawing direction.
 */
export function evaluateUserStroke(params: {
  kana: string
  expectedStrokeIndex: number
  userPoints: Point2D[]
}): StrokeEvaluationResult {
  const { kana, expectedStrokeIndex, userPoints } = params
  const strokeData = getKanaStrokes(kana)

  if (!strokeData || strokeData.strokes.length === 0) {
    return {
      isMatch: true,
      feedbackType: 'correct',
      message: 'Stroke accepted.',
    }
  }

  const totalStrokes = strokeData.strokeCount

  // 1. Guard against accidental taps
  const userLen = getPointsLength(userPoints)
  if (userPoints.length < 2 || userLen < 10) {
    return {
      isMatch: false,
      feedbackType: 'too_short',
      message: 'Stroke is too short. Please draw the line across or down.',
    }
  }

  const expectedPathD = strokeData.strokes[expectedStrokeIndex]
  const expectedPoints = parsePathPoints(expectedPathD)
  if (expectedPoints.length === 0) {
    return {
      isMatch: true,
      feedbackType: 'correct',
      message: 'Stroke accepted.',
    }
  }

  const expectedStart = expectedPoints[0]
  const expectedEnd = expectedPoints[expectedPoints.length - 1]
  const userStart = userPoints[0]
  const userEnd = userPoints[userPoints.length - 1]

  const distToExpectedStart = distance(userStart, expectedStart)

  // 2. Stroke Order Check: Did user draw another stroke instead?
  for (let j = 0; j < totalStrokes; j++) {
    if (j === expectedStrokeIndex) continue
    const otherPoints = parsePathPoints(strokeData.strokes[j])
    if (otherPoints.length > 0) {
      const otherStart = otherPoints[0]
      const distOther = distance(userStart, otherStart)
      // If user started close to stroke j AND significantly closer than expected stroke:
      if (distOther <= 25 && distOther < distToExpectedStart - 6) {
        return {
          isMatch: false,
          feedbackType: 'wrong_order',
          matchedStrokeIndex: j,
          message: `Wrong stroke order! That was stroke ${j + 1}, but stroke ${
            expectedStrokeIndex + 1
          } comes first. Follow the numbered guide 1 → ${totalStrokes}.`,
        }
      }
    }
  }

  // If user started too far from expected start point:
  if (distToExpectedStart > 28) {
    // Check if user started closer to a DIFFERENT stroke of this character
    let bestOtherMatch: { idx: number; dist: number } | null = null

    for (let j = 0; j < totalStrokes; j++) {
      if (j === expectedStrokeIndex) continue
      const otherPoints = parsePathPoints(strokeData.strokes[j])
      if (otherPoints.length > 0) {
        const otherStart = otherPoints[0]
        const d = distance(userStart, otherStart)
        if (d <= 28 && (!bestOtherMatch || d < bestOtherMatch.dist)) {
          bestOtherMatch = { idx: j, dist: d }
        }
      }
    }

    if (bestOtherMatch !== null) {
      return {
        isMatch: false,
        feedbackType: 'wrong_order',
        matchedStrokeIndex: bestOtherMatch.idx,
        message: `Wrong stroke order! That was stroke ${bestOtherMatch.idx + 1}, but stroke ${
          expectedStrokeIndex + 1
        } comes first. Follow the numbered guide 1 → ${totalStrokes}.`,
      }
    }

    return {
      isMatch: false,
      feedbackType: 'off_target',
      message: `Start stroke ${expectedStrokeIndex + 1} near circle ${
        expectedStrokeIndex + 1
      }.`,
    }
  }

  // 3. Direction Check: Did the user draw the stroke backwards?
  const expVecX = expectedEnd.x - expectedStart.x
  const expVecY = expectedEnd.y - expectedStart.y
  const expVecLen = Math.hypot(expVecX, expVecY)

  const userVecX = userEnd.x - userStart.x
  const userVecY = userEnd.y - userStart.y
  const userVecLen = Math.hypot(userVecX, userVecY)

  if (expVecLen > 12 && userVecLen > 10) {
    const dotProduct = expVecX * userVecX + expVecY * userVecY
    const cosAngle = dotProduct / (expVecLen * userVecLen)

    // Angle > ~105 degrees means drawn in opposite direction
    if (cosAngle < -0.25) {
      const customTip = getDirectionFeedback(kana, expectedStrokeIndex)
      return {
        isMatch: false,
        feedbackType: 'wrong_direction',
        message:
          customTip ||
          `Wrong direction! Draw stroke ${
            expectedStrokeIndex + 1
          } in the opposite direction.`,
      }
    }
  }

  // 4. Shape & Proximity Check: User started in correct place and drew in correct direction!
  // Verify user didn't stop wildly far away from the intended path
  const distToEnd = distance(userEnd, expectedEnd)
  const isLoopOrComplex = expectedPoints.length >= 4

  // If start is close (< 30) and direction is forward (cos > 0), accept with generous handwriting tolerance
  if (distToExpectedStart <= 30 && (distToEnd <= 45 || isLoopOrComplex || userLen >= expVecLen * 0.45)) {
    return {
      isMatch: true,
      feedbackType: 'correct',
      message: `Great! Stroke ${expectedStrokeIndex + 1} completed.`,
    }
  }

  return {
    isMatch: true,
    feedbackType: 'correct',
    message: `Nice! Stroke ${expectedStrokeIndex + 1} matched.`,
  }
}
