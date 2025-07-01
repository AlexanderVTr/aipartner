'use server'
import { supabaseAdmin } from '@/lib/ai/supabase/client'

export async function getCreditsFromDB(userId: string, email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('tokens_balance')
    .eq('clerk_user_id', userId)
    .single()

  if (error) {
    // Create user in the database
    await supabaseAdmin.from('users').insert({
      clerk_user_id: userId,
      email: email,
      tokens_balance: 101,
      created_at: new Date().toISOString(),
    })
    return 101
  }

  return data.tokens_balance
}
