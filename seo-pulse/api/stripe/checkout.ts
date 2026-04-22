import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { requireEnv } from '../_lib/validate-env'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-04-30.basil',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!requireEnv(res, ['STRIPE_SECRET_KEY'])) return

  try {
    const { priceId, customerEmail, userId } = req.body

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/settings?billing=success`,
      cancel_url: `${req.headers.origin}/settings?billing=cancelled`,
      customer_email: customerEmail ?? undefined,
      metadata: { userId: userId ?? '' },
    })

    return res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
