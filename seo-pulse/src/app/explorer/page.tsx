import { useState } from 'react'
import {
  Search,
  Globe,
  TrendingUp,
  Link2,
  Award,
  FileText,
  ExternalLink,
  ArrowUpDown,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

interface DomainOverview {
  traffic: string
  keywords: string
  backlinks: string
  domainRank: number
}

const EMPTY_OVERVIEW: DomainOverview = {
  traffic: '--',
  keywords: '--',
  backlinks: '--',
  domainRank: 0,
}

const OVERVIEW_CARDS = [
  { key: 'traffic' as const, label: 'Organic Traffic', icon: TrendingUp, color: 'text-success' },
  { key: 'keywords' as const, label: 'Ranking Keywords', icon: Search, color: 'text-primary' },
  { key: 'backlinks' as const, label: 'Backlinks', icon: Link2, color: 'text-warning' },
  { key: 'domainRank' as const, label: 'Domain Rank', icon: Award, color: 'text-[#8b5cf6]' },
]

export function ExplorerPage() {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [overview] = useState<DomainOverview>(EMPTY_OVERVIEW)
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    // Simulate loading
    setTimeout(() => setLoading(false), 1500)
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="gap-2 shrink-0">
              <Search className="h-4 w-4" />
              Analyze
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Domain Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OVERVIEW_CARDS.map((item) => (
          <Card key={item.key}>
            <CardContent className="p-5">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-28" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {searched ? overview[item.key] : '--'}
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
      {!searched ? (
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
                  <CardDescription>Pages driving the most organic traffic</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  Top pages data will appear here once analysis is complete
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyword Distribution Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keyword Distribution</CardTitle>
              <CardDescription>Keyword rankings by SERP position</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Keyword distribution chart will render here
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Domain Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compare Domains</CardTitle>
          <CardDescription>Analyze two domains side by side to find strengths and gaps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
            <Button className="gap-2 shrink-0" disabled={!compareA || !compareB}>
              <ExternalLink className="h-4 w-4" />
              Compare
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
