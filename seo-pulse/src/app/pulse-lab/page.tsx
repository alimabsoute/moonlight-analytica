import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TrendPulseWave } from '@/components/charts/trend-pulse-wave'

interface TrendTopic {
  keyword: string
  pulseScore: number
  velocity: number
  direction: 'rising' | 'peaking' | 'declining' | 'stable'
  volume: number
  category: string
}

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

function ToolStub({ name, description, icon: Icon }: { name: string; description: string; icon: typeof TrendingUp }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        <Badge variant="secondary" className="mt-4">Coming in Phase 2</Badge>
      </CardContent>
    </Card>
  )
}

export function PulseLabPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrend, setSelectedTrend] = useState(TRENDING_TOPICS[0])

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-[#8b5cf6]/5 p-6 sm:p-8">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-[60px]" />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-[#8b5cf6]/10 blur-[50px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="default" className="bg-primary/20 text-primary border-0">
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
                    />
                  </div>
                  <Button size="lg" className="gap-2 shrink-0">
                    <Zap className="h-4 w-4" />
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
                  keyword={selectedTrend.keyword}
                  velocity={selectedTrend.velocity}
                  height={220}
                />

                <Card>
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Trend Intelligence</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Pulse Score</span>
                        <span className="font-medium text-foreground">{selectedTrend.pulseScore}/100</span>
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
                        <span className="font-medium text-foreground tabular-nums">{selectedTrend.volume.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Category</span>
                        <Badge variant="outline" className="text-[10px]">{selectedTrend.category}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Content Calendar */}
        <TabsContent value="content-calendar">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Calendar</CardTitle>
              <CardDescription>AI-generated publishing schedule based on trend predictions and seasonal patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="mb-4 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground max-w-md">
                  Get an AI-powered content calendar that tells you exactly when to publish
                  based on predicted search demand peaks, competitor gaps, and seasonal patterns.
                </p>
                <Button variant="outline" className="mt-4">Generate Calendar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signal Fusion */}
        <TabsContent value="signal-fusion">
          <ToolStub
            name="Signal Fusion"
            icon={Radio}
            description="Combines Google Trends, Reddit mentions, news sentiment, and social signals into a unified trend score for any keyword."
          />
        </TabsContent>

        {/* Category Explorer */}
        <TabsContent value="category-explorer">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category Explorer</CardTitle>
              <CardDescription>Browse trending topics by industry and category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {['Technology', 'Finance', 'Health', 'Marketing', 'E-commerce', 'SaaS', 'AI & ML', 'Crypto', 'Education'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="flex items-center gap-3 rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Compass className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{cat}</p>
                      <p className="text-xs text-muted-foreground">Explore trends</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonal Patterns */}
        <TabsContent value="seasonal-patterns">
          <ToolStub
            name="Seasonal Patterns"
            icon={Sun}
            description="Analyze historical search patterns to identify seasonal peaks, dips, and optimal publishing windows for any topic."
          />
        </TabsContent>

        {/* Topic Clusters */}
        <TabsContent value="topic-clusters">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Topic Clusters</CardTitle>
              <CardDescription>AI-generated topic cluster maps for content strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Network className="mb-4 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground max-w-md">
                  Enter a seed keyword to generate a comprehensive topic cluster map with pillar content,
                  subtopics, and internal linking recommendations.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Input placeholder="Enter seed keyword..." className="max-w-xs" />
                  <Button>Generate Cluster</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Gaps */}
        <TabsContent value="competitive-gaps">
          <ToolStub
            name="Competitive Trend Gaps"
            icon={Target}
            description="Identify trending topics your competitors are covering that you're missing, ranked by opportunity score and velocity."
          />
        </TabsContent>

        {/* Trend Decay */}
        <TabsContent value="trend-decay">
          <ToolStub
            name="Trend Decay Analysis"
            icon={Timer}
            description="Predict how long a trending topic will remain relevant using historical decay patterns and signal analysis."
          />
        </TabsContent>

        {/* AI Search Predictor */}
        <TabsContent value="ai-search-predictor">
          <ToolStub
            name="AI Search Predictor"
            icon={Brain}
            description="Forecast how AI-powered search engines (SGE, Perplexity, Claude) will surface your content and predict citation likelihood."
          />
        </TabsContent>

        {/* Timing Optimizer */}
        <TabsContent value="timing-optimizer">
          <ToolStub
            name="Publish Timing Optimizer"
            icon={Clock}
            description="Data-driven recommendations for the best day and time to publish content based on your topic, audience, and competitive landscape."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
