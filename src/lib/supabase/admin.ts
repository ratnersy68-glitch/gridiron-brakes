import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for the narrow set of writes a student's own session
 * must never be allowed to make directly via RLS — e.g. inserting the
 * auto-computed grade rows when they submit an assignment. Only call this
 * after independently verifying (with the user's own RLS-respecting client)
 * that the action being performed is one they're actually allowed to trigger;
 * never pass client-supplied values straight through to it.
 */
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
