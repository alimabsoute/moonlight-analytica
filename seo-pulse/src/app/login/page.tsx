import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, BarChart3, TrendingUp, Zap, Eye, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/supabase'

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Real-Time Rank Tracking',
    description: 'Monitor keyword positions across 200+ countries with hourly updates',
  },
  {
    icon: BarChart3,
    title: 'Competitive Intelligence',
    description: 'Uncover competitor strategies, keyword gaps, and content opportunities',
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    description: 'Claude-driven content scoring, trend prediction, and SERP analysis',
  },
  {
    icon: Eye,
    title: 'Pulse Lab',
    description: 'Proprietary trend velocity engine — spot opportunities before competitors',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'login') {
        const result = await signInWithEmail(email, password)
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.user) {
          setUser({
            id: result.user.id,
            email: result.user.email ?? email,
            fullName: result.user.user_metadata?.full_name ?? email.split('@')[0],
            avatarUrl: result.user.user_metadata?.avatar_url ?? null,
            plan: 'free',
            createdAt: result.user.created_at,
          })
          setLoading(false)
          navigate('/dashboard')
        }
      } else {
        const result = await signUpWithEmail(email, password)
        if (result.error) {
          setError(result.error)
          return
        }
        if (result.user) {
          setUser({
            id: result.user.id,
            email: result.user.email ?? email,
            fullName: fullName || email.split('@')[0],
            avatarUrl: null,
            plan: 'free',
            createdAt: result.user.created_at,
          })
          setLoading(false)
          navigate('/onboarding')
        }
      }
    } catch (err) {
      console.log('[login] Submit error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.log('[login] Google auth error:', err)
      setError('Google sign-in is not configured yet.')
    }
  }

  async function handleDevBypass() {
    setUser({
      id: 'dev-user',
      email: 'dev@caposeo.local',
      fullName: 'Dev User',
      avatarUrl: null,
      plan: 'pro',
      createdAt: new Date().toISOString(),
    })
    await useProjectStore.getState().loadFromDB('dev-user')
    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-dvh">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0d1333] to-[#0a1628]">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-[#8b5cf6]/15 blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Caposeo</span>
          </div>

          {/* Hero */}
          <div className="max-w-lg space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white leading-tight">
                AI-Powered
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#8b5cf6]">
                  SEO Intelligence
                </span>
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed">
                The all-in-one platform that combines real-time rank tracking, competitive analysis,
                and AI-driven insights to dominate search rankings.
              </p>
            </div>

            <div className="space-y-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-zinc-600">
            Trusted by 2,400+ SEO professionals and agencies worldwide.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/20">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Caposeo</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Sign in to access your SEO dashboard'
                : 'Start your 14-day free trial — no credit card required'}
            </p>
          </div>

          {/* Google OAuth */}
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-3"
            onClick={handleGoogle}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="fullName">
                  Full name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder={mode === 'register' ? 'Min 8 characters' : ''}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 8 : undefined}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={handleDevBypass}
            >
              Skip sign-in (dev) →
            </Button>
          )}

          {/* Toggle mode */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null) }}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null) }}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
