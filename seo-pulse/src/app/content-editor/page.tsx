import { useState } from 'react'
import {
  Sparkles,
  FileText,
  BookOpen,
  Tag,
  Brain,
  Check,
  AlertTriangle,
  Target,
  Type,
  XCircle,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PLACEHOLDER_CONTENT = `# How to Optimize for AI Search Engines in 2026

AI search optimization is no longer a fringe strategy — it's the new baseline for digital visibility. As platforms like Google's AI Overviews, Perplexity, ChatGPT Search, and Claude integrate generative answers into their core experience, the way content is discovered, evaluated, and surfaced has fundamentally changed. If your SEO strategy still revolves exclusively around traditional blue links, you're already falling behind.

In this guide, we'll break down the practical steps you need to take right now to ensure your content earns visibility in AI-powered search results.

## Why AI Search Engines Demand a Different Approach

Traditional search engine optimization focused on matching keyword queries to indexed pages. AI search engines work differently. They synthesize information across dozens of sources, evaluate factual accuracy, weigh authoritativeness signals, and generate a single consolidated answer. Your content doesn't just need to rank — it needs to be the source that AI models choose to cite.

This shift means topical depth, structured data, and entity coverage matter more than ever. Thin keyword-stuffed pages are essentially invisible to generative search because they lack the substantive information that models use to construct answers.

## Step 1: Build Entity-Rich Content

AI models think in terms of entities, not just keywords. An entity is a clearly defined concept — a person, organization, technology, or topic — that search engines can identify and relate to other entities in a knowledge graph.

To optimize for this, explicitly define key terms in your content. When you write about "retrieval-augmented generation," don't assume the reader (or the model) knows what you mean. Provide a concise definition, link it to related concepts, and use it consistently throughout the article.

Tools like Google's Natural Language API or Caposeo's NLP Entity Coverage panel can show you which entities your content covers well and where you have gaps. Aim for coverage scores above 80% for your primary topic entities.

## Step 2: Structure Content for Extraction

AI search engines don't read your page top to bottom the way humans do. They parse your content looking for discrete, citable chunks of information. Help them by using clear hierarchical headings (H2, H3), bullet points for lists, and concise paragraph openings that state the key point before elaborating.

Schema markup is your secret weapon here. Implementing FAQ schema, HowTo schema, and Article schema gives AI models explicit signals about what your content contains and how it's structured. Pages with proper schema markup are significantly more likely to be cited in AI-generated answers.

## Step 3: Prioritize First-Hand Experience and Expertise

Google's E-E-A-T framework (Experience, Expertise, Authoritativeness, Trustworthiness) has become even more critical in the age of AI search. Models are trained to prefer authoritative, first-hand sources over aggregated or rewritten content.

Include original data, case studies, and expert opinions in your articles. Author bylines with credentials, links to author LinkedIn profiles, and "About the Author" sections all strengthen the expertise signals that AI models evaluate when choosing which sources to cite.

## Step 4: Optimize for Conversational Queries

Users interact with AI search engines conversationally. Instead of typing "best seo tools 2026," they ask "What are the most effective SEO tools for a small business in 2026 and how much do they cost?" Your content needs to anticipate and directly answer these natural-language questions.

Create FAQ sections that mirror real user questions. Use question-based H2 and H3 headings. Write in a natural, direct tone that an AI model can confidently extract and present as a definitive answer.

## Step 5: Invest in Technical Foundations

None of the above matters if AI crawlers can't access your content. Ensure your robots.txt doesn't block AI crawlers like GPTBot or PerplexityBot. Check your Core Web Vitals — pages that load slowly or have layout shift issues are deprioritized by both traditional and AI search systems.

Implement proper canonical tags to avoid duplicate content confusion. Use internal linking strategically to help AI models understand your site's topical architecture and identify your pillar content.

## Step 6: Monitor AI Search Performance

Traditional rank tracking doesn't capture AI search visibility. You need tools that monitor whether your content appears in AI-generated answers, which queries trigger citations of your pages, and how your citation share compares to competitors.

Set up tracking for AI Overview appearances in Google Search Console. Use platforms like Caposeo to monitor your content's entity coverage scores and AI citation likelihood across multiple AI search platforms simultaneously.

## The Bottom Line

Optimizing for AI search engines isn't about abandoning traditional SEO — it's about layering new practices on top of proven fundamentals. Entity-rich, well-structured, authoritative content with strong technical foundations will perform well across both traditional and AI-powered search. The brands that invest in this dual strategy now will compound their advantage as AI search adoption accelerates through 2026 and beyond.

Start with an audit of your existing content: check entity coverage, add schema markup, and restructure your top pages for extractability. These three actions alone can significantly increase your chances of being cited in AI-generated search results.`

const SEO_CHECKS = [
  { label: 'Title length (52 chars — ideal 50-60)', status: 'pass' as const },
  { label: 'Meta description (148 chars — ideal 150-160)', status: 'warn' as const },
  { label: 'H1 tag present and unique', status: 'pass' as const },
  { label: 'H2 subheadings used (6 found)', status: 'pass' as const },
  { label: 'Keyword in first paragraph', status: 'pass' as const },
  { label: 'Image alt tags (0 images — add at least 2)', status: 'fail' as const },
  { label: 'Internal links (1 found — add 2 more)', status: 'warn' as const },
  { label: 'External authority links (0 — add 1-3)', status: 'fail' as const },
  { label: 'Content length (847 words — good)', status: 'pass' as const },
  { label: 'Keyword density (2.1% — ideal 1-3%)', status: 'pass' as const },
  { label: 'Readability (Flesch-Kincaid 62 — Grade B+)', status: 'pass' as const },
  { label: 'Schema markup (none detected)', status: 'fail' as const },
]

const NLP_ENTITIES = [
  { entity: 'Artificial Intelligence', coverage: 92 },
  { entity: 'Search Engine Optimization', coverage: 85 },
  { entity: 'Content Strategy', coverage: 67 },
  { entity: 'Schema Markup', coverage: 74 },
  { entity: 'E-E-A-T Framework', coverage: 81 },
  { entity: 'Knowledge Graph', coverage: 58 },
  { entity: 'Core Web Vitals', coverage: 63 },
  { entity: 'Natural Language Processing', coverage: 49 },
]

const AI_SUGGESTIONS = [
  'Add 2-3 images with descriptive alt text containing your target keyword to improve visual search visibility and break up long text sections.',
  'Include 2-3 external links to authoritative sources (e.g., Google Search Central documentation, research papers) to strengthen E-E-A-T signals.',
  'Your coverage of "Natural Language Processing" is below 50%. Add a paragraph explaining how NLP relates to AI search ranking to improve entity coverage.',
  'Implement Article and FAQ schema markup on this page to increase the likelihood of being cited in AI-generated search answers by up to 40%.',
]

export function ContentEditorPage() {
  const [content, setContent] = useState(PLACEHOLDER_CONTENT)
  const [targetKeyword, setTargetKeyword] = useState('ai search optimization')

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const contentScore = 76
  const readabilityGrade = 'B+ (Flesch-Kincaid 62)'
  const keywordDensity = 2.1

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
                      <XCircle className="h-3 w-3 text-danger" />
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

          {/* AI Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-warning" />
                AI Suggestions
              </CardTitle>
              <CardDescription className="text-xs">
                Actionable recommendations to improve your content score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {AI_SUGGESTIONS.map((suggestion) => (
                <div key={suggestion} className="flex gap-2.5 text-xs text-foreground leading-relaxed">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
