import { StrictMode, Component, useEffect } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/stores/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import './index.css'

function mapUser(u: SupabaseUser): User {
  return {
    id: u.id,
    email: u.email ?? '',
    fullName: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? 'User',
    avatarUrl: u.user_metadata?.avatar_url ?? null,
    plan: 'free',
    createdAt: u.created_at,
  }
}

function AuthInitializer({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { setUser, setSession, initialize, logout } = useAuthStore.getState()

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser(mapUser(data.session.user))
        setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      }
      initialize()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(mapUser(session.user))
        setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })
        initialize()
      } else if (event === 'SIGNED_OUT') {
        logout()
        initialize()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}

// Global error boundary so crashes never produce a blank page
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui', color: '#fff', background: '#09090b', minHeight: '100vh' }}>
          <h1 style={{ color: '#ef4444', fontSize: 24, marginBottom: 16 }}>Something went wrong</h1>
          <pre style={{ color: '#f59e0b', fontSize: 14, whiteSpace: 'pre-wrap', background: '#18181b', padding: 16, borderRadius: 8 }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Something went wrong'
        if (!message.includes('Rate limit')) {
          toast(message, 'error')
        }
      },
    },
  },
})

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'observerResultsUpdated' && event.query.state.status === 'error') {
    const error = event.query.state.error
    const message = error instanceof Error ? error.message : 'Failed to load data'
    if (!message.includes('Rate limit') && !message.includes('credentials not configured')) {
      toast(message, 'error', 5000)
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthInitializer>
            <App />
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
