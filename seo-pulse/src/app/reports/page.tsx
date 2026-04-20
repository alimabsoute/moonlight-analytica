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
  Eye,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDomainKeywords } from '@/lib/data-for-seo'
import { useProjectStore } from '@/stores/project'
import { toast } from '@/components/ui/toast'

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
  format: 'PDF' | 'CSV'
  createdAt: string
  relativeTime: string
  status: 'completed' | 'generating' | 'failed'
  size: string
}

const DEMO_REPORTS: PastReport[] = [
  {
    id: '1',
    name: 'Monthly SEO Performance — March 2026',
    type: 'Full SEO Audit',
    format: 'PDF',
    createdAt: '2026-03-27',
    relativeTime: '2 days ago',
    status: 'completed',
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Competitor Analysis Q1 2026',
    type: 'Competitor Analysis',
    format: 'PDF',
    createdAt: '2026-03-22',
    relativeTime: '1 week ago',
    status: 'completed',
    size: '3.1 MB',
  },
  {
    id: '3',
    name: 'Keyword Rankings Export',
    type: 'Keyword Rankings',
    format: 'CSV',
    createdAt: '2026-03-26',
    relativeTime: '3 days ago',
    status: 'completed',
    size: '840 KB',
  },
  {
    id: '4',
    name: 'Technical Audit Report',
    type: 'Full SEO Audit',
    format: 'PDF',
    createdAt: '2026-03-24',
    relativeTime: '5 days ago',
    status: 'completed',
    size: '1.8 MB',
  },
  {
    id: '5',
    name: 'Content Performance Review',
    type: 'Content Performance',
    format: 'PDF',
    createdAt: '2026-03-15',
    relativeTime: '2 weeks ago',
    status: 'completed',
    size: '2.1 MB',
  },
]

export function ReportsPage() {
  const [reports, setReports] = useState<PastReport[]>(DEMO_REPORTS)
  const [generating, setGenerating] = useState<string | null>(null)
  const activeProject = useProjectStore((s) => s.activeProject)

  function addReport(r: PastReport) {
    setReports((prev) => [r, ...prev])
  }

  async function handleGenerate(typeId: string) {
    if (typeId === 'keyword-rankings') {
      setGenerating('keyword-rankings')
      try {
        const domain = activeProject?.domain
        if (!domain) return

        const keywords = await getDomainKeywords(domain, 500)

        const header = 'Keyword,Search Volume,Difficulty,CPC,Competition,SERP Features'
        const rows = keywords.map((k) =>
          [
            k.keyword,
            k.searchVolume,
            k.difficulty,
            k.cpc.toFixed(2),
            k.competition.toFixed(2),
            k.serpFeatures.join(';'),
          ].join(',')
        )
        const csv = [header, ...rows].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `keywords-${domain}-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast('Keyword rankings exported!', 'success')

        addReport({
          id: crypto.randomUUID(),
          name: `Keyword Rankings — ${domain}`,
          type: 'Keyword Rankings',
          format: 'CSV',
          createdAt: new Date().toISOString().split('T')[0],
          relativeTime: 'just now',
          status: 'completed',
          size: `${Math.round(csv.length / 1024)} KB`,
        })
      } finally {
        setGenerating(null)
      }
    } else {
      console.log('[reports] Generate report:', typeId)
    }
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
                  disabled={!activeProject || generating === type.id}
                  title={!activeProject ? 'Add a project first' : undefined}
                >
                  {generating === type.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5" />
                      Generate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Reports */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Previous Reports</h2>

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
                      {report.format === 'CSV' ? (
                        <FileSpreadsheet className="h-4 w-4 text-success" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{report.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{report.type}</Badge>
                        <Badge variant={report.format === 'CSV' ? 'success' : 'default'} className="text-[10px]">
                          {report.format}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{report.size}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {report.relativeTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {report.status === 'completed' && (
                      <>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </>
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
      </div>
    </div>
  )
}
