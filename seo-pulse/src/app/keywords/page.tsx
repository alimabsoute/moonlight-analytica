import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sparkline } from '@/components/charts/sparkline'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectStore } from '@/stores/project'
import { getDomainKeywords, getKeywordData, type KeywordData } from '@/lib/data-for-seo'

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

function deriveIntent(cpc: number, difficulty: number): string {
  if (cpc > 3) return 'Commercial'
  if (difficulty < 30) return 'Informational'
  return 'Navigational'
}

interface DisplayKeyword {
  keyword: string
  volume: number
  difficulty: number
  cpc: number
  intent: string
  trend: number[]
  serpFeatures: string[]
}

function toDisplayKeyword(kw: KeywordData): DisplayKeyword {
  return {
    keyword: kw.keyword,
    volume: kw.searchVolume,
    difficulty: kw.difficulty,
    cpc: kw.cpc,
    intent: deriveIntent(kw.cpc, kw.difficulty),
    trend: kw.trend,
    serpFeatures: kw.serpFeatures,
  }
}

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

  const activeProject = useProjectStore((s) => s.activeProject)

  const {
    data: rawDomainKeywords = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['domain-keywords', activeProject?.domain],
    queryFn: () => getDomainKeywords(activeProject!.domain, 100),
    enabled: !!activeProject?.domain,
  })

  const { data: rawTrackedKeywords = [] } = useQuery({
    queryKey: ['keyword-metrics', activeProject?.trackedKeywords],
    queryFn: () => getKeywordData(activeProject!.trackedKeywords),
    enabled: (activeProject?.trackedKeywords?.length ?? 0) > 0,
  })

  const domainKeywords: DisplayKeyword[] = rawDomainKeywords.map(toDisplayKeyword)
  const trackedKeywords: DisplayKeyword[] = rawTrackedKeywords.map(toDisplayKeyword)

  const filtered = domainKeywords.filter((kw) => {
    if (searchQuery && !kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (difficultyFilter === 'easy' && kw.difficulty > 30) return false
    if (difficultyFilter === 'medium' && (kw.difficulty <= 30 || kw.difficulty > 60)) return false
    if (difficultyFilter === 'hard' && kw.difficulty <= 60) return false
    if (intentFilter && kw.intent.toLowerCase() !== intentFilter) return false
    return true
  })

  // No project selected state
  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Search className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold text-foreground">No project selected</h2>
        <p className="text-sm text-muted-foreground">Select or create a project to start researching keywords.</p>
        <Button asChild>
          <a href="/onboarding">Go to Onboarding</a>
        </Button>
      </div>
    )
  }

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
          {/* Error alert */}
          {isError && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <p className="flex-1 text-sm text-destructive">
                Failed to load keywords. Check your DataForSEO credentials.
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

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
                    {isLoading
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={7}>
                              <Skeleton className="h-10 w-full" />
                            </td>
                          </tr>
                        ))
                      : filtered.map((kw) => {
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

              {!isLoading && filtered.length === 0 && (
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
              <CardTitle className="text-base">Tracked Keywords</CardTitle>
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
                    {trackedKeywords.map((kw) => {
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

              {trackedKeywords.length === 0 && (
                <div className="py-12 text-center">
                  <Link2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No tracked keywords yet</p>
                </div>
              )}
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
