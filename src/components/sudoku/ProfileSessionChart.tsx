import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTY_CONFIG, type Difficulty } from "@/lib/sudoku/types";
import { cn } from "@/lib/utils";

const COLORS: Record<Difficulty, string> = {
  easy: "hsl(142, 60%, 45%)",
  medium: "hsl(43, 90%, 55%)",
  hard: "hsl(25, 85%, 55%)",
  expert: "hsl(280, 55%, 55%)",
  fiendish: "hsl(0, 70%, 55%)",
};

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface ProfileSessionChartProps {
  userId: string;
  className?: string;
}

/** Sesiones completadas: tiempo medio por día y dificultad (Recharts). */
export function ProfileSessionChart({ userId, className }: ProfileSessionChartProps) {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sudoku-profile-session-chart", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sudoku_game_sessions")
        .select("time_ms, difficulty, created_at")
        .eq("user_id", userId)
        .eq("completed", true)
        .order("created_at", { ascending: true })
        .limit(80);
      if (error) throw error;
      return data ?? [];
    },
  });

  type Acc = Partial<Record<Difficulty, number[]>>;
  const byDay = new Map<string, Acc>();

  for (const row of sessions ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    const d = row.difficulty as Difficulty;
    if (!(d in DIFFICULTY_CONFIG)) continue;
    const t = row.time_ms as number;
    let acc = byDay.get(day);
    if (!acc) {
      acc = {};
      byDay.set(day, acc);
    }
    if (!acc[d]) acc[d] = [];
    acc[d]!.push(t);
  }

  const dates = [...byDay.keys()].sort();
  const chartData = dates.map((date) => {
    const acc = byDay.get(date)!;
    const row: Record<string, string | number | undefined> = { date };
    for (const diff of Object.keys(DIFFICULTY_CONFIG) as Difficulty[]) {
      const arr = acc[diff];
      if (arr?.length) {
        row[diff] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      }
    }
    return row;
  });

  if (isLoading) {
    return <div className={cn("h-64 animate-pulse rounded-lg bg-muted", className)} data-placeholder />;
  }

  if (chartData.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)} data-placeholder>
        Sin sesiones recientes para graficar.
      </p>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-2 text-xs text-muted-foreground">Tiempo medio por día y dificultad (sesiones completadas)</p>
      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => fmtMs(Number(v))} tick={{ fontSize: 10 }} width={48} />
            <Tooltip
              formatter={(value) => fmtMs(Number(value))}
              labelFormatter={(l) => String(l)}
            />
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
              <Line
                key={d}
                type="monotone"
                dataKey={d}
                name={DIFFICULTY_CONFIG[d].label}
                stroke={COLORS[d]}
                dot={false}
                connectNulls
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
