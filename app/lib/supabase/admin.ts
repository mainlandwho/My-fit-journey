import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 *
 * Only ever import this in server-only code that never runs in the browser:
 * - Route Handlers under app/api/**
 * - Stripe webhook handler
 * - Cron / scheduled functions
 *
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
