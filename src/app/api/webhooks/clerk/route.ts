import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { resetTokensForPlan } from '@/lib/Tokens/Tokens.service'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    object: string
    user_id?: string
    // For subscription events
    status?: string
    plan?: string
    features?: string[]
    subscription?: {
      status: string
      plan: string
      features: string[]
    }
    // For user events
    email_addresses?: Array<{
      email_address: string
      id: string
    }>
    // Common fields
    created_at: number
    updated_at: number
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headerPayload = await headers()

  // Check if webhook secret is configured
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  // Basic webhook validation (можно добавить svix позже)
  const webhookSecret = headerPayload.get('clerk-webhook-secret')
  if (webhookSecret !== WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Invalid webhook secret' },
      { status: 401 },
    )
  }

  let evt: ClerkWebhookEvent

  try {
    evt = JSON.parse(body)
  } catch (err) {
    console.error('Error parsing webhook body:', err)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { type, data } = evt
  console.log('Webhook event:', type, data)

  try {
    switch (type) {
      case 'subscription.updated':
        await handleSubscriptionChange(data.user_id!, data)
        break
      default:
        console.log('Unhandled event type:', type)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 },
    )
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionChange(
  userId: string,
  data: ClerkWebhookEvent['data'],
) {
  console.log('Processing subscription change for user:', userId)

  // Get current user plan features from subscription event
  // Features can be directly in data or in data.subscription
  const features = data.features || data.subscription?.features || []

  // Determine new plan based on features
  const isPro = features.includes('pro_tokens')
  const isPremium = features.includes('premium_tokens')
  const newPlan = isPro ? 'pro' : isPremium ? 'premium' : 'free'

  console.log(`Plan detected: ${newPlan}, Features:`, features)

  // Reset tokens to new plan amount
  await resetTokensForPlan(userId, newPlan)
}
