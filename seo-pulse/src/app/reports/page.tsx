import { useState } from 'react'
import {
  FileText,
  Download,
  Plus,
  ShieldCheck,
  BarChart3,
  Target,
  FileBarChart,
  Settings2,
  Clock,
  ChevronRight,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ReportType {
  id: string
  name: string
  description: string
  icon: typeof FileText
  color: string
  bgColor: string
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'full-audit',
    name: 'Full SEO Audit',
    description: 'Comprehensive analysis of your site\'s technical SEO, content quality, and competitive positioning.',
    icon: ShieldCheck,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'keyword-rankings',
    name: 'Keyword Rankings',
    description: 'Detailed ranking report for all tracked keywords with position changes, visibility, and trends.',
    icon: BarChart3,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'competitor-analysis',
    name: 'Competitor Analysis',
    description: 'Side-by-side comparison with competitors — traffic, keywords, backlinks, and content gaps.',
    icon: Target,
    color: 'text-[#8b5cf6]',
    bgColor: 'bg-[#8b5cf6]/10',
  },
  {
    id: 'content-performance',
    name: 'Content Performance',
    description: 'Analyze which content is driving traffic, rankings, and conversions. Identify underperforming pages.',
    icon: FileBarChart,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'custom-report',
    name: 'Custom Report',
    description: 'Build a custom report by selecting specific metrics, date ranges, and sections to include.',
    icon: Settings2,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
]

interface PastReport {
  id: string
  name: string
  type: string
  createdAt: string
  status: 'completed' | 'generating' | 'failed'
}

const DEMO_REPORTS: PastReport[] = [] // Empty for initial state

export function ReportsPage() {
  const [reports] = useState<PastReport[]>(DEMO_REPORTS)

  function handleGenerate(typeId: string) {
    console.log('[reports] Generate report:', typeId)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate comprehensive SEO reports to share with your team or clients
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Generate Report
        </Button>
      </div>

      {/* Report Types */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Report Types</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((type) => (
            <Card key={type.id} className="group hover:border-border/80 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${type.bgColor}`}>
                    <type.icon className={`h-5 w-5 ${type.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{type.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 gap-1.5 group-hover:bg-muted/50"
                  onClick={() => handleGenerate(type.id)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Generate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Reports */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Previous Reports</h2>

        {reports.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No reports generated yet</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Select a report type above to generate your first SEO report.
                Reports are saved here for easy access and sharing.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{report.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">{report.type}</Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {report.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {report.status === 'completed' && (
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      )}
                      {report.status === 'generating' && (
                        <Badge variant="secondary" className="gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          Generating...
                        </Badge>
                      )}
                      {report.status === 'failed' && (
                        <Badge variant="danger">Failed</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
