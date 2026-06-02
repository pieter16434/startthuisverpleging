import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-side client met service role key — omzeilt RLS.
// ALLEEN gebruiken in API routes en webhooks, nooit in client components.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
