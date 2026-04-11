// DB-backed rate limiting. Pattern from Championship Chess.
// Uses the shared `edge_function_calls` table.
// Fail-open: if DB errors, allow the request (don't block users because our infra is flaky).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getIdentifier(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || "anon";
  return `ip:${ip}`;
}

export interface RateLimitResult {
  allowed: boolean;
  retry_after_ms: number;
}

/**
 * Check + record a rate limit window. `limit` = max requests per 60s window.
 * Returns { allowed, retry_after_ms }. Fail-open on DB error.
 */
export async function checkRateLimit(
  client: SupabaseClient,
  identifier: string,
  endpoint: string,
  limit: number
): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60_000);

    const { count, error } = await client
      .from("edge_function_calls")
      .select("*", { count: "exact", head: true })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .gte("created_at", windowStart.toISOString());

    if (error) return { allowed: true, retry_after_ms: 0 };

    if ((count ?? 0) >= limit) {
      return { allowed: false, retry_after_ms: 60_000 };
    }

    await client.from("edge_function_calls").insert({
      identifier,
      endpoint,
      created_at: now.toISOString(),
    });

    return { allowed: true, retry_after_ms: 0 };
  } catch {
    return { allowed: true, retry_after_ms: 0 };
  }
}
