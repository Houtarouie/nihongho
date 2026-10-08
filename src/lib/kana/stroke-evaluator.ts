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
 * Samples points along a cubic Bézier curve segment B(t) for t in [0, 1].
 */
export function sampleCubicBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  steps: number = 8
): Point2D[] {
  const pts: Point2D[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t
    const x =
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x
    const y =
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y
    pts.push({ x, y })
  }
  return pts
}

/**
 * Parses SVG path string `d` into dense anchor points along true Bézier trajectories.
 * Evaluates cubic curves (`c`, `C`, `s`, `S`) with parametric sampling so loops, hooks,
 * and curves are accurately represented.
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
        const p0 = { x: currX, y: currY }
        const p1 = { x: currX + args[i], y: currY + args[i + 1] }
        const p2 = { x: currX + args[i + 2], y: currY + args[i + 3] }
        const p3 = { x: currX + args[i + 4], y: currY + args[i + 5] }
        const sampled = sampleCubicBezier(p0, p1, p2, p3, 8)
        points.push(...sampled.slice(1))
        currX = p3.x
        currY = p3.y
      }
    } else if (type === 'C') {
      for (let i = 0; i < args.length; i += 6) {
        const p0 = { x: currX, y: currY }
        const p1 = { x: args[i], y: args[i + 1] }
        const p2 = { x: args[i + 2], y: args[i + 3] }
        const p3 = { x: args[i + 4], y: args[i + 5] }
        const sampled = sampleCubicBezier(p0, p1, p2, p3, 8)
        points.push(...sampled.slice(1))
        currX = p3.x
        currY = p3.y
      }
    } else if (type === 'l') {
      for (let i = 0; i < args.length; i += 2) {
        currX += args[i]
        currY += args[i + 1]
        points.push({ x: currX, y: currY })
      }
    } else if (type === 'L') {
      for (let i = 0; i < args.length; i += 2) {
        currX = args[i]
        currY = args[i + 1]
        points.push({ x: currX, y: currY })
      }
    } else if (type === 's') {
      for (let i = 0; i < args.length; i += 4) {
        const p0 = { x: currX, y: currY }
        const p1 = { x: currX, y: currY }
        const p2 = { x: currX + args[i], y: currY + args[i + 1] }
        const p3 = { x: currX + args[i + 2], y: currY + args[i + 3] }
        const sampled = sampleCubicBezier(p0, p1, p2, p3, 8)
        points.push(...sampled.slice(1))
        currX = p3.x
        currY = p3.y
      }
    } else if (type === 'S') {
      for (let i = 0; i < args.length; i += 4) {
        const p0 = { x: currX, y: currY }
        const p1 = { x: currX, y: currY }
        const p2 = { x: args[i], y: args[i + 1] }
        const p3 = { x: args[i + 2], y: args[i + 3] }
        const sampled = sampleCubicBezier(p0, p1, p2, p3, 8)
        points.push(...sampled.slice(1))
        currX = p3.x
        currY = p3.y
      }
    }
  }

  return points
}

/**
 * Calculates total path arc length across sampled points.
 */
export function getPointsLength(points: Point2D[]): number {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i])
  }
  return len
}

/**
 * Resamples an array of points into N equidistant points along the arc length.
 */
export function resamplePoints(points: Point2D[], count: number = 32): Point2D[] {
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
 * Returns directional advice for strokes, including Katakana confusables (シ vs ツ, ソ vs ン).
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

interface StrokeComparison {
  index: number
  startDist: number
  endDist: number
  canonLen: number
  lenRatio: number
  fwdTrajErr: number
  maxFwdDev: number
  revTrajErr: number
}

/**
 * Multi-candidate handwriting evaluator.
 * Evaluates the user stroke against all strokes of the kana, enforcing:
 * 1. Strict stroke order (detects if user drew stroke 2 or 3 instead of 1).
 * 2. Proper drawing direction (detects reverse drawing / opposite angle).
 * 3. Exact trajectory shape (rejects zigzags, scribbles, loops where lines shouldn't be).
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

  // 1. Guard against accidental taps / too short input
  const userLen = getPointsLength(userPoints)
  if (userPoints.length < 2 || userLen < 12) {
    return {
      isMatch: false,
      feedbackType: 'too_short',
      message: 'Stroke is too short. Please draw the line across or down.',
    }
  }

  // Resample user drawing to 32 equidistant points along arc length
  const userResampled = resamplePoints(userPoints, 32)
  const userStart = userResampled[0]
  const userEnd = userResampled[31]

  // Precompute metrics for ALL canonical strokes in this character
  const comparisons: StrokeComparison[] = strokeData.strokes.map((pathD, idx) => {
    const rawPts = parsePathPoints(pathD)
    const canonPts = resamplePoints(rawPts, 32)
    const canonLen = getPointsLength(canonPts)

    let fwdSum = 0
    let maxFwd = 0
    let revSum = 0

    for (let i = 0; i < 32; i++) {
      const fwdD = distance(userResampled[i], canonPts[i])
      fwdSum += fwdD
      if (fwdD > maxFwd) maxFwd = fwdD

      const revD = distance(userResampled[31 - i], canonPts[i])
      revSum += revD
    }

    return {
      index: idx,
      startDist: distance(userStart, canonPts[0]),
      endDist: distance(userEnd, canonPts[31]),
      canonLen,
      lenRatio: userLen / Math.max(1, canonLen),
      fwdTrajErr: fwdSum / 32,
      maxFwdDev: maxFwd,
      revTrajErr: revSum / 32,
    }
  })

  const expectedComp = comparisons[expectedStrokeIndex]
  if (!expectedComp) {
    return {
      isMatch: true,
      feedbackType: 'correct',
      message: 'Stroke accepted.',
    }
  }

  // 2. Scribble / Wild Disproportion Check
  // If the user's stroke is excessively long (zigzag, multi-pass scribble) compared to the expected stroke:
  if (expectedComp.lenRatio > 1.9) {
    const matchesOtherLonger = comparisons.some(
      (c) => c.index !== expectedStrokeIndex && c.lenRatio <= 1.6 && c.fwdTrajErr <= 14.0
    )
    if (!matchesOtherLonger) {
      return {
        isMatch: false,
        feedbackType: 'off_target',
        message: 'Stroke didn\'t match. Draw a single clean stroke without zigzags.',
      }
    }
  }

  // 3. Direction Check: Did user draw the expected stroke in REVERSE?
  if (expectedComp.revTrajErr <= 14.0 && expectedComp.fwdTrajErr >= 17.0) {
    const customTip = getDirectionFeedback(kana, expectedStrokeIndex)
    return {
      isMatch: false,
      feedbackType: 'wrong_direction',
      message:
        customTip ||
        `Wrong direction! Draw stroke ${expectedStrokeIndex + 1} in the opposite direction.`,
    }
  }

  // Also check displacement vector cosine angle if stroke has significant length
  const userVecX = userEnd.x - userStart.x
  const userVecY = userEnd.y - userStart.y
  const userVecLen = Math.hypot(userVecX, userVecY)
  if (expectedComp.canonLen > 15 && userVecLen >= 12) {
    const rawExpected = parsePathPoints(strokeData.strokes[expectedStrokeIndex])
    const canonStart = rawExpected[0]
    const canonEnd = rawExpected[rawExpected.length - 1]
    const cVecX = canonEnd.x - canonStart.x
    const cVecY = canonEnd.y - canonStart.y
    const cVecLen = Math.hypot(cVecX, cVecY)

    if (cVecLen > 12) {
      const dot = userVecX * cVecX + userVecY * cVecY
      const cos = dot / (userVecLen * cVecLen)
      if (
        cos < -0.25 &&
        (expectedComp.revTrajErr < expectedComp.fwdTrajErr || expectedComp.startDist <= 25)
      ) {
        const customTip = getDirectionFeedback(kana, expectedStrokeIndex)
        return {
          isMatch: false,
          feedbackType: 'wrong_direction',
          message:
            customTip ||
            `Wrong direction! Draw stroke ${expectedStrokeIndex + 1} in the opposite direction.`,
        }
      }
    }
  }

  // 4. Stroke Order Check: Did user draw another stroke of this character instead?
  const otherMatches = comparisons
    .filter((c) => c.index !== expectedStrokeIndex)
    .filter((c) => {
      const isCleanTraj = c.fwdTrajErr <= 14.5 && c.lenRatio >= 0.5 && c.lenRatio <= 1.7
      const isClearlyCloserThanExpected = c.fwdTrajErr < expectedComp.fwdTrajErr - 4.0
      const isStartCloser = c.startDist <= 20.0 && c.startDist < expectedComp.startDist - 8.0
      return isCleanTraj && (isClearlyCloserThanExpected || isStartCloser)
    })
    .sort((a, b) => a.fwdTrajErr - b.fwdTrajErr)

  if (otherMatches.length > 0) {
    const bestOther = otherMatches[0]
    return {
      isMatch: false,
      feedbackType: 'wrong_order',
      matchedStrokeIndex: bestOther.index,
      message: `Wrong stroke order! That was stroke ${bestOther.index + 1}, but stroke ${
        expectedStrokeIndex + 1
      } comes first. Follow the numbered guide 1 → ${totalStrokes}.`,
    }
  }

  // If user started much closer to another stroke's start point (> 12 units closer):
  for (const c of comparisons) {
    if (c.index === expectedStrokeIndex) continue
    if (c.startDist <= 22.0 && c.startDist < expectedComp.startDist - 12.0) {
      return {
        isMatch: false,
        feedbackType: 'wrong_order',
        matchedStrokeIndex: c.index,
        message: `Wrong stroke order! That was stroke ${c.index + 1}, but stroke ${
          expectedStrokeIndex + 1
        } comes first. Follow the numbered guide 1 → ${totalStrokes}.`,
      }
    }
  }

  // 5. Expected Stroke Verification
  const isTrajGood = expectedComp.fwdTrajErr <= 15.5
  const isStartGood = expectedComp.startDist <= 24.0
  const isLenGood = expectedComp.lenRatio >= 0.45 && expectedComp.lenRatio <= 1.85
  const isMaxDevGood = expectedComp.maxFwdDev <= 32.0

  if (isTrajGood && isStartGood && isLenGood && isMaxDevGood) {
    return {
      isMatch: true,
      feedbackType: 'correct',
      message: `Great! Stroke ${expectedStrokeIndex + 1} completed.`,
    }
  }

  // 6. Specific Off-Target Feedback
  if (!isStartGood) {
    return {
      isMatch: false,
      feedbackType: 'off_target',
      message: `Start stroke ${expectedStrokeIndex + 1} near circle ${expectedStrokeIndex + 1}.`,
    }
  }

  return {
    isMatch: false,
    feedbackType: 'off_target',
    message: `Stroke shape didn't match. Draw stroke ${expectedStrokeIndex + 1} cleanly.`,
  }
}
