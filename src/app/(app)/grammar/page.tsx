import grammarData from '@/data/grammar.json'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function GrammarPage() {
  // Group grammar by level
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1', 'Non-JLPT', '関西弁']

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Grammar Dictionary</h1>
        <p className="text-muted-foreground">Browse all grammar points from N5 to N1, including Non-JLPT and Kansai-ben.</p>
      </div>

      {levels.map((level) => {
        const points = grammarData.filter(g => g.level === level)
        if (points.length === 0) return null

        return (
          <div key={level} className="space-y-4">
            <div className="sticky top-[60px] md:top-0 bg-background/95 backdrop-blur z-10 py-2 border-b">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                {level}
                <Badge variant="secondary">{points.length} points</Badge>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {points.map((item, index) => (
                <Card key={index} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold">{item.grammar}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-1">{item.meaning}</p>
                    {item.lesson && (
                      <p className="text-xs text-muted-foreground">{item.lesson.split(' – ')[0]}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
