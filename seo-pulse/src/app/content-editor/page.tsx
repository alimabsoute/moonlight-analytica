import { useState } from 'react'
import {
  Sparkles,
  FileText,
  BarChart3,
  BookOpen,
  Tag,
  Brain,
  Check,
  AlertTriangle,
  Target,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const PLACEHOLDER_CONTENT = `# How to Improve Your Website's SEO in 2026

Search engine optimization continues to evolve rapidly. In this comprehensive guide, we'll explore the most effective strategies for improving your website's search visibility.

## Understanding Modern SEO

The landscape of SEO has shifted dramatically with the rise of AI-powered search engines. Google's Search Generative Experience (SGE) and other AI features have changed how results are displayed and consumed.

## Key Strategies

### 1. Focus on E-E-A-T
Experience, Expertise, Authoritativeness, and Trustworthiness remain critical ranking factors. Ensure your content demonstrates real-world experience and expertise.

### 2. Optimize for Core Web Vitals
Page performance directly impacts rankings. Focus on LCP, INP, and CLS metrics to ensure a smooth user experience.

### 3. Create Comprehensive Content
Long-form, in-depth content that thoroughly covers a topic continues to outperform thin content. Aim for content that answers all related questions.`

const SEO_CHECKS = [
  { label: 'Title tag present', status: 'pass' as const },
  { label: 'Meta description length', status: 'pass' as const },
  { label: 'H1 tag present', status: 'pass' as const },
  { label: 'Keyword in first paragraph', status: 'pass' as const },
  { label: 'Internal links (3+)', status: 'warn' as const },
  { label: 'External authority links', status: 'fail' as const },
  { label: 'Image alt text', status: 'warn' as const },
  { label: 'Schema markup', status: 'fail' as const },
]

const NLP_ENTITIES = [
  { entity: 'Search Engine Optimization', coverage: 92 },
  { entity: 'Core Web Vitals', coverage: 78 },
  { entity: 'E-E-A-T', coverage: 85 },
  { entity: 'Content Strategy', coverage: 64 },
  { entity: 'User Experience', coverage: 71 },
  { entity: 'AI Search', coverage: 45 },
]

export function ContentEditorPage() {
  const [content, setContent] = useState(PLACEHOLDER_CONTENT)
  const [targetKeyword, setTargetKeyword] = useState('improve website seo')

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const contentScore = 72
  const readabilityGrade = 'B+'
  const keywordDensity = 1.8

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-danger'
  }

  function getScoreBg(score: number) {
    if (score >= 80) return 'bg-success'
    if (score >= 60) return 'bg-warning'
    return 'bg-danger'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write and optimize content with real-time SEO scoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">Save Draft</Button>
          <Button size="sm" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Analyze with AI
          </Button>
        </div>
      </div>

      {/* Target Keyword Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground shrink-0">
              <Target className="h-4 w-4 text-primary" />
              Target Keyword:
            </div>
            <Input
              type="text"
              placeholder="Enter target keyword..."
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Split Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Editor */}
        <Card className="min-h-[600px]">
          <CardContent className="p-0">
            <textarea
              className="w-full min-h-[600px] resize-none rounded-xl bg-card p-6 text-sm text-foreground leading-relaxed font-mono placeholder:text-muted-foreground focus:outline-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your content..."
            />
          </CardContent>
        </Card>

        {/* SEO Scoring Panel */}
        <div className="space-y-4">
          {/* Content Score */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Content Score</p>
                <Badge variant={contentScore >= 80 ? 'success' : contentScore >= 60 ? 'warning' : 'danger'}>
                  {contentScore >= 80 ? 'Good' : contentScore >= 60 ? 'Fair' : 'Needs Work'}
                </Badge>
              </div>
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-bold tabular-nums ${getScoreColor(contentScore)}`}>
                  {contentScore}
                </span>
                <span className="text-lg text-muted-foreground mb-1">/100</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getScoreBg(contentScore)}`}
                  style={{ width: `${contentScore}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Type className="h-3 w-3" />
                    Word Count
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">{wordCount}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    Readability
                  </div>
                  <p className="text-xl font-bold text-foreground">{readabilityGrade}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    KW Density
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">{keywordDensity}%</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Reading Time
                  </div>
                  <p className="text-xl font-bold text-foreground">{Math.ceil(wordCount / 200)} min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Checks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">SEO Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SEO_CHECKS.map((check) => (
                <div key={check.label} className="flex items-center gap-2.5">
                  {check.status === 'pass' && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                  )}
                  {check.status === 'warn' && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/15">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                    </div>
                  )}
                  {check.status === 'fail' && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/15">
                      <AlertTriangle className="h-3 w-3 text-danger" />
                    </div>
                  )}
                  <span className="text-xs text-foreground">{check.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* NLP Entity Coverage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-primary" />
                NLP Entity Coverage
              </CardTitle>
              <CardDescription className="text-xs">
                How well your content covers key entities related to your topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {NLP_ENTITIES.map((entity) => (
                <div key={entity.entity} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{entity.entity}</span>
                    <span className={`font-medium tabular-nums ${
                      entity.coverage >= 80 ? 'text-success' : entity.coverage >= 60 ? 'text-warning' : 'text-danger'
                    }`}>
                      {entity.coverage}%
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        entity.coverage >= 80 ? 'bg-success' : entity.coverage >= 60 ? 'bg-warning' : 'bg-danger'
                      }`}
                      style={{ width: `${entity.coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
