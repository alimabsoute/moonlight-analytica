import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Globe,
  TrendingUp,
  Link2,
  Award,
  ExternalLink,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { BarChartWidget } from '@/components/charts/bar-chart'
import { useProjectStore } from '@/stores/project'
import { getDomainOverview } from '@/lib/data-for-seo'

const OVERVIEW_CARDS = [
  { key: 'organicTraffic' as const, label: 'Organic Traffic', icon: TrendingUp, color: 'text-success' },
  { key: 'organicKeywords' as const, label: 'Ranking Keywords', icon: Search, color: 'text-primary' },
  { key: 'backlinks' as const, label: 'Backlinks', icon: Link2, color: 'text-warning' },
  { key: 'domainRank' as const, label: 'Domain Rank', icon: Award, color: 'text-[#8b5cf6]' },
]

const topPages = [
  { url: '/blog/seo/keyword-research', title: 'Keyword Research: The Definitive Guide', traffic: '312K', keywords: 4820, avgPosition: 3.1 },
  { url: '/blog/seo/backlinks', title: 'Backlinks: Everything You Need to Know', traffic: '287K', keywords: 3940, avgPosition: 4.2 },
  { url: '/seo/keyword-difficulty', title: 'Keyword Difficulty: How to Estimate It', traffic: '198K', keywords: 2650, avgPosition: 5.8 },
  { url: '/blog/seo/on-page-seo', title: 'On-Page SEO: The Complete Guide', traffic: '176K', keywords: 3210, avgPosition: 4.6 },
  { url: '/seo/what-are-backlinks', title: 'What Are Backlinks? And How to Build Them', traffic: '154K', keywords: 2180, avgPosition: 6.3 },
  { url: '/blog/seo/technical-seo', title: 'Technical SEO: The Beginner\'s Guide', traffic: '142K', keywords: 1890, avgPosition: 7.1 },
  { url: '/blog/content/content-marketing', title: 'Content Marketing Strategy Guide', traffic: '128K', keywords: 1540, avgPosition: 8.4 },
  { url: '/seo/competitor-analysis', title: 'Competitor Analysis: A Step-by-Step Guide', traffic: '115K', keywords: 1320, avgPosition: 5.9 },
]

const keywordDistribution = [
  { position: '1-3', count: 42800 },
  { position: '4-10', count: 128500 },
  { position: '11-20', count: 198200 },
  { position: '21-50', count: 284600 },
  { position: '50+', count: 237900 },
]

const comparisonData = {
  ahrefs: { domain: 'ahrefs.com', traffic: '2.4M', keywords: '892K', backlinks: '145M', domainRank: 91, topCountry: 'US (38%)', topKeyword: 'backlink checker' },
  semrush: { domain: 'semrush.com', traffic: '3.1M', keywords: '1.2M', backlinks: '198M', domainRank: 93, topCountry: 'US (34%)', topKeyword: 'keyword research tool' },
}

export function ExplorerPage() {
  const activeProject = useProjectStore((s) => s.activeProject)

  const [searchDomain, setSearchDomain] = useState(activeProject?.domain ?? '')
  const [queriedDomain, setQueriedDomain] = useState(activeProject?.domain ?? '')

  const [compareA, setCompareA] = useState('ahrefs.com')
  const [compareB, setCompareB] = useState('semrush.com')
  const [showComparison, setShowComparison] = useState(true)

  const {
    data: overview,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['domain-overview', queriedDomain],
    queryFn: () => getDomainOverview(queriedDomain),
    enabled: !!queriedDomain,
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchDomain.trim()) return
    setQueriedDomain(searchDomain.trim())
  }

  function handleCompare(e: React.FormEvent) {
    e.preventDefault()
    setShowComparison(true)
  }

  const kpiValue = (key: typeof OVERVIEW_CARDS[number]['key']): string => {
    if (!overview) return '—'
    const val = overview[key]
    return typeof val === 'number' ? val.toLocaleString() : String(val)
  }

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Globe className="mb-4 h-10 w-10 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No project selected</h2>
        <p className="text-sm text-muted-foreground">
          No project selected — head to Settings to create one.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze any domain's organic traffic, keywords, and backlink profile
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter any domain to analyze (e.g. example.com)"
                className="pl-10 h-11 text-base"
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="gap-2 shrink-0" disabled={isLoading}>
              <Search className="h-4 w-4" />
              Analyze
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error alert */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not load data for this domain.
        </div>
      )}

      {/* Domain Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OVERVIEW_CARDS.map((item) => (
          <Card key={item.key}>
            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {queriedDomain ? kpiValue(item.key) : '--'}
                    </p>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      {!queriedDomain ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Enter a domain to see results</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Search for any domain to view its organic traffic, top-ranking pages,
              keyword distribution, and backlink profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top Pages Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Top Pages</CardTitle>
                  <CardDescription>Pages driving the most organic traffic for {queriedDomain}</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Page</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Traffic</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Keywords</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {topPages.map((page) => (
                        <tr key={page.url} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-foreground">{page.title}</p>
                            <p className="text-xs text-muted-foreground">{page.url}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm tabular-nums font-medium text-foreground">{page.traffic}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm tabular-nums text-foreground">{page.keywords.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={page.avgPosition <= 5 ? 'success' : page.avgPosition <= 10 ? 'warning' : 'outline'}>
                              {page.avgPosition.toFixed(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyword Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keyword Distribution</CardTitle>
              <CardDescription>Keyword rankings by SERP position</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <BarChartWidget
                  data={keywordDistribution}
                  dataKey="count"
                  xAxisKey="position"
                  height={260}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competitor Quick-Compare */}
      {activeProject?.competitors && activeProject.competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Competitors</CardTitle>
            <CardDescription>Quickly analyze a competitor domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeProject.competitors.map((competitor) => (
                <Button
                  key={competitor}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setSearchDomain(competitor)
                    setQueriedDomain(competitor)
                  }}
                >
                  <Globe className="h-3.5 w-3.5" />
                  {competitor}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Domain Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare Domains</CardTitle>
          <CardDescription>Analyze two domains side by side to find strengths and gaps</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCompare} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Domain A</label>
              <Input
                type="text"
                placeholder="yoursite.com"
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
              />
            </div>
            <div className="hidden sm:flex items-center justify-center pb-1">
              <Badge variant="outline" className="px-3 py-1">vs</Badge>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Domain B</label>
              <Input
                type="text"
                placeholder="competitor.com"
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
              />
            </div>
            <Button type="submit" className="gap-2 shrink-0" disabled={!compareA || !compareB}>
              <ExternalLink className="h-4 w-4" />
              Compare
            </Button>
          </form>

          {/* Comparison Results */}
          {showComparison && (
            <div className="mt-6">
              <Separator className="mb-6" />
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Domain A */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-foreground">{comparisonData.ahrefs.domain}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Traffic</span><span className="font-medium text-foreground">{comparisonData.ahrefs.traffic}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Keywords</span><span className="font-medium text-foreground">{comparisonData.ahrefs.keywords}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Backlinks</span><span className="font-medium text-foreground">{comparisonData.ahrefs.backlinks}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Domain Rank</span><Badge variant="success">{comparisonData.ahrefs.domainRank}</Badge></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Top Country</span><span className="font-medium text-foreground">{comparisonData.ahrefs.topCountry}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Top Keyword</span><span className="font-medium text-foreground">{comparisonData.ahrefs.topKeyword}</span></div>
                    </div>
                  </CardContent>
                </Card>
                {/* Domain B */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="h-4 w-4 text-[#8b5cf6]" />
                      <span className="text-sm font-bold text-foreground">{comparisonData.semrush.domain}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Traffic</span><span className="font-medium text-foreground">{comparisonData.semrush.traffic}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Keywords</span><span className="font-medium text-foreground">{comparisonData.semrush.keywords}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Backlinks</span><span className="font-medium text-foreground">{comparisonData.semrush.backlinks}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Domain Rank</span><Badge variant="success">{comparisonData.semrush.domainRank}</Badge></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Top Country</span><span className="font-medium text-foreground">{comparisonData.semrush.topCountry}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Top Keyword</span><span className="font-medium text-foreground">{comparisonData.semrush.topKeyword}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
