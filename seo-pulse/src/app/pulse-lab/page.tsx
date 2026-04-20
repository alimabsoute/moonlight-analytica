import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Dot,
} from 'recharts'
import {
  Zap,
  TrendingUp,
  Calendar,
  Radio,
  Compass,
  Sun,
  Network,
  Target,
  Timer,
  Brain,
  Clock,
  Search,
  ArrowUpRight,
  Flame,
  Snowflake,
  Activity,
  Sparkles,
  ExternalLink,
  Bell,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { TrendPulseWave } from '@/components/charts/trend-pulse-wave'
import {
  webSearch,
  newsSearch,
  extractPAA,
  type BraveSearchResult,
  type BraveNewsResult,
} from '@/lib/brave-search'
import { getKeywordData, type KeywordData } from '@/lib/data-for-seo'
import { claudeChat } from '@/lib/claude'
import { useProjectStore } from '@/stores/project'

// ─── Types ───────────────────────────────────────────────────────────

interface TrendTopic {
  keyword: string
  pulseScore: number
  velocity: number
  direction: 'rising' | 'peaking' | 'declining' | 'stable'
  volume: number
  category: string
}

interface CalendarPost {
  day: string
  title: string
  keyword: string
  type: 'Blog' | 'Landing' | 'Update'
  priority: 'High' | 'Medium' | 'Low'
}

interface CalendarWeek {
  week: number
  theme: string
  posts: CalendarPost[]
}

interface CalendarPayload {
  weeks: CalendarWeek[]
}

interface AiFactor {
  name: string
  impact: 'Positive' | 'Negative' | 'Neutral'
  detail: string
}

interface AiPrediction {
  aiSearchScore: number
  prediction: string
  factors: AiFactor[]
  recommendation: string
}

// ─── Constants ───────────────────────────────────────────────────────

const TRENDING_TOPICS: TrendTopic[] = [
  { keyword: 'Claude AI agent SDK', pulseScore: 94, velocity: 42.5, direction: 'rising', volume: 12400, category: 'AI' },
  { keyword: 'React 19 server components', pulseScore: 87, velocity: 18.2, direction: 'peaking', volume: 8900, category: 'Development' },
  { keyword: 'Google SGE optimization', pulseScore: 82, velocity: 31.7, direction: 'rising', volume: 6600, category: 'SEO' },
  { keyword: 'zero-click search strategy', pulseScore: 76, velocity: 15.4, direction: 'rising', volume: 4200, category: 'SEO' },
  { keyword: 'AI content detection bypass', pulseScore: 71, velocity: -8.3, direction: 'declining', volume: 22100, category: 'AI' },
  { keyword: 'programmatic seo 2026', pulseScore: 68, velocity: 24.1, direction: 'rising', volume: 3100, category: 'SEO' },
  { keyword: 'web vitals INP score', pulseScore: 63, velocity: 5.2, direction: 'stable', volume: 5800, category: 'Development' },
  { keyword: 'video seo optimization', pulseScore: 55, velocity: 12.8, direction: 'rising', volume: 7400, category: 'SEO' },
]

const PULSE_TOOLS = [
  { id: 'trend-velocity', label: 'Trend Velocity', icon: TrendingUp, phase: 1 },
  { id: 'content-calendar', label: 'Content Calendar', icon: Calendar, phase: 1 },
  { id: 'signal-fusion', label: 'Signal Fusion', icon: Radio, phase: 2 },
  { id: 'category-explorer', label: 'Category Explorer', icon: Compass, phase: 1 },
  { id: 'seasonal-patterns', label: 'Seasonal Patterns', icon: Sun, phase: 2 },
  { id: 'topic-clusters', label: 'Topic Clusters', icon: Network, phase: 1 },
  { id: 'competitive-gaps', label: 'Competitive Gaps', icon: Target, phase: 2 },
  { id: 'trend-decay', label: 'Trend Decay', icon: Timer, phase: 2 },
  { id: 'ai-search-predictor', label: 'AI Search Predictor', icon: Brain, phase: 2 },
  { id: 'timing-optimizer', label: 'Timing Optimizer', icon: Clock, phase: 2 },
] as const

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ─── Helpers ─────────────────────────────────────────────────────────

function getDirectionIcon(direction: TrendTopic['direction']) {
  switch (direction) {
    case 'rising': return <Flame className="h-3 w-3" />
    case 'peaking': return <Activity className="h-3 w-3" />
    case 'declining': return <Snowflake className="h-3 w-3" />
    case 'stable': return <ArrowUpRight className="h-3 w-3" />
  }
}

function getDirectionColor(direction: TrendTopic['direction']) {
  switch (direction) {
    case 'rising': return 'text-success bg-success/15'
    case 'peaking': return 'text-warning bg-warning/15'
    case 'declining': return 'text-danger bg-danger/15'
    case 'stable': return 'text-primary bg-primary/15'
  }
}

function priorityColor(priority: CalendarPost['priority']): string {
  switch (priority) {
    case 'High': return 'text-danger bg-danger/15 border-danger/30'
    case 'Medium': return 'text-warning bg-warning/15 border-warning/30'
    case 'Low': return 'text-success bg-success/15 border-success/30'
  }
}

function impactColor(impact: AiFactor['impact']): string {
  switch (impact) {
    case 'Positive': return 'text-success bg-success/15 border-success/30'
    case 'Negative': return 'text-danger bg-danger/15 border-danger/30'
    case 'Neutral': return 'text-muted-foreground bg-muted border-border'
  }
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-danger'
}

function scoreRingColor(score: number): string {
  if (score >= 70) return 'stroke-success'
  if (score >= 40) return 'stroke-warning'
  return 'stroke-danger'
}

/**
 * Parse JSON from a Claude response, stripping markdown code fences.
 */
function parseClaudeJson<T>(raw: string): T {
  let text = raw.trim()
  // Strip ```json ... ``` or ``` ... ``` fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
  }
  // Fallback: extract first { ... } block
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1)
  }
  return JSON.parse(text) as T
}

/**
 * Normalize a trend array to 0-100 scale.
 */
function normalizeTrend(trend: number[]): { month: string; value: number }[] {
  if (!trend.length) return MONTH_LABELS.map((m) => ({ month: m, value: 0 }))
  const max = Math.max(...trend)
  const min = Math.min(...trend)
  const range = max - min || 1
  return MONTH_LABELS.map((month, i) => ({
    month,
    value: Math.round(((trend[i] ?? 0) - min) / range * 100),
  }))
}

// ─── Sub-components ──────────────────────────────────────────────────

function PulseScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : score >= 40 ? 'text-primary' : 'text-muted-foreground'
  const bg = score >= 80 ? 'bg-success/15' : score >= 60 ? 'bg-warning/15' : score >= 40 ? 'bg-primary/15' : 'bg-muted'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${color} ${bg}`}>
      <Zap className="h-3 w-3" />
      {score}
    </span>
  )
}

function PlaceholderTool({
  name,
  description,
  icon: Icon,
}: {
  name: string
  description: string
  icon: typeof TrendingUp
}) {
  const [notified, setNotified] = useState(false)

  const handleNotify = () => {
    setNotified(true)
    window.setTimeout(() => setNotified(false), 2400)
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-steel/10">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">{name}</h3>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{description}</p>
        <Badge variant="secondary" className="mt-5">Launching Q3 2026</Badge>
        <div className="mt-4">
          {notified ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-4 py-2 text-xs font-medium text-success">
              <Bell className="h-3.5 w-3.5" />
              You&apos;ll be notified!
            </span>
          ) : (
            <Button variant="outline" size="sm" onClick={handleNotify} className="gap-2">
              <Bell className="h-3.5 w-3.5" />
              Notify me
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Trend Velocity — Live News Signals ──────────────────────────────

function LiveNewsSignals({ keyword }: { keyword: string }) {
  const query = useQuery<BraveNewsResult[]>({
    queryKey: ['pulse', 'news', keyword],
    queryFn: () => newsSearch(keyword, 5),
    enabled: !!keyword,
    staleTime: 5 * 60_000,
  })

  if (!keyword) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          Live News Signals
        </CardTitle>
        <CardDescription>
          Real-time news coverage for &ldquo;{keyword}&rdquo;
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching news signals...
          </div>
        )}
        {query.isError && (
          <p className="py-6 text-sm text-danger">
            Failed to load news signals. {query.error instanceof Error ? query.error.message : ''}
          </p>
        )}
        {query.data && query.data.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">No recent news coverage found.</p>
        )}
        {query.data && query.data.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {query.data.map((article) => (
              <a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <p className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                  {article.title}
                </p>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate font-medium">{article.source}</span>
                  <span className="shrink-0 tabular-nums">{article.age}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                  Read <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Content Calendar ────────────────────────────────────────────────

function ContentCalendarTab() {
  const activeProject = useProjectStore((s) => s.activeProject)

  const mutation = useMutation<CalendarPayload, Error, void>({
    mutationFn: async () => {
      if (!activeProject) throw new Error('No active project')
      const keywords = activeProject.trackedKeywords?.slice(0, 8).join(', ') || 'general SEO topics'
      const prompt = `Generate a 4-week SEO content calendar for a website about "${activeProject.domain}".
Tracked keywords: ${keywords}.

Return ONLY valid JSON: { "weeks": [{ "week": 1, "theme": "string", "posts": [{ "day": "Mon", "title": "string", "keyword": "string", "type": "Blog|Landing|Update", "priority": "High|Medium|Low" }] }] }
Return exactly 4 weeks, 3 posts each.`

      const text = await claudeChat(
        [{ role: 'user', content: prompt }],
        { model: 'haiku', maxTokens: 2000 },
      )
      return parseClaudeJson<CalendarPayload>(text)
    },
  })

  if (!activeProject) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Add a project to generate a content calendar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Content Calendar</CardTitle>
              <CardDescription>
                AI-generated 4-week publishing schedule for {activeProject.domain}
              </CardDescription>
            </div>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="gap-2 shrink-0"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {mutation.data ? 'Regenerate Calendar' : 'Generate Calendar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mutation.isPending && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Claude is generating your calendar...</p>
            </div>
          )}
          {mutation.isError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-danger">Generation failed. Check API credentials.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {mutation.error instanceof Error ? mutation.error.message : ''}
              </p>
            </div>
          )}
          {mutation.data && (
            <div className="grid gap-4 lg:grid-cols-4">
              {mutation.data.weeks.map((week) => (
                <div key={week.week} className="space-y-3">
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Week {week.week}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{week.theme}</p>
                  </div>
                  <div className="space-y-2">
                    {week.posts.map((post, idx) => (
                      <div
                        key={`${week.week}-${idx}`}
                        className="space-y-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {post.day}
                          </span>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityColor(post.priority)}`}>
                            {post.priority}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-snug text-foreground">{post.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">{post.type}</Badge>
                          <Badge variant="secondary" className="text-[10px] truncate max-w-[140px]">
                            {post.keyword}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!mutation.data && !mutation.isPending && !mutation.isError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="mb-4 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground max-w-md">
                Generate an AI-powered 4-week content calendar based on your tracked keywords
                and domain focus.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Signal Fusion ───────────────────────────────────────────────────

interface FusionResult {
  web: BraveSearchResult[]
  news: BraveNewsResult[]
  paa: string[]
}

function SignalFusionTab() {
  const [topic, setTopic] = useState('')
  const [submitted, setSubmitted] = useState('')

  const mutation = useMutation<FusionResult, Error, string>({
    mutationFn: async (q) => {
      const [web, news, paa] = await Promise.all([
        webSearch(q, 5).catch(() => []),
        newsSearch(q, 5).catch(() => []),
        extractPAA(q).catch(() => []),
      ])
      return { web, news, paa }
    },
  })

  const handleSubmit = () => {
    const trimmed = topic.trim()
    if (!trimmed) return
    setSubmitted(trimmed)
    mutation.mutate(trimmed)
  }

  const signalStrength = mutation.data
    ? Math.min(100, mutation.data.web.length * 8 + mutation.data.news.length * 6 + mutation.data.paa.length * 4)
    : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Radio className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter a topic to analyze signals..."
                className="pl-10 h-11"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <Button
              size="lg"
              className="gap-2 shrink-0"
              onClick={handleSubmit}
              disabled={mutation.isPending || !topic.trim()}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Fuse Signals
            </Button>
          </div>
        </CardContent>
      </Card>

      {mutation.data && submitted && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Signal Strength</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Combined intensity across web, news, and question signals for &ldquo;{submitted}&rdquo;
                </p>
              </div>
              <div className={`text-4xl font-bold tabular-nums ${scoreColor(signalStrength)}`}>
                {signalStrength}
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  signalStrength >= 70 ? 'bg-success' : signalStrength >= 40 ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${signalStrength}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {(mutation.isPending || mutation.data) && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Web Signals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Web Signals
              </CardTitle>
              <CardDescription>{mutation.data?.web.length ?? 0} results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mutation.isPending && <SignalSkeleton />}
              {mutation.data?.web.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md border border-border px-3 py-2 text-xs transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <p className="line-clamp-2 font-medium text-foreground">{r.title}</p>
                  <p className="mt-1 truncate text-muted-foreground">{new URL(r.url).hostname}</p>
                </a>
              ))}
              {mutation.data && mutation.data.web.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No web signals</p>
              )}
            </CardContent>
          </Card>

          {/* News Signals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                News Signals
              </CardTitle>
              <CardDescription>{mutation.data?.news.length ?? 0} results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mutation.isPending && <SignalSkeleton />}
              {mutation.data?.news.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md border border-border px-3 py-2 text-xs transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <p className="line-clamp-2 font-medium text-foreground">{r.title}</p>
                  <p className="mt-1 flex items-center justify-between text-muted-foreground">
                    <span className="truncate">{r.source}</span>
                    <span className="shrink-0 tabular-nums">{r.age}</span>
                  </p>
                </a>
              ))}
              {mutation.data && mutation.data.news.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No news signals</p>
              )}
            </CardContent>
          </Card>

          {/* PAA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                People Also Ask
              </CardTitle>
              <CardDescription>{mutation.data?.paa.length ?? 0} questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mutation.isPending && <SignalSkeleton />}
              {mutation.data?.paa.map((q, i) => (
                <div
                  key={i}
                  className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground"
                >
                  {q}
                </div>
              ))}
              {mutation.data && mutation.data.paa.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No questions found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {mutation.isError && (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-sm text-danger">Signal fusion failed. {mutation.error.message}</p>
          </CardContent>
        </Card>
      )}

      {!mutation.data && !mutation.isPending && !submitted && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Radio className="mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground max-w-md">
              Fuse web, news, and &quot;People Also Ask&quot; signals into a unified trend score
              for any topic.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SignalSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}

// ─── Seasonal Patterns ───────────────────────────────────────────────

function SeasonalPatternsTab() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const keywordOptions = activeProject?.trackedKeywords?.slice(0, 10) ?? []
  const [selectedKeyword, setSelectedKeyword] = useState(keywordOptions[0] ?? '')

  const query = useQuery<KeywordData[]>({
    queryKey: ['pulse', 'seasonal', selectedKeyword],
    queryFn: () => getKeywordData([selectedKeyword]),
    enabled: !!selectedKeyword,
    staleTime: 10 * 60_000,
  })

  const trendData = useMemo(() => query.data?.[0]?.trend ?? [], [query.data])
  const chartData = useMemo(() => normalizeTrend(trendData), [trendData])
  const peakIdx = useMemo(() => {
    if (!chartData.length) return 0
    let p = 0
    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i].value > chartData[p].value) p = i
    }
    return p
  }, [chartData])
  const lowIdx = useMemo(() => {
    if (!chartData.length) return 0
    let l = 0
    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i].value < chartData[l].value) l = i
    }
    return l
  }, [chartData])
  const variance = useMemo(() => {
    if (!trendData.length) return 0
    const avg = trendData.reduce((a, b) => a + b, 0) / trendData.length
    if (avg === 0) return 0
    const max = Math.max(...trendData)
    const min = Math.min(...trendData)
    return Math.round(((max - min) / avg) * 100)
  }, [trendData])

  if (!activeProject || keywordOptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Sun className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Add keywords to your project to see seasonal patterns.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Seasonal Patterns</CardTitle>
              <CardDescription>12-month search volume trend for tracked keywords</CardDescription>
            </div>
            <div className="sm:w-72">
              <Select
                value={selectedKeyword}
                onChange={(e) => setSelectedKeyword(e.target.value)}
              >
                {keywordOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {query.isError && (
            <p className="py-12 text-center text-sm text-danger">
              Failed to load seasonal data. {query.error instanceof Error ? query.error.message : ''}
            </p>
          )}
          {query.data && (
            <div className="space-y-5">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, _name, props) => {
                        const isPeak = props.payload?.month === chartData[peakIdx]?.month
                        return [`${value}${isPeak ? ' (Peak month)' : ''}`, 'Volume Index']
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                        const isPeak = index === peakIdx
                        return (
                          <Dot
                            key={`dot-${index}`}
                            cx={cx}
                            cy={cy}
                            r={isPeak ? 6 : 3}
                            fill={isPeak ? '#f59e0b' : '#3b82f6'}
                            stroke={isPeak ? '#f59e0b' : '#3b82f6'}
                            strokeWidth={isPeak ? 2 : 1}
                          />
                        )
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Peak Month</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{chartData[peakIdx]?.month ?? '—'}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Low Month</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{chartData[lowIdx]?.month ?? '—'}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Variance</p>
                  <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{variance}%</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── AI Search Predictor ─────────────────────────────────────────────

function AiSearchPredictorTab() {
  const [keyword, setKeyword] = useState('')
  const [submitted, setSubmitted] = useState('')

  const mutation = useMutation<AiPrediction, Error, string>({
    mutationFn: async (q) => {
      const prompt = `You are an AI search expert. Analyze the keyword "${q}" for AI-powered search performance.

Return ONLY valid JSON:
{
  "aiSearchScore": <0-100>,
  "prediction": "<1 sentence>",
  "factors": [{ "name": "string", "impact": "Positive|Negative|Neutral", "detail": "string" }],
  "recommendation": "<1 actionable sentence>"
}
Return exactly 3 factors.`

      const text = await claudeChat(
        [{ role: 'user', content: prompt }],
        { model: 'haiku', maxTokens: 1200 },
      )
      return parseClaudeJson<AiPrediction>(text)
    },
  })

  const handleSubmit = () => {
    const trimmed = keyword.trim()
    if (!trimmed) return
    setSubmitted(trimmed)
    mutation.mutate(trimmed)
  }

  const score = mutation.data?.aiSearchScore ?? 0
  // SVG gauge: circumference for r=50
  const circ = 2 * Math.PI * 50
  const offset = circ - (score / 100) * circ

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Brain className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter a keyword to predict AI search performance..."
                className="pl-10 h-11"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <Button
              size="lg"
              className="gap-2 shrink-0"
              onClick={handleSubmit}
              disabled={mutation.isPending || !keyword.trim()}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Predict
            </Button>
          </div>
        </CardContent>
      </Card>

      {mutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing AI search landscape...</p>
          </CardContent>
        </Card>
      )}

      {mutation.isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-danger">Prediction failed. Check API credentials.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {mutation.error instanceof Error ? mutation.error.message : ''}
            </p>
          </CardContent>
        </Card>
      )}

      {mutation.data && submitted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prediction for &ldquo;{submitted}&rdquo;</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score + Prediction */}
            <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
              <div className="relative flex items-center justify-center">
                <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className={scoreRingColor(score)}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold tabular-nums ${scoreColor(score)}`}>{score}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">AI Score</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prediction</p>
                <p className="mt-2 text-base leading-relaxed text-foreground">{mutation.data.prediction}</p>
              </div>
            </div>

            {/* Factors */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Key Factors</p>
              <div className="space-y-2">
                {mutation.data.factors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${impactColor(factor.impact)}`}>
                      {factor.impact}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{factor.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{factor.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Recommendation</p>
              <p className="mt-2 text-sm text-foreground">{mutation.data.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!mutation.data && !mutation.isPending && !submitted && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground max-w-md">
              Forecast how AI-powered search engines (Google SGE, Bing Copilot, Perplexity)
              will surface your content and predict citation likelihood.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Category Explorer ───────────────────────────────────────────────

const CATEGORY_INITIAL = 6

function CategoryExplorerTab() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const keywords = activeProject?.trackedKeywords ?? []
  const [visible, setVisible] = useState(CATEGORY_INITIAL)

  const visibleKeywords = keywords.slice(0, visible)

  const query = useQuery<KeywordData[]>({
    queryKey: ['pulse', 'category-explorer', visibleKeywords.join('|')],
    queryFn: () => getKeywordData(visibleKeywords),
    enabled: visibleKeywords.length > 0,
    staleTime: 10 * 60_000,
  })

  if (!activeProject || keywords.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Compass className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Add a project with tracked keywords to explore categories.
          </p>
        </CardContent>
      </Card>
    )
  }

  const dataByKeyword = new Map((query.data ?? []).map((d) => [d.keyword.toLowerCase(), d]))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Category Explorer</CardTitle>
        <CardDescription>
          Tracked topic cards — volume and difficulty for {keywords.length} keywords
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleKeywords.map((kw) => {
            const data = dataByKeyword.get(kw.toLowerCase())
            return (
              <div
                key={kw}
                className="rounded-lg border border-border p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Compass className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{kw}</p>
                    {query.isLoading && !data && (
                      <p className="mt-1 text-xs text-muted-foreground">Loading...</p>
                    )}
                    {data && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          Vol {data.searchVolume.toLocaleString()}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          KD {Math.round(data.difficulty)}
                        </Badge>
                      </div>
                    )}
                    {!query.isLoading && !data && !query.isError && (
                      <p className="mt-1 text-xs text-muted-foreground">No data</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {query.isError && (
          <p className="text-center text-xs text-danger">
            Failed to load keyword metrics. {query.error instanceof Error ? query.error.message : ''}
          </p>
        )}

        {visible < keywords.length && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisible((v) => v + CATEGORY_INITIAL)}
              className="gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              Load More ({keywords.length - visible} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Topic Clusters ──────────────────────────────────────────────────

function TopicClustersTab() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const keywords = useMemo(() => activeProject?.trackedKeywords ?? [], [activeProject])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const clusters = useMemo(() => {
    const groups = new Map<string, string[]>()
    const stopwords = new Set(['the', 'a', 'an', 'of', 'for', 'to', 'in', 'on', 'and', 'or'])
    for (const kw of keywords) {
      const first = kw.trim().toLowerCase().split(/\s+/).find((w) => w && !stopwords.has(w)) ?? kw
      const group = groups.get(first) ?? []
      group.push(kw)
      groups.set(first, group)
    }
    return Array.from(groups.entries())
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [keywords])

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  if (!activeProject || keywords.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Network className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Add a project with tracked keywords to see topic clusters.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Topic Clusters</CardTitle>
        <CardDescription>
          {clusters.length} semantic clusters across {keywords.length} tracked keywords
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {clusters.map((cluster) => {
          const isOpen = expanded.has(cluster.name)
          return (
            <div key={cluster.name} className="overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                onClick={() => toggle(cluster.name)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Network className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium capitalize text-foreground">{cluster.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cluster.items.length} keyword{cluster.items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-border bg-muted/20 px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.items.map((kw) => (
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
      </CardContent>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────

export function PulseLabPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrend, setSelectedTrend] = useState(TRENDING_TOPICS[0])
  const [analyzedKeyword, setAnalyzedKeyword] = useState('')

  const keywordQuery = useQuery<KeywordData[]>({
    queryKey: ['pulse', 'keyword-data', analyzedKeyword],
    queryFn: () => getKeywordData([analyzedKeyword]),
    enabled: !!analyzedKeyword,
    staleTime: 10 * 60_000,
  })

  const handleAnalyze = () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    setAnalyzedKeyword(trimmed)
  }

  const liveKeywordData = keywordQuery.data?.[0]

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface-cool via-card to-surface-metallic p-6 sm:p-8">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-steel/5 blur-[60px]" />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-metallic/5 blur-[50px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-steel/15">
              <Zap className="h-4 w-4 text-steel" />
            </div>
            <Badge variant="default" className="bg-steel/10 text-steel border-0">
              Signature Feature
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pulse Lab</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Proprietary trend intelligence engine. Detect emerging topics, predict search demand,
            and time your content for maximum impact.
          </p>
        </div>
      </div>

      {/* Tool Tabs */}
      <Tabs defaultValue="trend-velocity">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto">
            {PULSE_TOOLS.map((tool) => (
              <TabsTrigger key={tool.id} value={tool.id} className="gap-1.5 shrink-0">
                <tool.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tool.label}</span>
                {tool.phase > 1 && (
                  <span className="ml-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Trend Velocity — Primary Tab */}
        <TabsContent value="trend-velocity">
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search trending topics or enter a keyword..."
                      className="pl-10 h-11"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="gap-2 shrink-0"
                    onClick={handleAnalyze}
                    disabled={!searchQuery.trim() || keywordQuery.isFetching}
                  >
                    {keywordQuery.isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Analyze Pulse
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
              {/* Trending Topics List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Trending Topics</CardTitle>
                  <CardDescription>Real-time trend detection across search, social, and news</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {TRENDING_TOPICS.map((topic) => (
                      <button
                        type="button"
                        key={topic.keyword}
                        onClick={() => setSelectedTrend(topic)}
                        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 ${
                          selectedTrend.keyword === topic.keyword ? 'bg-muted/50' : ''
                        }`}
                      >
                        <PulseScoreBadge score={topic.pulseScore} />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {topic.keyword}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-[10px]">{topic.category}</Badge>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {topic.volume.toLocaleString()} vol
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getDirectionColor(topic.direction)}`}>
                            {getDirectionIcon(topic.direction)}
                            {topic.direction}
                          </span>
                          <span className={`text-xs font-medium tabular-nums ${
                            topic.velocity > 0 ? 'text-success' : 'text-danger'
                          }`}>
                            {topic.velocity > 0 ? '+' : ''}{topic.velocity.toFixed(1)}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* TrendPulseWave Visualization */}
              <div className="space-y-4">
                <TrendPulseWave
                  score={selectedTrend.pulseScore}
                  keyword={analyzedKeyword || selectedTrend.keyword}
                  velocity={selectedTrend.velocity}
                  height={220}
                />

                <Card>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Trend Intelligence</h3>
                      {analyzedKeyword && (
                        <Badge variant="secondary" className="text-[10px]">
                          {keywordQuery.isFetching ? 'Loading…' : 'Live Data'}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {analyzedKeyword ? 'Keyword' : 'Pulse Score'}
                        </span>
                        <span className="font-medium text-foreground truncate max-w-[180px]">
                          {analyzedKeyword || `${selectedTrend.pulseScore}/100`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Velocity</span>
                        <span className={`font-medium ${selectedTrend.velocity > 0 ? 'text-success' : 'text-danger'}`}>
                          {selectedTrend.velocity > 0 ? '+' : ''}{selectedTrend.velocity.toFixed(1)}% /wk
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Direction</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{selectedTrend.direction}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Search Volume</span>
                        <span className="font-medium text-foreground tabular-nums">
                          {liveKeywordData
                            ? liveKeywordData.searchVolume.toLocaleString()
                            : selectedTrend.volume.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {liveKeywordData ? 'Difficulty' : 'Category'}
                        </span>
                        {liveKeywordData ? (
                          <span className="font-medium text-foreground tabular-nums">
                            {Math.round(liveKeywordData.difficulty)} KD
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">{selectedTrend.category}</Badge>
                        )}
                      </div>
                      {liveKeywordData && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">CPC</span>
                          <span className="font-medium text-foreground tabular-nums">
                            ${liveKeywordData.cpc.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    {keywordQuery.isError && (
                      <p className="text-[11px] text-danger">
                        Live data unavailable. {keywordQuery.error instanceof Error ? keywordQuery.error.message : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Live News Signals — only shows when a keyword has been analyzed */}
            {analyzedKeyword && <LiveNewsSignals keyword={analyzedKeyword} />}
          </div>
        </TabsContent>

        {/* Content Calendar */}
        <TabsContent value="content-calendar">
          <ContentCalendarTab />
        </TabsContent>

        {/* Signal Fusion */}
        <TabsContent value="signal-fusion">
          <SignalFusionTab />
        </TabsContent>

        {/* Category Explorer */}
        <TabsContent value="category-explorer">
          <CategoryExplorerTab />
        </TabsContent>

        {/* Seasonal Patterns */}
        <TabsContent value="seasonal-patterns">
          <SeasonalPatternsTab />
        </TabsContent>

        {/* Topic Clusters */}
        <TabsContent value="topic-clusters">
          <TopicClustersTab />
        </TabsContent>

        {/* Competitive Gaps — placeholder */}
        <TabsContent value="competitive-gaps">
          <PlaceholderTool
            name="Competitive Trend Gaps"
            icon={Target}
            description="Identify trending topics your competitors are covering that you're missing, ranked by opportunity score and velocity. Cross-reference competitor content with your gaps to prioritize the highest-leverage topics to produce next."
          />
        </TabsContent>

        {/* Trend Decay — placeholder */}
        <TabsContent value="trend-decay">
          <PlaceholderTool
            name="Trend Decay Analysis"
            icon={Timer}
            description="Predict how long a trending topic will remain relevant using historical decay patterns and signal analysis. Know when to ride a wave — and when to cut losses and reinvest in evergreen content."
          />
        </TabsContent>

        {/* AI Search Predictor */}
        <TabsContent value="ai-search-predictor">
          <AiSearchPredictorTab />
        </TabsContent>

        {/* Timing Optimizer — placeholder */}
        <TabsContent value="timing-optimizer">
          <PlaceholderTool
            name="Publish Timing Optimizer"
            icon={Clock}
            description="Data-driven recommendations for the best day and time to publish content based on your topic, audience, and competitive landscape. Maximize first-24-hour engagement and SERP entry velocity."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
