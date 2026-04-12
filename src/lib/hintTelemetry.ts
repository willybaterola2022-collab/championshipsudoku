const KEY = "sudoku-hint-log";

export interface HintLogEntry {
  level: number;
  technique?: string | null;
  timestamp: number;
}

export function logHintUsage(entry: Omit<HintLogEntry, "timestamp">): void {
  try {
    const raw = localStorage.getItem(KEY);
    const hintLog: HintLogEntry[] = raw ? (JSON.parse(raw) as HintLogEntry[]) : [];
    hintLog.push({ ...entry, timestamp: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(hintLog.slice(-100)));
  } catch {
    /* ignore */
  }
}

/** Distribución de niveles en el último mes (aprox). */
export function getHintLevelStatsLastMonth(): { n1: number; n2: number; n3: number; total: number } {
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  try {
    const raw = localStorage.getItem(KEY);
    const hintLog: HintLogEntry[] = raw ? (JSON.parse(raw) as HintLogEntry[]) : [];
    const recent = hintLog.filter((h) => h.timestamp >= monthAgo);
    let n1 = 0;
    let n2 = 0;
    let n3 = 0;
    for (const h of recent) {
      if (h.level === 1) n1++;
      else if (h.level === 2) n2++;
      else if (h.level === 3) n3++;
    }
    return { n1, n2, n3, total: recent.length };
  } catch {
    return { n1: 0, n2: 0, n3: 0, total: 0 };
  }
}
