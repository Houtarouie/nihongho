'use client'

import { useEffect, useRef } from 'react'
import { recordActiveStudySeconds } from '@/data/srs-deck'

/**
 * Automatically tracks genuine active study time while learner is using the app.
 * Pauses if user is idle for more than 60 seconds or tab is hidden.
 * Periodically flushes elapsed time to UserStudyStats.
 */
export function StudyTimeTracker() {
  const lastActiveRef = useRef<number>(Date.now())
  const bufferRef = useRef<number>(0)

  useEffect(() => {
    function markActive() {
      lastActiveRef.current = Date.now()
    }

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }))

    const interval = setInterval(() => {
      // If user interacted within the last 60 seconds and document is visible
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastActiveRef.current < 60000
      ) {
        bufferRef.current += 1

        // Commit every 15 active seconds
        if (bufferRef.current >= 15) {
          recordActiveStudySeconds(bufferRef.current)
          bufferRef.current = 0
        }
      }
    }, 1000)

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden' && bufferRef.current > 0) {
        recordActiveStudySeconds(bufferRef.current)
        bufferRef.current = 0
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      events.forEach((ev) => window.removeEventListener(ev, markActive))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (bufferRef.current > 0) {
        recordActiveStudySeconds(bufferRef.current)
        bufferRef.current = 0
      }
    }
  }, [])

  return null
}
