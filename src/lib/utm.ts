/** Parámetros UTM para enlaces salientes al ecosistema (medición sin analytics invasivo). */
export function withAppUtm(url: string, medium: "nav" | "footer" | "profile"): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "championshipsudoku");
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", "casual_games");
    return u.toString();
  } catch {
    return url;
  }
}
