import { PostComposer } from '@/components/social/post-composer'
import { PostCard } from '@/components/social/post-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Mock Data
const MOCK_POSTS = [
  {
    id: '1',
    author: {
      name: 'Kenji',
      username: 'kenjilearns',
      avatar: ''
    },
    content: "Day 14 🇯🇵\nLearned the ヤ・ユ・ヨ row today.\nAlso learned 10 new vocabulary words from the Genki textbook. Getting the hang of it!",
    timeAgo: '2h',
    likes: 14,
    comments: 3,
    jlptLevel: 'N5'
  },
  {
    id: '2',
    author: {
      name: 'Sarah',
      username: 'sarah_tokyo',
      avatar: ''
    },
    content: "Today I finally understood the difference between は and が. The explanation in the new grammar lesson was super helpful. Now I just need to practice it more.",
    timeAgo: '5h',
    likes: 32,
    comments: 8,
    jlptLevel: 'N4'
  }
]

export default function CommunityPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Community</h1>
      
      <Tabs defaultValue="following" className="mb-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>
        
        <TabsContent value="following" className="space-y-4">
          <PostComposer />
          
          <div className="space-y-4">
            {MOCK_POSTS.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="discover">
          <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg border">
            <p>Discover new learners and interesting posts here.</p>
            <p className="text-sm mt-2">Coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
