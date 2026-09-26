import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Flame, MessageSquare, Heart } from 'lucide-react'

import { StudyLogger } from '@/components/study/study-logger'

export default async function DashboardPage() {
  const supabase = createClient()
  
  let user = null
  let profile = null
  
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (user) {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = p
    }
  } catch {
    // Ignore error for Demo Mode
  }

  const displayName = profile?.display_name || profile?.username || 'Kenji (Demo Mode)'
  const currentStreak = profile?.current_streak || 14
  const jlptProgress = 82 // Mocked
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header section */}
      <header className="flex flex-col gap-2 pb-4 border-b">
        <div className="flex items-center gap-2 text-orange-500">
          <Flame className="h-5 w-5 fill-orange-500" />
          <span className="font-bold">{currentStreak} day streak</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Good morning, {displayName}</h1>
      </header>

      {/* Progress & Goals */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between">
              <span>N5 Progress</span>
              <span className="text-muted-foreground font-normal">{jlptProgress}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={jlptProgress} className="h-2" />
          </CardContent>
        </Card>
        
        <StudyLogger />
      </section>

      {/* Continue Learning */}
      <section className="flex flex-col gap-4 mt-2">
        <h2 className="text-xl font-bold">Continue Learning</h2>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-bold text-lg">「〜たい」</h3>
              <p className="text-muted-foreground">Want to do something</p>
            </div>
            <Button>Continue Lesson</Button>
          </CardContent>
        </Card>
      </section>

      {/* Friends Activity */}
      <section className="flex flex-col gap-4 mt-2">
        <h2 className="text-xl font-bold">Friends Activity</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">
                T
              </div>
              <div>
                <p className="font-medium text-sm">Takeshi</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <p className="text-sm">
              Finally understood は vs が today! Thanks to the new grammar lesson.
            </p>
            <div className="flex gap-4 text-muted-foreground">
              <button className="flex items-center gap-1 text-xs hover:text-foreground">
                <Heart className="h-4 w-4" /> 12
              </button>
              <button className="flex items-center gap-1 text-xs hover:text-foreground">
                <MessageSquare className="h-4 w-4" /> 3
              </button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
