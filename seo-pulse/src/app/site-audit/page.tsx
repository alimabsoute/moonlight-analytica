import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  FileCode,
  Heading,
  Image,
  Link2,
  Braces,
  Gauge,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectStore } from '@/stores/project'
import { getDomainOverview } from '@/lib/data-for-seo'
import { useNavigate } from 'react-router-dom'

const HEALTH_SCORE_FALLBACK = 84

const ISSUE_SUMMARY = [
  { label: 'Errors', count: 7, icon: AlertCircle, color: 'text-danger', bgColor: 'bg-danger/10' },
  { label: 'Warnings', count: 18, icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10' },
  { label: 'Notices', count: 31, icon: Info, color: 'text-primary', bgColor: 'bg-primary/10' },
]

const AUDIT_CATEGORIES = [
  {
    name: 'Meta Tags',
    icon: FileCode,
    passed: 831,
    failed: 16,
    issues: [
      'Pages without meta description: 8',
      'Duplicate title tags on 4 pages',
      'Title tags too long (>60 chars): 3 pages',
      'Empty meta robots tag: 1 page',
    ],
  },
  {
    name: 'Headings',
    icon: Heading,
    passed: 839,
    failed: 8,
    issues: [
      'Missing H1 tag on 3 pages',
      'Multiple H1 tags: 2 pages',
      'Skipped heading levels (H2 to H4): 3 pages',
    ],
  },
  {
    name: 'Images',
    icon: Image,
    passed: 1204,
    failed: 18,
    issues: [
      'Images without alt text: 12',
      'Oversized images (>500KB): 4',
      'Missing width/height attributes: 2',
    ],
  },
  {
    name: 'Links',
    icon: Link2,
    passed: 3412,
    failed: 9,
    issues: [
      'Broken internal links: 4',
      'Redirect chains (3+ hops): 2',
      'Orphan pages with no internal links: 2',
      'Nofollow on internal links: 1',
    ],
  },
  {
    name: 'Schema',
    icon: Braces,
    passed: 42,
    failed: 3,
    issues: [
      'Missing Organization schema on homepage',
      'Invalid FAQ schema on /help',
      'BreadcrumbList missing on 1 category page',
    ],
  },
  {
    name: 'Core Web Vitals',
    icon: Gauge,
    passed: 4,
    failed: 2,
    issues: [
      'CLS above 0.1 threshold on 14 mobile pages',
      'LCP >2.5s on /blog and /pricing pages',
    ],
  },
]

function HealthGauge({ score, loading }: { score: number; loading: boolean }) {
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (score / 100) * circumference * 0.75
  const color = score >= 80 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-[135deg]">
        {/* Background track */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        />
        {/* Score arc */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke={loading ? 'var(--color-muted)' : color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={loading ? circumference : strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={loading ? undefined : { filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {loading ? (
          <>
            <Skeleton className="h-12 w-16 rounded-md" />
            <Skeleton className="h-4 w-20 rounded mt-2" />
          </>
        ) : (
          <>
            <span className="text-5xl font-bold text-foreground tabular-nums">{score}</span>
            <span className="text-sm text-muted-foreground -mt-1">out of 100</span>
          </>
        )}
      </div>
    </div>
  )
}

export function SiteAuditPage() {
  const navigate = useNavigate()
  const activeProject = useProjectStore((s) => s.activeProject)

  const [auditRun, setAuditRun] = useState(true)
  const [auditRunning, setAuditRunning] = useState(false)
  const [lastAuditedAt, setLastAuditedAt] = useState<Date | null>(null)

  const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useQuery({
    queryKey: ['domain-overview', activeProject?.domain],
    queryFn: () => getDomainOverview(activeProject!.domain),
    enabled: !!activeProject?.domain,
  })

  const healthScore = overview
    ? Math.min(100, Math.round((overview.domainRank / 100) * 60 + 40))
    : HEALTH_SCORE_FALLBACK

  async function handleRunAudit() {
    setAuditRunning(true)
    await refetchOverview()
    setTimeout(() => {
      setAuditRunning(false)
      setLastAuditedAt(new Date())
    }, 2000)
  }

  // Empty state — no active project
  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive technical SEO analysis of your website
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Connect your website to run a site audit.</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Add your domain in the onboarding flow to start analyzing technical SEO issues.
            </p>
            <Button
              size="lg"
              className="mt-6 gap-2"
              onClick={() => navigate('/onboarding')}
            >
              Go to Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (overviewError && !overviewLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive technical SEO analysis of your website
          </p>
        </div>
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-destructive mb-4">
              Failed to load domain data for {activeProject?.domain}
            </p>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => refetchOverview()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!auditRun) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive technical SEO analysis of your website
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No audit has been run yet</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Run a comprehensive audit to identify technical SEO issues, broken links,
              missing meta tags, and Core Web Vitals problems.
            </p>
            <Button
              size="lg"
              className="mt-6 gap-2"
              onClick={() => setAuditRun(true)}
            >
              <Play className="h-4 w-4" />
              Start Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive technical SEO analysis of your website
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-0.5 hidden md:flex">
            <span className="text-xs text-muted-foreground">
              Last crawl: 2 hours ago &bull; 847 pages crawled &bull; 14.2s avg response time
            </span>
            {lastAuditedAt && (
              <span className="text-xs text-success">
                Last audited: just now
              </span>
            )}
          </div>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Crawl complete
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={auditRunning}
            onClick={handleRunAudit}
          >
            {auditRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Re-run Audit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Health Score & Issues */}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Health Score Gauge */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <HealthGauge score={healthScore} loading={overviewLoading} />
            <div className="mt-4 text-center">
              <p className="text-base font-semibold text-foreground">Site Health Score</p>
              {overviewLoading ? (
                <Skeleton className="h-4 w-48 rounded mt-1 mx-auto" />
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {healthScore >= 80 ? 'Good' : healthScore >= 50 ? 'Needs improvement' : 'Critical'} —{' '}
                  {healthScore >= 80
                    ? 'Your site is in good technical health'
                    : 'Several issues need attention'}
                </p>
              )}
            </div>

            {/* Organic keywords stat */}
            {overview && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-4 w-full justify-center">
                <Search className="h-3.5 w-3.5" />
                <span>
                  <span className="font-semibold text-foreground">
                    {overview.organicKeywords.toLocaleString()}
                  </span>{' '}
                  organic keywords found
                </span>
              </div>
            )}
            {overviewLoading && (
              <div className="mt-4 border-t pt-4 w-full flex justify-center">
                <Skeleton className="h-4 w-40 rounded" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issue Breakdown */}
        <div className="grid gap-4 sm:grid-cols-3">
          {ISSUE_SUMMARY.map((issue) => (
            <Card key={issue.label}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${issue.bgColor}`}>
                    <issue.icon className={`h-5 w-5 ${issue.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {issue.label}
                    </p>
                    <p className={`text-3xl font-bold ${issue.color}`}>{issue.count}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full gap-1.5">
                  View {issue.label.toLowerCase()}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Audit Categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIT_CATEGORIES.map((cat) => {
            const total = cat.passed + cat.failed
            const pct = Math.round((cat.passed / total) * 100)
            return (
              <Card key={cat.name} className="hover:border-border/80 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <cat.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                    </div>
                    <Badge variant={pct === 100 ? 'success' : pct >= 80 ? 'warning' : 'danger'}>
                      {pct}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct === 100 ? 'bg-success' : pct >= 80 ? 'bg-warning' : 'bg-danger'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      {cat.passed} passed
                    </span>
                    <span className="flex items-center gap-1 text-danger">
                      <XCircle className="h-3 w-3" />
                      {cat.failed} failed
                    </span>
                  </div>

                  {cat.issues.length > 0 && (
                    <div className="space-y-1">
                      {cat.issues.map((issue, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          {issue}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
