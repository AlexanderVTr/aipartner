'use server'
import {
  TOKENS_PER_PLAN,
  VIDEO_CALL_TOKENS_PER_MINUTE,
} from '@/constants/chat'
import { supabaseAdmin } from '@/lib/ai/supabase/client'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function getTokensFromDB() {
  const user = await currentUser()
  const { has } = await auth()

  const isPro = has({ feature: 'pro_tokens' })
  const isPremium = has({ feature: 'premium_tokens' })
  const isDemo = has({ feature: 'unlimited' })
  const plan = isPro ? 'pro' : isPremium ? 'premium' : isDemo ? 'demo' : 'free'

  // If user not logged in, return free tokens
  if (!user) {
    const tokens = TOKENS_PER_PLAN[plan as keyof typeof TOKENS_PER_PLAN]
    return tokens
  }

  const userEmail = user.emailAddresses[0]?.emailAddress
  if (!userEmail) {
    console.error('User has no email address')
    return TOKENS_PER_PLAN.free
  }

  // Try to find user by clerk_user_id first
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, tokens_balance, plan')
    .eq('clerk_user_id', user.id)
    .single()

  if (!error && data) {
    // User found by clerk_user_id
    // Only update plan if upgrading, never downgrade on refresh
    if (data.plan !== plan) {
      const planHierarchy = { free: 0, pro: 1, premium: 2, demo: 3 }
      const currentPlanLevel =
        planHierarchy[data.plan as keyof typeof planHierarchy] ?? 0
      const newPlanLevel =
        planHierarchy[plan as keyof typeof planHierarchy] ?? 0

      // Only reset tokens if upgrading to a better plan
      if (newPlanLevel > currentPlanLevel) {
        const tokens = await resetTokensForPlan(plan)
        return tokens
      }
      // If downgrading or same level, keep existing tokens and plan
    }
    return data.tokens_balance
  }

  // User not found by clerk_user_id - check if user exists with same email
  // This handles the case where user deleted and recreated their Clerk account
  const { data: existingUser, error: emailError } = await supabaseAdmin
    .from('users')
    .select('id, tokens_balance, plan')
    .eq('email', userEmail)
    .maybeSingle()

  if (existingUser && !emailError) {
    // User exists with same email but different clerk_user_id
    // Update clerk_user_id and preserve existing tokens/plan unless upgrading
    const currentTokens = existingUser.tokens_balance || TOKENS_PER_PLAN.free
    const currentPlan = existingUser.plan || 'free'

    // Only reset tokens if upgrading to a better plan
    const planHierarchy = { free: 0, pro: 1, premium: 2, demo: 3 }
    const shouldResetTokens =
      planHierarchy[plan as keyof typeof planHierarchy] >
      planHierarchy[currentPlan as keyof typeof planHierarchy]

    const tokens = shouldResetTokens
      ? TOKENS_PER_PLAN[plan as keyof typeof TOKENS_PER_PLAN]
      : currentTokens
    const finalPlan = shouldResetTokens ? plan : currentPlan

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        clerk_user_id: user.id,
        tokens_balance: tokens,
        plan: finalPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id)

    if (updateError) {
      console.error('Error updating user clerk_user_id:', updateError)
      return TOKENS_PER_PLAN[plan as keyof typeof TOKENS_PER_PLAN]
    }

    return tokens
  }

  // No existing user found - create new user
  const tokens = TOKENS_PER_PLAN[plan as keyof typeof TOKENS_PER_PLAN]

  const { error: insertError } = await supabaseAdmin.from('users').insert({
    clerk_user_id: user.id,
    email: userEmail,
    tokens_balance: tokens,
    plan: plan,
    created_at: new Date().toISOString(),
  })

  if (insertError) {
    console.error('Error creating user:', insertError)
    return TOKENS_PER_PLAN[plan as keyof typeof TOKENS_PER_PLAN]
  }

  return tokens
}

export async function decrementTokensDB() {
  const user = await currentUser()
  if (!user) return

  const { data } = await supabaseAdmin
    .from('users')
    .select('tokens_balance')
    .eq('clerk_user_id', user.id)
    .single()

  if (data) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        tokens_balance: data.tokens_balance - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', user.id)

    if (error) return
  }
}

export async function deductVideoCallTokens(
  callDurationMinutes: number,
): Promise<number> {
  const user = await currentUser()
  if (!user) return 0

  const { data } = await supabaseAdmin
    .from('users')
    .select('tokens_balance')
    .eq('clerk_user_id', user.id)
    .single()

  if (!data) return 0

  const currentBalance = data.tokens_balance ?? 0
  const tokensToDeduct =
    Math.ceil(callDurationMinutes) * VIDEO_CALL_TOKENS_PER_MINUTE
  const newBalance = Math.max(0, currentBalance - tokensToDeduct)

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      tokens_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', user.id)

  if (error) {
    console.error('Error deducting video call tokens:', error)
    return currentBalance
  }

  return newBalance
}

export async function resetTokensForPlan(
  newPlan: 'free' | 'pro' | 'premium' | 'demo',
) {
  const user = await currentUser()
  if (!user) return

  const newTokens = TOKENS_PER_PLAN[newPlan]

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      tokens_balance: newTokens,
      plan: newPlan,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', user.id)

  if (error) {
    console.error('Error resetting tokens:', error)
    throw error
  }

  return newTokens
}
