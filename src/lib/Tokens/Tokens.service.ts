'use server'
import { TOKENS_PER_PLAN } from '@/constants/chat'
import { supabaseAdmin } from '@/lib/ai/supabase/client'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function getTokensFromDB() {
  const user = await currentUser()
  const { has } = await auth()

  const isPro = has({ feature: 'pro_tokens' })
  const isPremium = has({ feature: 'premium_tokens' })
  const plan = isPro ? 'pro' : isPremium ? 'premium' : 'free'

  // If user not logged free tokens
  if (!user) {
    const tokens = TOKENS_PER_PLAN[plan as keyof typeof TOKENS_PER_PLAN]
    return tokens
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('tokens_balance')
    .eq('clerk_user_id', user.id)
    .single()

  if (error) {
    // Create user in the database
    const tokens = TOKENS_PER_PLAN[plan as keyof typeof TOKENS_PER_PLAN]

    await supabaseAdmin.from('users').insert({
      clerk_user_id: user.id,
      email: user.emailAddresses[0].emailAddress,
      tokens_balance: tokens,
      created_at: new Date().toISOString(),
    })
    return tokens
  }

  return data.tokens_balance
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
      .update({ tokens_balance: data.tokens_balance - 1 })
      .eq('clerk_user_id', user.id)

    if (error) return
  }
}

export async function resetTokensForPlan(newPlan: 'free' | 'pro' | 'premium') {
  const user = await currentUser()
  if (!user) return

  const newTokens = TOKENS_PER_PLAN[newPlan]

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      tokens_balance: newTokens,
      // updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', user.id)

  if (error) {
    console.error('Error resetting tokens:', error)
    throw error
  }

  return newTokens
}
