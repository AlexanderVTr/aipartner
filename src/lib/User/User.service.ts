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

  // If user not logged in show tokens from local storage
  if (!user) {
    const tokens = TOKENS_PER_PLAN[plan as keyof typeof TOKENS_PER_PLAN]
    localStorage.setItem('tokens', tokens.toString())
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

export async function decrementTokens() {
  const user = await currentUser()
  if (!user) {
    const tokens = localStorage.getItem('tokens')
    localStorage.setItem('tokens', (Number(tokens) - 1).toString())
    return
  }

  const userId = user.id
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('tokens_balance')
    .eq('clerk_user_id', userId)
    .single()

  if (userData) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ tokens_balance: userData.tokens_balance - 1 })
      .eq('clerk_user_id', userId)

    if (error) {
      return
    }
  }
}
