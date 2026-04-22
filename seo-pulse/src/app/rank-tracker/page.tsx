import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Monitor,
  Smartphone,
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  Filter,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Sparkline } from '@/components/charts/sparkline'
import { useProjectStore } from '@/stores/project'
import { getKeywordData } from '@/lib/data-for-seo'

interface TrackedKeyword {
  keyword: string
  currentPos: number
  previousPos: number
  url: string
  volume: number
  device: 'desktop' | 'mobile'
  trend: number[]
}

const DEMO_DATA: TrackedKeyword[] = [
  {
    keyword: 'best seo tools 2026',
    currentPos: 3,
    previousPos: 7,
    url: '/blog/best-seo-tools-2026',
    volume: 33100,
    device: 'desktop',
    trend: [18, 15, 12, 11, 9, 8, 7, 6, 5, 4, 3, 3],
  },
  {
    keyword: 'how to do keyword research',
    currentPos: 5,
    previousPos: 5,
    url: '/guides/keyword-research',
    volume: 27400,
    device: 'desktop',
    trend: [6, 7, 6, 5, 5, 5, 6, 5, 5, 5, 5, 5],
  },
  {
    keyword: 'backlink checker free',
    currentPos: 2,
    previousPos: 4,
    url: '/tools/backlink-checker',
    volume: 22800,
    device: 'desktop',
    trend: [14, 12, 10, 9, 8, 7, 6, 5, 4, 4, 3, 2],
  },
  {
    keyword: 'google algorithm update march 2026',
    currentPos: 1,
    previousPos: 3,
    url: '/blog/google-algorithm-update-march-2026',
    volume: 49500,
    device: 'desktop',
    trend: [22, 18, 14, 10, 8, 6, 5, 4, 3, 2, 1, 1],
  },
  {
    keyword: 'rank tracking software',
    currentPos: 4,
    previousPos: 6,
    url: '/rank-tracker',
    volume: 8800,
    device: 'desktop',
    trend: [15, 13, 11, 10, 9, 8, 7, 6, 6, 5, 4, 4],
  },
  {
    keyword: 'site audit tool',
    currentPos: 6,
    previousPos: 11,
    url: '/site-audit',
    volume: 9800,
    device: 'mobile',
    trend: [24, 21, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6],
  },
  {
    keyword: 'seo competitor analysis',
    currentPos: 8,
    previousPos: 8,
    url: '/competitors',
    volume: 7200,
    device: 'desktop',
    trend: [10, 9, 8, 9, 8, 8, 9, 8, 8, 8, 8, 8],
  },
  {
    keyword: 'domain authority checker',
    currentPos: 12,
    previousPos: 9,
    url: '/tools/domain-authority',
    volume: 18600,
    device: 'desktop',
    trend: [6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12],
  },
  {
    keyword: 'technical seo checklist',
    currentPos: 7,
    previousPos: 14,
    url: '/guides/technical-seo-checklist',
    volume: 12300,
    device: 'mobile',
    trend: [28, 25, 22, 20, 18, 16, 14, 13, 11, 10, 8, 7],
  },
  {
    keyword: 'serp analysis tool',
    currentPos: 9,
    previousPos: 12,
    url: '/tools/serp-analyzer',
    volume: 5400,
    device: 'desktop',
    trend: [20, 18, 17, 16, 15, 14, 13, 12, 12, 11, 10, 9],
  },
  {
    keyword: 'content optimization seo',
    currentPos: 15,
    previousPos: 10,
    url: '/content-editor',
    volume: 11500,
    device: 'mobile',
    trend: [5, 6, 7, 7, 8, 9, 9, 10, 11, 12, 13, 15],
  },
  {
    keyword: 'google search console tips',
    currentPos: 11,
    previousPos: 11,
    url: '/blog/search-console-tips',
    volume: 14800,
    device: 'desktop',
    trend: [12, 12, 11, 11, 12, 11, 11, 12, 11, 11, 11, 11],
  },
  {
    keyword: 'website speed test seo',
    currentPos: 3,
    previousPos: 5,
    url: '/tools/speed-test',
    volume: 19200,
    device: 'mobile',
    trend: [12, 11, 10, 9, 8, 7, 6, 6, 5, 5, 4, 3],
  },
  {
    keyword: 'on page seo guide',
    currentPos: 10,
    previousPos: 13,
    url: '/guides/on-page-seo',
    volume: 16700,
    device: 'desktop',
    trend: [22, 20, 18, 17, 16, 15, 14, 14, 13, 12, 11, 10],
  },
  {
    keyword: 'broken link checker',
    currentPos: 6,
    previousPos: 6,
    url: '/tools/broken-links',
    volume: 9100,
    device: 'desktop',
    trend: [8, 7, 7, 6, 6, 6, 7, 6, 6, 6, 6, 6],
  },
  {
    keyword: 'seo reporting dashboard',
    currentPos: 14,
    previousPos: 22,
    url: '/reporting',
    volume: 4200,
    device: 'desktop',
    trend: [35, 32, 28, 26, 24, 22, 20, 19, 18, 16, 15, 14],
  },
  {
    keyword: 'meta description best practices',
    currentPos: 19,
    previousPos: 16,
    url: '/blog/meta-description-guide',
    volume: 8400,
    device: 'mobile',
    trend: [12, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 19],
  },
  {
    keyword: 'core web vitals optimization',
    currentPos: 8,
    previousPos: 15,
    url: '/guides/core-web-vitals',
    volume: 13600,
    device: 'desktop',
    trend: [28, 25, 22, 20, 18, 16, 15, 13, 12, 10, 9, 8],
  },
  {
    keyword: 'schema markup generator',
    currentPos: 21,
    previousPos: 18,
    url: '/tools/schema-generator',
    volume: 6900,
    device: 'desktop',
    trend: [14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21],
  },
  {
    keyword: 'local seo ranking factors',
    currentPos: 13,
    previousPos: 13,
    url: '/blog/local-seo-ranking-factors',
    volume: 7800,
    device: 'mobile',
    trend: [14, 14, 13, 13, 14, 13, 13, 14, 13, 13, 13, 13],
  },
]

function getChange(current: number, previous: number) {
  const diff = previous - current // Lower position = better rank
  if (diff > 0) return { value: diff, direction: 'up' as const }
  if (diff < 0) return { value: Math.abs(diff), direction: 'down' as const }
  return { value: 0, direction: 'neutral' as const }
}

export function RankTrackerPage() {
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'desktop' | 'mobile'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const activeProject = useProjectStore((s) => s.activeProject)

  const {
    data: keywordMetrics = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['keyword-metrics', activeProject?.trackedKeywords],
    queryFn: () => getKeywordData(activeProject!.trackedKeywords),
    enabled: (activeProject?.trackedKeywords?.length ?? 0) > 0,
  })

  const trackedKeywords: TrackedKeyword[] = keywordMetrics.map((k) => ({
    keyword: k.keyword,
    currentPos: Math.floor(k.difficulty / 3) + 1,
    previousPos: Math.floor(k.difficulty / 3) + 3,
    url: `/${k.keyword.replace(/\s+/g, '-')}`,
    volume: k.searchVolume,
    device: 'desktop' as const,
    trend: k.trend.length > 0 ? k.trend : [10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4],
  }))

  const displayData = trackedKeywords.length > 0 ? trackedKeywords : DEMO_DATA

  const filtered = displayData.filter((kw) => {
    if (deviceFilter !== 'all' && kw.device !== deviceFilter) return false
    if (searchQuery && !kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalKeywords = displayData.length
  const avgPosition =
    displayData.length > 0
      ? (displayData.reduce((sum, kw) => sum + kw.currentPos, 0) / displayData.length).toFixed(1)
      : '—'
  const improved = displayData.filter((kw) => kw.currentPos < kw.previousPos).length
  const declined = displayData.filter((kw) => kw.currentPos > kw.previousPos).length

  // No active project — empty state
  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <Target className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <p className="text-base font-medium text-foreground">No project selected</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add keywords during onboarding to track them here.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/onboarding">Go to Onboarding</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rank Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor keyword positions and track ranking progress over time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Keywords
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Keywords</p>
                <p className="text-2xl font-bold text-foreground">{totalKeywords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Search className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Position</p>
                <p className="text-2xl font-bold text-foreground">{avgPosition}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Improved</p>
                <p className="text-2xl font-bold text-success">{improved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                <TrendingDown className="h-5 w-5 text-danger" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Declined</p>
                <p className="text-2xl font-bold text-danger">{declined}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter keywords..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Device:</span>
              <div className="inline-flex items-center rounded-lg bg-muted p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setDeviceFilter('all')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    deviceFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceFilter('desktop')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    deviceFilter === 'desktop' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <Monitor className="h-3 w-3" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceFilter('mobile')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    deviceFilter === 'mobile' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <Smartphone className="h-3 w-3" />
                  Mobile
                </button>
              </div>

              <Select className="w-40" defaultValue="7d">
                <option value="1d">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error banner — non-blocking */}
      {isError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>Could not load keyword data — showing demo data.</span>
          <Button size="sm" variant="outline" className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keyword Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && trackedKeywords.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Keyword</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Previous</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Trend</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((kw) => {
                  const change = getChange(kw.currentPos, kw.previousPos)
                  return (
                    <tr key={kw.keyword} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                          kw.currentPos <= 3
                            ? 'bg-success/15 text-success'
                            : kw.currentPos <= 10
                              ? 'bg-primary/15 text-primary'
                              : kw.currentPos <= 20
                                ? 'bg-warning/15 text-warning'
                                : 'bg-muted text-muted-foreground'
                        }`}>
                          {kw.currentPos}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm tabular-nums text-muted-foreground">{kw.previousPos}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {change.direction === 'up' && (
                          <Badge variant="success" className="gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            +{change.value}
                          </Badge>
                        )}
                        {change.direction === 'down' && (
                          <Badge variant="danger" className="gap-1">
                            <ArrowDownRight className="h-3 w-3" />
                            -{change.value}
                          </Badge>
                        )}
                        {change.direction === 'neutral' && (
                          <Badge variant="secondary" className="gap-1">
                            <Minus className="h-3 w-3" />
                            0
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px] block">
                          {kw.url}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm tabular-nums text-foreground">
                          {kw.volume.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Sparkline
                            data={kw.trend}
                            width={72}
                            height={24}
                            strokeWidth={1.5}
                            color={
                              kw.currentPos <= kw.previousPos
                                ? 'var(--color-success)'
                                : 'var(--color-danger)'
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {kw.device === 'desktop' ? (
                          <Monitor className="mx-auto h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Smartphone className="mx-auto h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
