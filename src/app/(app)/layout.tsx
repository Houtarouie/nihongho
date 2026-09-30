import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { MobileHeader } from '@/components/layout/mobile-header'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20 md:flex-row">
      <MobileHeader />
      <Sidebar />
      <main className="flex-1 pb-24 md:pb-8 min-w-0">
        <div className="h-full w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
