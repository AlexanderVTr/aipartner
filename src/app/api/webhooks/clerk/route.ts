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
        await handleSubscriptionChange(data.payer_id!, data)
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

// TODO: Implement proper payer_id to clerk_user_id mapping
// This is a placeholder function until we have the proper mapping
async function getClerkUserIdFromPayerId(
  payerId: string,
): Promise<string | null> {
  // For now, we'll need to either:
  // 1. Store payer_id in our database when user creates subscription
  // 2. Use Clerk's API to fetch user data
  // 3. Ask user to provide mapping

  console.log('Attempting to map payer_id to clerk_user_id:', payerId)

  // Placeholder: return null for now
  return null
}

async function handleSubscriptionChange(
  payerId: string,
  data: ClerkWebhookEvent['data'],
) {
  console.log('Processing subscription change for payer:', payerId)

  // Find active or upcoming subscription item
  const activeItem = data.items?.find(
    (item) => item.status === 'active' || item.status === 'upcoming',
  )

  if (!activeItem) {
    console.log('No active/upcoming subscription found, setting to free plan')
    console.log(
      'Available items:',
      data.items?.map((item) => `${item.plan.slug}: ${item.status}`),
    )

    // Try to get clerk_user_id and reset to free plan
    const clerkUserId = await getClerkUserIdFromPayerId(payerId)
    if (clerkUserId) {
      await resetTokensForPlan(clerkUserId, 'free')
      console.log('Tokens reset to free plan for user:', clerkUserId)
    }
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

  console.log(
    `Plan detected: ${newPlan} (from slug: ${planSlug}, status: ${activeItem.status})`,
  )

  // Map payer_id to clerk_user_id
  const clerkUserId = await getClerkUserIdFromPayerId(payerId)

  if (!clerkUserId) {
    console.error('Could not map payer_id to clerk_user_id:', payerId)
    return
  }

  console.log('Mapped to clerk_user_id:', clerkUserId)

  // Reset tokens to new plan amount
  await resetTokensForPlan(clerkUserId, newPlan)
  console.log(`Tokens reset to ${newPlan} plan for user:`, clerkUserId)
}
