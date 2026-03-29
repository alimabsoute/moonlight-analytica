import { useState } from 'react'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Link2,
  Globe,
  Target,
  FileText,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface CompetitorData {
  domain: string
  traffic: number
  trafficDelta: number
  keywords: number
  keywordsDelta: number
  backlinks: number
  backlinksDelta: number
  domainRank: number
}

const YOUR_SITE: CompetitorData = {
  domain: 'yourdomain.com',
  traffic: 124800,
  trafficDelta: 12.3,
  keywords: 908,
  keywordsDelta: 7.5,
  backlinks: 12453,
  backlinksDelta: 4.7,
  domainRank: 52,
}

const COMPETITORS: CompetitorData[] = [
  {
    domain: 'competitor-one.com',
    traffic: 289500,
    trafficDelta: 8.1,
    keywords: 2340,
    keywordsDelta: 5.2,
    backlinks: 34200,
    backlinksDelta: 3.8,
    domainRank: 67,
  },
  {
    domain: 'seo-rival.io',
    traffic: 156200,
    trafficDelta: -2.4,
    keywords: 1120,
    keywordsDelta: -1.8,
    backlinks: 18900,
    backlinksDelta: 6.1,
    domainRank: 58,
  },
  {
    domain: 'search-tool.co',
    traffic: 93400,
    trafficDelta: 15.7,
    keywords: 680,
    keywordsDelta: 12.3,
    backlinks: 8700,
    backlinksDelta: -1.2,
    domainRank: 44,
  },
]

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function CompetitorCard({ data, isYou = false }: { data: CompetitorData; isYou?: boolean }) {
  return (
    <Card className={isYou ? 'border-primary/30 bg-primary/[0.02]' : ''}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isYou ? 'bg-primary/15' : 'bg-muted'
          }`}>
            <Globe className={`h-5 w-5 ${isYou ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{data.domain}</p>
            {isYou && <Badge variant="default" className="text-[10px] mt-0.5">Your site</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Traffic</p>
            <p className="text-lg font-bold text-foreground">{formatCompact(data.traffic)}</p>
            <DeltaBadge value={data.trafficDelta} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Keywords</p>
            <p className="text-lg font-bold text-foreground">{formatCompact(data.keywords)}</p>
            <DeltaBadge value={data.keywordsDelta} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Backlinks</p>
            <p className="text-lg font-bold text-foreground">{formatCompact(data.backlinks)}</p>
            <DeltaBadge value={data.backlinksDelta} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Domain Rank</p>
            <p className="text-lg font-bold text-foreground">{data.domainRank}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DeltaBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-success">
        <ArrowUpRight className="h-3 w-3" />
        +{value.toFixed(1)}%
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-danger">
        <ArrowDownRight className="h-3 w-3" />
        {value.toFixed(1)}%
      </span>
    )
  }
  return <span className="text-xs text-muted-foreground">0%</span>
}

export function CompetitorsPage() {
  const [newDomain, setNewDomain] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Competitors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor competitor performance and identify strategic opportunities
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Competitor
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Competitor</DialogTitle>
              <DialogDescription>
                Enter a competitor domain to start tracking their SEO performance against yours.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                type="text"
                placeholder="competitor.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { console.log('Add competitor:', newDomain); setDialogOpen(false) }}>
                Add Competitor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Competitor Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CompetitorCard data={YOUR_SITE} isYou />
        {COMPETITORS.map((comp) => (
          <CompetitorCard key={comp.domain} data={comp} />
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="keyword-gap">
            <Target className="mr-1.5 h-3.5 w-3.5" />
            Keyword Gap
          </TabsTrigger>
          <TabsTrigger value="backlink-gap">
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            Backlink Gap
          </TabsTrigger>
          <TabsTrigger value="content-gap">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Content Gap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Competitive Landscape</CardTitle>
              <CardDescription>
                Traffic and keyword comparison across all tracked competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[YOUR_SITE, ...COMPETITORS].map((site) => {
                  const maxTraffic = Math.max(YOUR_SITE.traffic, ...COMPETITORS.map((c) => c.traffic))
                  const pct = (site.traffic / maxTraffic) * 100
                  const isYou = site.domain === YOUR_SITE.domain
                  return (
                    <div key={site.domain} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground flex items-center gap-2">
                          {site.domain}
                          {isYou && <Badge variant="default" className="text-[10px]">You</Badge>}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatCompact(site.traffic)} visits
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isYou ? 'bg-primary' : 'bg-muted-foreground/40'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyword-gap">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keyword Gap Analysis</CardTitle>
              <CardDescription>
                Discover keywords your competitors rank for that you don't
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16">
                {/* Venn diagram placeholder */}
                <div className="relative h-48 w-64 mb-6">
                  <div className="absolute left-0 top-4 h-40 w-40 rounded-full border-2 border-primary/30 bg-primary/5 flex items-center justify-center">
                    <span className="text-xs text-primary font-medium -ml-6">You</span>
                  </div>
                  <div className="absolute right-0 top-4 h-40 w-40 rounded-full border-2 border-warning/30 bg-warning/5 flex items-center justify-center">
                    <span className="text-xs text-warning font-medium ml-6">Competitor</span>
                  </div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <Badge variant="outline" className="bg-card">Shared: 234</Badge>
                  </div>
                  <div className="absolute left-8 top-1/2 -translate-y-1/2">
                    <span className="text-sm font-bold text-primary">412</span>
                  </div>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <span className="text-sm font-bold text-warning">1,108</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground">Keyword Gap Visualization</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground text-center">
                  Select a competitor above to see the full keyword gap analysis,
                  including unique keywords, shared rankings, and opportunity scores.
                </p>
                <Button variant="outline" className="mt-4 gap-2">
                  <Search className="h-4 w-4" />
                  Run Full Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backlink-gap">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Backlink Gap</CardTitle>
              <CardDescription>
                Find domains linking to competitors but not to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Link2 className="mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Backlink gap analysis will show referring domains linking to your competitors
                  but not yet linking to your site.
                </p>
                <Button variant="outline" className="mt-4 gap-2">
                  <Search className="h-4 w-4" />
                  Analyze Backlink Gap
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-gap">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Gap</CardTitle>
              <CardDescription>
                Topics and content types your competitors cover that you don't
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Identify content topics, formats, and keywords that your competitors rank for
                  where you have no presence.
                </p>
                <Button variant="outline" className="mt-4 gap-2">
                  <Search className="h-4 w-4" />
                  Find Content Gaps
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
