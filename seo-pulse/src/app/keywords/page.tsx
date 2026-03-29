import { useState } from 'react'
import {
  Search,
  Filter,
  SlidersHorizontal,
  MessageSquare,
  Layers,
  Lightbulb,
  Link2,
  Star,
  Image,
  Video,
  ShoppingCart,
  Map,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sparkline } from '@/components/charts/sparkline'

// SERP feature icons
const SERP_ICONS: Record<string, typeof Star> = {
  'Featured Snippet': Star,
  'Image Pack': Image,
  'Video': Video,
  'Shopping': ShoppingCart,
  'Local Pack': Map,
  'Sitelinks': Link2,
  'PAA': MessageSquare,
}

function getDifficultyBadge(difficulty: number) {
  if (difficulty <= 30) return { label: 'Easy', variant: 'success' as const }
  if (difficulty <= 60) return { label: 'Medium', variant: 'warning' as const }
  return { label: 'Hard', variant: 'danger' as const }
}

const DEMO_KEYWORDS = [
  {
    keyword: 'best seo tools 2026',
    volume: 18100,
    difficulty: 42,
    cpc: 4.80,
    intent: 'Commercial',
    trend: [30, 35, 42, 40, 55, 60, 58, 65, 72, 80, 85, 90],
    serpFeatures: ['Featured Snippet', 'PAA', 'Sitelinks'],
  },
  {
    keyword: 'how to improve site speed',
    volume: 12400,
    difficulty: 28,
    cpc: 2.30,
    intent: 'Informational',
    trend: [50, 48, 52, 55, 60, 58, 62, 65, 60, 63, 68, 70],
    serpFeatures: ['Featured Snippet', 'Video', 'PAA'],
  },
  {
    keyword: 'keyword research tool',
    volume: 33100,
    difficulty: 71,
    cpc: 8.50,
    intent: 'Commercial',
    trend: [60, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85, 88],
    serpFeatures: ['Shopping', 'Sitelinks'],
  },
  {
    keyword: 'google search console setup',
    volume: 8900,
    difficulty: 22,
    cpc: 1.60,
    intent: 'Informational',
    trend: [40, 42, 38, 45, 50, 48, 52, 55, 58, 60, 62, 65],
    serpFeatures: ['Featured Snippet', 'Video'],
  },
  {
    keyword: 'rank tracking software',
    volume: 6600,
    difficulty: 55,
    cpc: 12.40,
    intent: 'Commercial',
    trend: [20, 25, 30, 28, 35, 40, 42, 48, 55, 60, 65, 72],
    serpFeatures: ['Shopping', 'PAA'],
  },
  {
    keyword: 'what is domain authority',
    volume: 14800,
    difficulty: 35,
    cpc: 3.20,
    intent: 'Informational',
    trend: [55, 58, 60, 55, 58, 62, 60, 65, 68, 70, 72, 75],
    serpFeatures: ['Featured Snippet', 'PAA', 'Image Pack'],
  },
  {
    keyword: 'backlink checker free',
    volume: 22500,
    difficulty: 48,
    cpc: 5.90,
    intent: 'Navigational',
    trend: [45, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 75],
    serpFeatures: ['Sitelinks'],
  },
  {
    keyword: 'local seo strategy',
    volume: 5400,
    difficulty: 38,
    cpc: 6.70,
    intent: 'Informational',
    trend: [30, 32, 35, 38, 40, 42, 45, 48, 50, 55, 60, 68],
    serpFeatures: ['Local Pack', 'PAA', 'Video'],
  },
  {
    keyword: 'content optimization ai',
    volume: 3200,
    difficulty: 19,
    cpc: 7.80,
    intent: 'Commercial',
    trend: [10, 15, 20, 28, 35, 45, 55, 60, 68, 75, 82, 90],
    serpFeatures: ['Featured Snippet'],
  },
  {
    keyword: 'serp feature tracking',
    volume: 1900,
    difficulty: 31,
    cpc: 9.10,
    intent: 'Commercial',
    trend: [8, 12, 15, 18, 22, 28, 32, 38, 42, 50, 58, 65],
    serpFeatures: ['PAA'],
  },
]

export function KeywordsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [intentFilter, setIntentFilter] = useState('')

  const filtered = DEMO_KEYWORDS.filter((kw) => {
    if (searchQuery && !kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (difficultyFilter === 'easy' && kw.difficulty > 30) return false
    if (difficultyFilter === 'medium' && (kw.difficulty <= 30 || kw.difficulty > 60)) return false
    if (difficultyFilter === 'hard' && kw.difficulty <= 60) return false
    if (intentFilter && kw.intent.toLowerCase() !== intentFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Keyword Research</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover high-value keywords and analyze search intent, difficulty, and trends
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Discover keywords..."
                className="pl-10 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="lg" className="gap-2 shrink-0">
              <Search className="h-4 w-4" />
              Research
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters:
        </div>
        <Select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
          <option value="">All Difficulty</option>
          <option value="easy">Easy (0-30)</option>
          <option value="medium">Medium (31-60)</option>
          <option value="hard">Hard (61+)</option>
        </Select>
        <Select value={intentFilter} onChange={(e) => setIntentFilter(e.target.value)}>
          <option value="">All Intents</option>
          <option value="informational">Informational</option>
          <option value="commercial">Commercial</option>
          <option value="navigational">Navigational</option>
          <option value="transactional">Transactional</option>
        </Select>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          More filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ideas">
        <TabsList>
          <TabsTrigger value="ideas">
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
            Keyword Ideas
          </TabsTrigger>
          <TabsTrigger value="related">
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            Related
          </TabsTrigger>
          <TabsTrigger value="questions">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="clusters">
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Clusters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Keyword
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Volume
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        CPC
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Intent
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Trend
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        SERP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((kw) => {
                      const diff = getDifficultyBadge(kw.difficulty)
                      return (
                        <tr key={kw.keyword} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-foreground">
                              {kw.keyword}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm tabular-nums text-foreground">
                              {kw.volume.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    kw.difficulty <= 30
                                      ? 'bg-success'
                                      : kw.difficulty <= 60
                                        ? 'bg-warning'
                                        : 'bg-danger'
                                  }`}
                                  style={{ width: `${kw.difficulty}%` }}
                                />
                              </div>
                              <Badge variant={diff.variant} className="text-[10px] px-1.5">
                                {diff.label}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm tabular-nums text-foreground">
                              ${kw.cpc.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="text-[10px]">
                              {kw.intent}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <Sparkline data={kw.trend} width={80} height={28} strokeWidth={1.5} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              {kw.serpFeatures.slice(0, 3).map((feat) => {
                                const Icon = SERP_ICONS[feat]
                                return Icon ? (
                                  <div
                                    key={feat}
                                    className="flex h-6 w-6 items-center justify-center rounded bg-muted"
                                    title={feat}
                                  >
                                    <Icon className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                ) : null
                              })}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div className="py-12 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No keywords match your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Link2 className="mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Search for a keyword above to discover semantically related terms
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">People Also Ask</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Discover questions people are asking related to your target keywords
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clusters">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keyword Clusters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Layers className="mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  AI-powered keyword grouping by topic and search intent for content planning
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
