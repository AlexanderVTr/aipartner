'use server'
import { supabaseAdmin } from '../ai/supabase/client'
import { currentUser } from '@clerk/nextjs/server'

export async function saveMessageToDB(message: string, role: string) {
  const user = await currentUser()

  console.log('User', user)
  if (!user) return

  console.log('User', user)
  const { error } = await supabaseAdmin.from('messages').insert({
    user_id: user.id,
    role: role,
    content: message,
    created_at: new Date().toISOString(),
  })
  console.log('message', message)
  console.log('role', role)

  if (error) return
}
