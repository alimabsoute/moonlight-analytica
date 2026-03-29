import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const HEALTH_SCORE = 87

const ISSUE_SUMMARY = [
  { label: 'Errors', count: 4, icon: AlertCircle, color: 'text-danger', bgColor: 'bg-danger/10' },
  { label: 'Warnings', count: 12, icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10' },
  { label: 'Notices', count: 23, icon: Info, color: 'text-primary', bgColor: 'bg-primary/10' },
]

const AUDIT_CATEGORIES = [
  {
    name: 'Meta Tags',
    icon: FileCode,
    passed: 18,
    failed: 2,
    issues: ['2 pages missing meta descriptions', '1 duplicate title tag'],
  },
  {
    name: 'Headings',
    icon: Heading,
    passed: 24,
    failed: 1,
    issues: ['1 page missing H1 tag'],
  },
  {
    name: 'Images',
    icon: Image,
    passed: 45,
    failed: 6,
    issues: ['4 images missing alt text', '2 oversized images (> 500KB)'],
  },
  {
    name: 'Links',
    icon: Link2,
    passed: 120,
    failed: 3,
    issues: ['2 broken internal links', '1 redirect chain'],
  },
  {
    name: 'Schema',
    icon: Braces,
    passed: 8,
    failed: 2,
    issues: ['Missing Organization schema', 'Invalid FAQ schema on /help'],
  },
  {
    name: 'Core Web Vitals',
    icon: Gauge,
    passed: 3,
    failed: 2,
    issues: ['CLS score above threshold on mobile', 'LCP needs improvement'],
  },
]

function HealthGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (score / 100) * circumference * 0.75 // 270 degree arc
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
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-foreground tabular-nums">{score}</span>
        <span className="text-sm text-muted-foreground -mt-1">out of 100</span>
      </div>
    </div>
  )
}

export function SiteAuditPage() {
  const [auditRun, setAuditRun] = useState(true)

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
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Last run: 2 hours ago
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Re-run Audit
          </Button>
        </div>
      </div>

      {/* Health Score & Issues */}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Health Score Gauge */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <HealthGauge score={HEALTH_SCORE} />
            <div className="mt-4 text-center">
              <p className="text-base font-semibold text-foreground">Site Health Score</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {HEALTH_SCORE >= 80 ? 'Good' : HEALTH_SCORE >= 50 ? 'Needs improvement' : 'Critical'} — {
                  HEALTH_SCORE >= 80
                    ? 'Your site is in good technical health'
                    : 'Several issues need attention'
                }
              </p>
            </div>
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
