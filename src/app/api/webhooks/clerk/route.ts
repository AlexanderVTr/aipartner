import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { resetTokensForPlan } from '@/lib/Tokens/Tokens.service'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    object: string
    payer_id?: string
    status?: string
    items?: Array<{
      id: string
      status: string
      plan: {
        slug: string
        name: string
        amount: number
      }
    }>
    // Common fields
    created_at: number
    updated_at: number
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headerPayload = await headers()

  // Debug: Log all headers
  console.log('All headers:', Object.fromEntries(headerPayload.entries()))

  // Check if webhook secret is configured
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    )
  }

  // Clerk uses svix headers for webhook validation
  const svixSignature = headerPayload.get('svix-signature')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixId = headerPayload.get('svix-id')

  // For now, let's skip validation and add logging
  // TODO: Add proper svix validation later
  console.log('Clerk webhook received:')
  console.log('- svix-signature:', svixSignature)
  console.log('- svix-timestamp:', svixTimestamp)
  console.log('- svix-id:', svixId)
  console.log('- webhook secret configured:', !!WEBHOOK_SECRET)

  let evt: ClerkWebhookEvent

  try {
    evt = JSON.parse(body)
  } catch (err) {
    console.error('Error parsing webhook body:', err)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { type, data } = evt
  console.log('Webhook event:', type)
  console.log('Full webhook data:', JSON.stringify(data, null, 2))

  try {
    switch (type) {
      case 'subscription.updated':
        await handleSubscriptionChange(data)
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

async function handleSubscriptionChange(data: ClerkWebhookEvent['data']) {
  // Find active or upcoming subscription item
  const activeItem = data.items?.find(
    (item) => item.status === 'active' || item.status === 'upcoming',
  )

  if (!activeItem) {
    return
  }

  // Determine plan based on plan slug
  const planSlug = activeItem.plan.slug
  let newPlan: 'free' | 'pro' | 'premium' = 'free'

  if (planSlug === 'pro') {
    newPlan = 'pro'
  } else if (planSlug === 'premium') {
    newPlan = 'premium'
  }

  // Reset tokens to new plan amount
  await resetTokensForPlan(newPlan)
}
