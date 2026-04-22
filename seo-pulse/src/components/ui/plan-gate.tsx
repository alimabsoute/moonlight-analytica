import { usePlan } from '@/hooks/usePlan'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { createCheckoutSession, PRICING_TIERS } from '@/lib/stripe'
import type { ReactNode } from 'react'

interface PlanGateProps {
  require: 'pro' | 'business'
  children: ReactNode
  fallback?: ReactNode
}

export function PlanGate({ require, children, fallback }: PlanGateProps) {
  const { plan, isPro, isBusiness } = usePlan()

  const hasAccess = require === 'pro' ? (isPro || isBusiness) : isBusiness
  if (hasAccess) return <>{children}</>

  if (fallback) return <>{fallback}</>

  const tier = PRICING_TIERS.find(t => t.id === require)!

  async function handleUpgrade() {
    const { url } = await createCheckoutSession(tier.priceId)
    if (url) window.location.href = url
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{tier.name} feature</p>
          <p className="text-sm text-muted-foreground mt-1">Upgrade to {tier.name} to unlock this feature</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Current: {plan}</Badge>
          <Button size="sm" onClick={() => void handleUpgrade()}>Upgrade to {tier.name} — ${tier.price}/mo</Button>
        </div>
      </CardContent>
    </Card>
  )
}
