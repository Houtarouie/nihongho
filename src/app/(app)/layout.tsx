import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/20 md:flex-row">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="h-full w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
