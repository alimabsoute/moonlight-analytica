import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2025-04-30.basil' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

function planFromPriceId(priceId: string): 'free' | 'pro' | 'business' {
  if (priceId === 'price_pro_monthly') return 'pro'
  if (priceId === 'price_business_monthly') return 'business'
  return 'free'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    const rawBody = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    return res.status(400).json({ error: 'Webhook signature invalid' })
  }

  const userId = (event.data.object as { metadata?: { userId?: string } }).metadata?.userId ?? ''

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? ''
    const sub = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null
    const priceId = sub?.items?.data?.[0]?.price?.id ?? ''
    const plan = planFromPriceId(priceId)

    if (userId) {
      await supabase.from('user_profiles').upsert({
        id: userId,
        plan,
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : '',
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
        plan_updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    if (userId) {
      await supabase.from('user_profiles').update({ plan: 'free', subscription_status: 'cancelled', plan_updated_at: new Date().toISOString() }).eq('id', userId)
    }
  }

  return res.status(200).json({ received: true })
}
