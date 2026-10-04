import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/today',
  useSearchParams: () => new URLSearchParams(),
}))

import TodayPage from '@/app/(app)/today/page'
import AppLayout from '@/app/(app)/layout'

describe('TodayPage and AppLayout Render Test', () => {
  it('renders TodayPage inside AppLayout without throwing', () => {
    try {
      const html = renderToString(
        <AppLayout>
          <TodayPage />
        </AppLayout>
      )
      console.log('HTML length:', html.length)
    } catch (e: any) {
      console.error('CAUGHT ERROR:', e.message, e.stack)
      throw e
    }
  })
})
