import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-04-30.basil',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { customerId } = req.body

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/settings`,
    })

    return res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return res.status(500).json({ error: 'Failed to create portal session' })
  }
}
