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
  ChevronDown,
  ChevronRight,
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
  {
    keyword: 'technical seo audit checklist',
    volume: 9800,
    difficulty: 34,
    cpc: 3.90,
    intent: 'Informational',
    trend: [42, 45, 48, 50, 52, 55, 58, 60, 63, 65, 68, 72],
    serpFeatures: ['Featured Snippet', 'PAA'],
  },
  {
    keyword: 'ahrefs vs semrush',
    volume: 27400,
    difficulty: 62,
    cpc: 14.20,
    intent: 'Commercial',
    trend: [70, 72, 68, 75, 78, 80, 82, 85, 88, 90, 92, 95],
    serpFeatures: ['Featured Snippet', 'PAA', 'Video'],
  },
  {
    keyword: 'buy backlinks safely',
    volume: 4100,
    difficulty: 45,
    cpc: 22.50,
    intent: 'Transactional',
    trend: [35, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58],
    serpFeatures: ['PAA'],
  },
  {
    keyword: 'google algorithm update 2026',
    volume: 110000,
    difficulty: 78,
    cpc: 1.80,
    intent: 'Informational',
    trend: [15, 18, 22, 85, 95, 80, 60, 45, 38, 32, 28, 25],
    serpFeatures: ['Featured Snippet', 'Video', 'PAA', 'Image Pack'],
  },
  {
    keyword: 'ai content writing tool',
    volume: 44200,
    difficulty: 68,
    cpc: 11.30,
    intent: 'Commercial',
    trend: [25, 30, 38, 45, 55, 62, 70, 78, 82, 88, 92, 96],
    serpFeatures: ['Shopping', 'Sitelinks', 'PAA'],
  },
  {
    keyword: 'internal linking strategy',
    volume: 7300,
    difficulty: 26,
    cpc: 4.10,
    intent: 'Informational',
    trend: [38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 62, 65],
    serpFeatures: ['Featured Snippet', 'PAA'],
  },
  {
    keyword: 'ecommerce seo services',
    volume: 2900,
    difficulty: 52,
    cpc: 45.00,
    intent: 'Transactional',
    trend: [40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62],
    serpFeatures: ['Local Pack', 'Shopping'],
  },
  {
    keyword: 'broken link building',
    volume: 3800,
    difficulty: 41,
    cpc: 5.60,
    intent: 'Informational',
    trend: [50, 48, 52, 50, 54, 52, 56, 54, 58, 56, 60, 58],
    serpFeatures: ['PAA', 'Video'],
  },
  {
    keyword: 'seo competitor analysis tool',
    volume: 8200,
    difficulty: 58,
    cpc: 9.80,
    intent: 'Commercial',
    trend: [32, 35, 38, 42, 45, 48, 52, 55, 58, 62, 65, 70],
    serpFeatures: ['Shopping', 'Sitelinks'],
  },
  {
    keyword: 'how to get featured snippets',
    volume: 6100,
    difficulty: 33,
    cpc: 2.70,
    intent: 'Informational',
    trend: [45, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 74],
    serpFeatures: ['Featured Snippet', 'PAA', 'Video'],
  },
]

const RELATED_KEYWORDS = [
  { keyword: 'seo software comparison', volume: 5400, difficulty: 48, cpc: 8.90, intent: 'Commercial' },
  { keyword: 'search engine optimization tools', volume: 14200, difficulty: 55, cpc: 6.40, intent: 'Commercial' },
  { keyword: 'free seo analysis', volume: 28700, difficulty: 42, cpc: 3.20, intent: 'Navigational' },
  { keyword: 'website ranking checker', volume: 19500, difficulty: 39, cpc: 4.70, intent: 'Navigational' },
  { keyword: 'organic traffic growth strategies', volume: 3100, difficulty: 24, cpc: 5.30, intent: 'Informational' },
  { keyword: 'google ranking factors 2026', volume: 22100, difficulty: 65, cpc: 2.10, intent: 'Informational' },
  { keyword: 'seo audit tool free', volume: 11800, difficulty: 44, cpc: 7.60, intent: 'Navigational' },
  { keyword: 'page speed insights alternative', volume: 4600, difficulty: 31, cpc: 3.80, intent: 'Commercial' },
]

const PAA_QUESTIONS = [
  { question: 'What are the best free SEO tools in 2026?', volume: 8900, difficulty: 38 },
  { question: 'How long does it take for SEO to work?', volume: 15200, difficulty: 28 },
  { question: 'Is AI content bad for SEO?', volume: 22400, difficulty: 45 },
  { question: 'How do I check my website SEO score?', volume: 18700, difficulty: 22 },
  { question: 'What is the difference between on-page and off-page SEO?', volume: 11300, difficulty: 18 },
  { question: 'How many backlinks do I need to rank on Google?', volume: 7800, difficulty: 35 },
  { question: 'Does keyword difficulty matter for new websites?', volume: 3400, difficulty: 20 },
  { question: 'What is topical authority and how do you build it?', volume: 5600, difficulty: 32 },
]

const KEYWORD_CLUSTERS = [
  {
    name: 'SEO Tools & Software',
    keywords: ['best seo tools 2026', 'keyword research tool', 'rank tracking software', 'backlink checker free', 'seo competitor analysis tool', 'ahrefs vs semrush'],
    totalVolume: 97800,
    avgDifficulty: 56,
  },
  {
    name: 'Technical SEO',
    keywords: ['how to improve site speed', 'google search console setup', 'technical seo audit checklist', 'internal linking strategy', 'how to get featured snippets'],
    totalVolume: 44500,
    avgDifficulty: 29,
  },
  {
    name: 'Link Building & Authority',
    keywords: ['what is domain authority', 'buy backlinks safely', 'broken link building', 'local seo strategy'],
    totalVolume: 26100,
    avgDifficulty: 40,
  },
]

export function KeywordsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [intentFilter, setIntentFilter] = useState('')
  const [expandedCluster, setExpandedCluster] = useState<string | null>('SEO Tools & Software')

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
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Keyword</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">CPC</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Intent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {RELATED_KEYWORDS.map((kw) => {
                      const diff = getDifficultyBadge(kw.difficulty)
                      return (
                        <tr key={kw.keyword} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm tabular-nums text-foreground">{kw.volume.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${kw.difficulty <= 30 ? 'bg-success' : kw.difficulty <= 60 ? 'bg-warning' : 'bg-danger'}`}
                                  style={{ width: `${kw.difficulty}%` }}
                                />
                              </div>
                              <Badge variant={diff.variant} className="text-[10px] px-1.5">{diff.label}</Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm tabular-nums text-foreground">${kw.cpc.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="text-[10px]">{kw.intent}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
              <div className="space-y-3">
                {PAA_QUESTIONS.map((item) => {
                  const diff = getDifficultyBadge(item.difficulty)
                  return (
                    <div key={item.question} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.question}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{item.volume.toLocaleString()} vol</span>
                            <Badge variant={diff.variant} className="text-[10px] px-1.5">{diff.label}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
              <div className="space-y-3">
                {KEYWORD_CLUSTERS.map((cluster) => {
                  const isExpanded = expandedCluster === cluster.name
                  const diff = getDifficultyBadge(cluster.avgDifficulty)
                  return (
                    <div key={cluster.name} className="rounded-lg border border-border overflow-hidden">
                      <button
                        className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setExpandedCluster(isExpanded ? null : cluster.name)}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-foreground">{cluster.name}</p>
                            <p className="text-xs text-muted-foreground">{cluster.keywords.length} keywords</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium tabular-nums text-foreground">{cluster.totalVolume.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">total volume</p>
                          </div>
                          <Badge variant={diff.variant} className="text-[10px] px-1.5">
                            Avg. {diff.label}
                          </Badge>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/30 px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {cluster.keywords.map((kw) => (
                              <Badge key={kw} variant="outline" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
