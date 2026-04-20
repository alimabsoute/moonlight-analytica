import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')

    if (!code) {
      navigate('/login?error=no_code', { replace: true })
      return
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          navigate('/login?error=auth_failed', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      })
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
