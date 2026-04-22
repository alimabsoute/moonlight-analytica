import { useAuthStore } from '@/stores/auth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProfile } from '@/lib/supabase'

export function usePlan() {
  const user = useAuthStore(s => s.user)

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const plan = profile?.plan ?? user?.plan ?? 'free'

  return {
    plan,
    isPro: plan === 'pro' || plan === 'business',
    isBusiness: plan === 'business',
    isFree: plan === 'free',
    canTrackKeywords: (count: number) => {
      if (plan === 'business') return count <= 5000
      if (plan === 'pro') return count <= 500
      return count <= 10
    },
  }
}
