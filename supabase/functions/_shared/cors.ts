// Centralized CORS for all Championship Sudoku Edge Functions.
// Pattern copied from Championship Chess.

const ALLOWED_ORIGINS_EXACT = new Set<string>([
  "https://championshipsudoku.vercel.app",
  "https://championshipchess.vercel.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
]);

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/, // Vercel previews
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.vercel\.app$/, // Vercel branch previews
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS_EXACT.has(origin) || ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://championshipsudoku.vercel.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-internal-secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function handleOptions(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...getCorsHeaders(req),
      ...extraHeaders,
    },
  });
}
