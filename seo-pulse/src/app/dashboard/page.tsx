import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Search,
  Link2,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MousePointerClick,
  FileText,
  Activity,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { KpiGrid } from '@/components/dashboard/kpi-grid'
import { AreaChartWidget } from '@/components/charts/area-chart'
import { BarChartWidget } from '@/components/charts/bar-chart'
import { ChartWrapper } from '@/components/charts/chart-wrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/project'
import { getDomainOverview, getDomainKeywords } from '@/lib/data-for-seo'

const trafficData = [
  { date: 'Mar 1', traffic: 3120, previous: 2680 },
  { date: 'Mar 2', traffic: 3240, previous: 2750 },
  { date: 'Mar 3', traffic: 2890, previous: 2520 },
  { date: 'Mar 4', traffic: 3410, previous: 2810 },
  { date: 'Mar 5', traffic: 3560, previous: 2900 },
  { date: 'Mar 6', traffic: 3680, previous: 2980 },
  { date: 'Mar 7', traffic: 3450, previous: 2870 },
  { date: 'Mar 8', traffic: 3210, previous: 2640 },
  { date: 'Mar 9', traffic: 3590, previous: 2920 },
  { date: 'Mar 10', traffic: 3780, previous: 3010 },
  { date: 'Mar 11', traffic: 3950, previous: 3090 },
  { date: 'Mar 12', traffic: 4120, previous: 3150 },
  { date: 'Mar 13', traffic: 4010, previous: 3080 },
  { date: 'Mar 14', traffic: 3870, previous: 2950 },
  { date: 'Mar 15', traffic: 3640, previous: 2830 },
  { date: 'Mar 16', traffic: 4230, previous: 3210 },
  { date: 'Mar 17', traffic: 4410, previous: 3340 },
  { date: 'Mar 18', traffic: 4580, previous: 3420 },
  { date: 'Mar 19', traffic: 4750, previous: 3510 },
  { date: 'Mar 20', traffic: 4620, previous: 3460 },
  { date: 'Mar 21', traffic: 4380, previous: 3280 },
  { date: 'Mar 22', traffic: 4150, previous: 3100 },
  { date: 'Mar 23', traffic: 4890, previous: 3580 },
  { date: 'Mar 24', traffic: 5120, previous: 3720 },
  { date: 'Mar 25', traffic: 5340, previous: 3860 },
  { date: 'Mar 26', traffic: 5510, previous: 3950 },
  { date: 'Mar 27', traffic: 5280, previous: 3810 },
  { date: 'Mar 28', traffic: 5060, previous: 3680 },
  { date: 'Mar 29', traffic: 5690, previous: 3940 },
  { date: 'Mar 30', traffic: 5920, previous: 4080 },
]

const keywordDistribution_MOCK = [
  { position: '1-3', count: 67, color: '#22c55e' },
  { position: '4-10', count: 183, color: '#3b82f6' },
  { position: '11-20', count: 258, color: '#f59e0b' },
  { position: '21-50', count: 214, color: '#ef4444' },
  { position: '50+', count: 186, color: '#71717a' },
]

const positionChanges = [
  { keyword: 'ai seo tools', from: 6, to: 3, change: 3 },
  { keyword: 'technical seo checklist 2026', from: 14, to: 7, change: 7 },
  { keyword: 'site speed optimization', from: 3, to: 2, change: 1 },
  { keyword: 'content marketing roi', from: 9, to: 5, change: 4 },
  { keyword: 'programmatic seo guide', from: 21, to: 12, change: 9 },
  { keyword: 'javascript seo rendering', from: 8, to: 11, change: -3 },
  { keyword: 'core web vitals wordpress', from: 4, to: 6, change: -2 },
  { keyword: 'link building strategies', from: 18, to: 10, change: 8 },
  { keyword: 'schema markup generator', from: 11, to: 16, change: -5 },
  { keyword: 'google search console api', from: 25, to: 15, change: 10 },
]

const topPages = [
  { url: '/blog/technical-seo-guide', title: 'Complete Technical SEO Guide (2026)', traffic: 18420, keywords: 342, avgPosition: 4.2 },
  { url: '/tools/site-audit', title: 'Free Site Audit Tool', traffic: 14890, keywords: 215, avgPosition: 6.8 },
  { url: '/blog/ai-content-optimization', title: 'AI Content Optimization: What Works', traffic: 11340, keywords: 189, avgPosition: 8.1 },
  { url: '/blog/link-building-2026', title: 'Link Building Strategies That Work in 2026', traffic: 9780, keywords: 156, avgPosition: 9.4 },
  { url: '/features/rank-tracker', title: 'Rank Tracker - Daily Position Monitoring', traffic: 7650, keywords: 128, avgPosition: 11.2 },
]

const recentActivity = [
  { icon: ArrowUpRight, color: 'text-success', text: "Keyword 'ai seo tools' moved to position #3", time: '12 min ago' },
  { icon: ExternalLink, color: 'text-primary', text: 'New backlink from techcrunch.com (DR 93)', time: '34 min ago' },
  { icon: CheckCircle, color: 'text-success', text: 'Content score improved for /blog/seo-guide (72 → 89)', time: '1 hr ago' },
  { icon: AlertTriangle, color: 'text-warning', text: '3 pages have new Core Web Vitals issues (CLS)', time: '2 hr ago' },
  { icon: ArrowDownRight, color: 'text-danger', text: "Keyword 'schema markup generator' dropped 5 positions", time: '3 hr ago' },
  { icon: Zap, color: 'text-primary', text: 'Crawl completed: 2,847 pages indexed, 12 errors found', time: '4 hr ago' },
  { icon: ExternalLink, color: 'text-primary', text: 'New backlink from searchengineland.com (DR 88)', time: '5 hr ago' },
  { icon: ArrowUpRight, color: 'text-success', text: "Keyword 'programmatic seo guide' jumped 9 positions to #12", time: '6 hr ago' },
]

const sparkline = [32, 35, 40, 38, 42, 50, 55, 58, 62, 60, 65, 70]

export function DashboardPage() {
  const navigate = useNavigate()
  const activeProject = useProjectStore(s => s.activeProject)

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['domain-overview', activeProject?.domain],
    queryFn: () => getDomainOverview(activeProject!.domain),
    enabled: !!activeProject?.domain,
  })

  const { data: keywords = [] } = useQuery({
    queryKey: ['domain-keywords', activeProject?.domain],
    queryFn: () => getDomainKeywords(activeProject!.domain, 200),
    enabled: !!activeProject?.domain,
  })

  const keywordDistribution = useMemo(() => {
    if (keywords.length === 0) return keywordDistribution_MOCK
    return [{ position: 'All', count: keywords.length, color: '#3b82f6' }]
  }, [keywords])

  if (!activeProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10 px-8">
            <h2 className="text-lg font-semibold text-foreground mb-2">No project selected</h2>
            <p className="text-sm text-muted-foreground mb-6">Complete onboarding to see your SEO data</p>
            <button
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Onboarding
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiCard
          label="Organic Traffic"
          value={overview?.organicTraffic ?? 0}
          previousValue={111200}
          format="compact"
          sparklineData={sparkline}
          loading={overviewLoading}
          icon={<TrendingUp className="h-4 w-4" />}
          tooltip="Total organic search visits this period"
        />
        <KpiCard
          label="Tracked Keywords"
          value={overview?.organicKeywords ?? 0}
          previousValue={845}
          format="number"
          sparklineData={[40, 42, 45, 48, 50, 53, 55, 58, 60, 62, 65, 68]}
          loading={overviewLoading}
          icon={<Search className="h-4 w-4" />}
          tooltip="Keywords in positions 1-100"
        />
        <KpiCard
          label="Backlinks"
          value={overview?.backlinks ?? 0}
          previousValue={11890}
          format="compact"
          sparklineData={[100, 105, 108, 112, 115, 118, 120, 122, 124, 125, 128, 130]}
          loading={overviewLoading}
          icon={<Link2 className="h-4 w-4" />}
          tooltip="Total referring backlinks"
        />
        <KpiCard
          label="Health Score"
          value={87}
          previousValue={82}
          format="number"
          sparklineData={[70, 72, 75, 78, 80, 82, 83, 84, 85, 86, 86, 87]}
          icon={<ShieldCheck className="h-4 w-4" />}
          tooltip="Overall site health (0-100)"
        />
      </KpiGrid>

      <ChartWrapper title="Organic Traffic Trend" subtitle="Last 30 days vs previous period">
        <AreaChartWidget
          data={trafficData}
          dataKey="traffic"
          compareDataKey="previous"
          xAxisKey="date"
          height={320}
        />
      </ChartWrapper>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Position Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {positionChanges.map((item) => (
                <div key={item.keyword} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.keyword}</p>
                    <p className="text-xs text-muted-foreground">
                      Pos {item.from} → {item.to}
                    </p>
                  </div>
                  <Badge variant={item.change > 0 ? 'success' : 'danger'}>
                    {item.change > 0 ? (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    )}
                    {item.change > 0 ? '+' : ''}{item.change}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ChartWrapper title="Keyword Distribution" subtitle="By SERP position">
          <BarChartWidget
            data={keywordDistribution}
            dataKey="count"
            xAxisKey="position"
            height={260}
          />
        </ChartWrapper>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Top Pages</CardTitle>
              <CardDescription>Highest-performing pages by organic traffic</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <FileText className="h-3 w-3" />
              5 pages
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                      <span className="text-sm tabular-nums font-medium text-foreground">{page.traffic.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm tabular-nums text-foreground">{page.keywords}</span>
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
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Share of Voice</p>
                <p className="text-2xl font-bold text-foreground">14.2%</p>
              </div>
            </div>
            <Badge variant="success">+2.1% vs last month</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <MousePointerClick className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. CTR</p>
                <p className="text-2xl font-bold text-foreground">4.8%</p>
              </div>
            </div>
            <Badge variant="success">+0.6% vs last month</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Search className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Position</p>
                <p className="text-2xl font-bold text-foreground">18.4</p>
              </div>
            </div>
            <Badge variant="success">-2.3 positions (improved)</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest changes and alerts across your SEO campaigns</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <Activity className="h-3 w-3" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ${item.color}`}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
