import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Globe, Users, Tags, Plus, X, ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/project'
import { persistProject } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const STEPS = [
  { label: 'Your Website', icon: Globe },
  { label: 'Competitors', icon: Users },
  { label: 'Keywords', icon: Tags },
] as const

const SUGGESTED_KEYWORDS = [
  'seo tools', 'keyword research', 'rank tracking', 'backlink analysis',
  'content optimization', 'site audit', 'competitor analysis', 'serp features',
  'domain authority', 'organic traffic',
]

function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z]{2,})+$/.test(domain.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
}

function cleanDomain(raw: string): string {
  return raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim()
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const addProject = useProjectStore((s) => s.addProject)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)

  const [step, setStep] = useState(0)
  const [domain, setDomain] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [competitors, setCompetitors] = useState<string[]>([''])
  const [keywordText, setKeywordText] = useState('')
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])

  function handleDomainNext() {
    const clean = cleanDomain(domain)
    if (!clean) {
      setDomainError('Please enter your website domain')
      return
    }
    if (!isValidDomain(clean)) {
      setDomainError('Enter a valid domain (e.g. example.com)')
      return
    }
    setDomainError(null)
    setDomain(clean)
    setStep(1)
  }

  function addCompetitor() {
    if (competitors.length < 3) {
      setCompetitors([...competitors, ''])
    }
  }

  function removeCompetitor(index: number) {
    setCompetitors(competitors.filter((_, i) => i !== index))
  }

  function updateCompetitor(index: number, value: string) {
    const updated = [...competitors]
    updated[index] = value
    setCompetitors(updated)
  }

  function toggleSuggestion(kw: string) {
    setSelectedSuggestions((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    )
  }

  async function handleComplete() {
    const parsedKeywords = keywordText
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    const allKeywords = [...new Set([...parsedKeywords, ...selectedSuggestions])]

    const validCompetitors = competitors
      .map(cleanDomain)
      .filter((c) => c && isValidDomain(c))

    const projectData = {
      name: domain,
      domain,
      competitors: validCompetitors,
      trackedKeywords: allKeywords,
    }

    const userId = useAuthStore.getState().user?.id
    let project: { id: string; name: string; domain: string; competitors: string[]; trackedKeywords: string[]; createdAt: string; updatedAt: string }

    try {
      if (userId) {
        project = await persistProject(projectData, userId)
      } else {
        throw new Error('no user')
      }
    } catch (err) {
      console.error('[onboarding] persistProject failed, falling back to local:', err)
      const now = new Date().toISOString()
      project = {
        id: crypto.randomUUID(),
        ...projectData,
        createdAt: now,
        updatedAt: now,
      }
    }

    addProject(project)
    setActiveProject(project.id)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-background">
      {/* Header */}
      <div className="w-full border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 border border-primary/20">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Caposeo</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 w-full">
        <div className="w-full max-w-2xl space-y-10">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-3">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { if (i < step) setStep(i) }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    i === step
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : i < step
                        ? 'bg-success/15 text-success'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <s.icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-8 ${i < step ? 'bg-success/40' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card className="border-border/50">
            <CardContent className="p-8 sm:p-10">
              {/* Step 1: Domain */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Globe className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Enter your website
                    </h2>
                    <p className="text-muted-foreground">
                      We'll start tracking your SEO performance immediately
                    </p>
                  </div>

                  <div className="mx-auto max-w-md space-y-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        https://
                      </span>
                      <Input
                        type="text"
                        placeholder="example.com"
                        className="pl-[72px] h-12 text-base"
                        value={domain}
                        onChange={(e) => { setDomain(e.target.value); setDomainError(null) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleDomainNext() }}
                        autoFocus
                      />
                    </div>
                    {domainError && (
                      <p className="text-sm text-danger">{domainError}</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button size="lg" onClick={handleDomainNext} className="gap-2">
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Competitors */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8b5cf6]/10">
                      <Users className="h-7 w-7 text-[#8b5cf6]" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Add your competitors
                    </h2>
                    <p className="text-muted-foreground">
                      Track up to 3 competitor domains to compare performance
                    </p>
                  </div>

                  <div className="mx-auto max-w-md space-y-3">
                    {competitors.map((comp, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                          {i + 1}
                        </span>
                        <Input
                          type="text"
                          placeholder="competitor.com"
                          value={comp}
                          onChange={(e) => updateCompetitor(i, e.target.value)}
                          className="h-11"
                        />
                        {competitors.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompetitor(i)}
                            className="shrink-0 text-muted-foreground hover:text-danger"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {competitors.length < 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addCompetitor}
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add competitor
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" size="lg" onClick={() => setStep(0)} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button size="lg" onClick={() => setStep(2)} className="gap-2">
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Keywords */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                      <Tags className="h-7 w-7 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Track your first keywords
                    </h2>
                    <p className="text-muted-foreground">
                      Enter keywords separated by commas, or select from popular suggestions
                    </p>
                  </div>

                  <div className="mx-auto max-w-md space-y-4">
                    <textarea
                      placeholder="e.g., seo tools, keyword research, rank tracking..."
                      className="flex min-h-[120px] w-full rounded-md border border-border bg-input px-3 py-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      value={keywordText}
                      onChange={(e) => setKeywordText(e.target.value)}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        Popular keywords
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_KEYWORDS.map((kw) => (
                          <button
                            type="button"
                            key={kw}
                            onClick={() => toggleSuggestion(kw)}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                              selectedSuggestions.includes(kw)
                                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {selectedSuggestions.includes(kw) && (
                              <Check className="h-3 w-3" />
                            )}
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(keywordText || selectedSuggestions.length > 0) && (
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          {[
                            ...keywordText.split(',').map((k) => k.trim()).filter(Boolean),
                            ...selectedSuggestions,
                          ].filter((v, i, a) => a.indexOf(v) === i).length}{' '}
                          keywords selected
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" size="lg" onClick={() => setStep(1)} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button size="lg" onClick={handleComplete} className="gap-2">
                      Launch Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skip option */}
          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="hover:text-foreground transition-colors"
            >
              Skip setup for now
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
