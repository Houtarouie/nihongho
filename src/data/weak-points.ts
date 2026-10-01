export interface WeakPointItem {
  id: string
  type: 'kana' | 'vocab' | 'grammar' | 'kanji'
  front: string
  reading: string
  meaning: string
  notes?: string
  lookAlikes?: string[]
  missCount: number
  lastMissed: number
}

const WEAK_POINTS_STORAGE_KEY = 'nihongo_weak_points_v1'

export function loadWeakPoints(): WeakPointItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(WEAK_POINTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

export function saveWeakPoints(list: WeakPointItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(WEAK_POINTS_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new Event('nihongo-weak-points-updated'))
  } catch {
    // ignore
  }
}

export function addWeakPoint(
  item: Omit<WeakPointItem, 'missCount' | 'lastMissed'>
): WeakPointItem {
  const list = loadWeakPoints()
  const existingIdx = list.findIndex((w) => w.id === item.id || w.front === item.front)
  const now = Date.now()

  if (existingIdx >= 0) {
    list[existingIdx] = {
      ...list[existingIdx],
      ...item,
      missCount: (list[existingIdx].missCount || 1) + 1,
      lastMissed: now,
    }
    saveWeakPoints(list)
    return list[existingIdx]
  }

  const created: WeakPointItem = {
    ...item,
    missCount: 1,
    lastMissed: now,
  }
  list.unshift(created)
  saveWeakPoints(list)
  return created
}

export function removeWeakPoint(idOrFront: string) {
  const list = loadWeakPoints()
  const filtered = list.filter((w) => w.id !== idOrFront && w.front !== idOrFront)
  saveWeakPoints(filtered)
}

export function isWeakPoint(idOrFront: string): boolean {
  const list = loadWeakPoints()
  return list.some((w) => w.id === idOrFront || w.front === idOrFront)
}

export function clearWeakPoints() {
  saveWeakPoints([])
}
