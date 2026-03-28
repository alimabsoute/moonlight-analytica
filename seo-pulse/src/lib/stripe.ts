import { loadStripe, type Stripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string

if (!publishableKey) {
  console.warn('[stripe] Missing VITE_STRIPE_PUBLISHABLE_KEY env var')
}

// ─── Types ───────────────────────────────────────────────────────────

export interface PricingTier {
  id: string
  name: string
  price: number
  priceId: string
  features: string[]
}

// ─── Pricing Tiers ───────────────────────────────────────────────────

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: '',
    features: [
      'Track up to 10 keywords',
      'Weekly rank tracking',
      'Basic on-page SEO audit',
      'Single domain monitoring',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceId: 'price_pro_monthly',
    features: [
      'Track up to 500 keywords',
      'Daily rank tracking',
      'Full on-page & technical SEO audit',
      'Competitor analysis (3 competitors)',
      'AI-powered content briefs',
      'Backlink monitoring',
      'SERP feature tracking',
      'Google Search Console integration',
      'CSV & PDF report exports',
      'Email support with 24h response',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 79,
    priceId: 'price_business_monthly',
    features: [
      'Track up to 5,000 keywords',
      'Real-time rank tracking',
      'Unlimited SEO audits with auto-scheduling',
      'Competitor analysis (10 competitors)',
      'AI content briefs & optimization scoring',
      'Full backlink audit & disavow file generation',
      'SERP feature & rich snippet tracking',
      'Google Search Console + Analytics integration',
      'White-label PDF reports',
      'Content gap & keyword cannibalization analysis',
      'API access',
      'Team collaboration (up to 5 seats)',
      'Priority support with dedicated account manager',
    ],
  },
]

// ─── Stripe Instance (lazy-loaded singleton) ─────────────────────────

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Lazy-load and return the Stripe.js instance.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey ?? '')
  }
  return stripePromise
}

// ─── Checkout & Portal ───────────────────────────────────────────────

/**
 * Create a Stripe Checkout session and redirect the user.
 */
export async function createCheckoutSession(priceId: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Checkout failed (${res.status})`)
    }

    const data = (await res.json()) as { url: string }
    return { url: data.url, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    console.error('[stripe] createCheckoutSession:', message)
    return { url: null, error: message }
  }
}

/**
 * Create a Stripe Customer Portal session and redirect the user.
 */
export async function createPortalSession(): Promise<{ url: string | null; error: string | null }> {
  try {
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        returnUrl: `${window.location.origin}/billing`,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Portal failed (${res.status})`)
    }

    const data = (await res.json()) as { url: string }
    return { url: data.url, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session'
    console.error('[stripe] createPortalSession:', message)
    return { url: null, error: message }
  }
}
