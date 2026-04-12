import { useQuery } from "@tanstack/react-query";
import { LogOut, User } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { XPBar } from "@/components/sudoku/XPBar";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTY_CONFIG, type Difficulty } from "@/lib/sudoku/types";
import { cn } from "@/lib/utils";

const ACH_KEYS = [
  "sudoku_first_puzzle",
  "sudoku_streak_3",
  "sudoku_streak_7",
  "sudoku_perfect",
  "sudoku_speed",
  "sudoku_10_puzzles",
  "sudoku_50_puzzles",
  "sudoku_hard",
  "sudoku_expert",
  "sudoku_killer",
] as const;

const ACHIEVEMENT_LABELS: Record<(typeof ACH_KEYS)[number], string> = {
  sudoku_first_puzzle: "Primer puzzle",
  sudoku_streak_3: "Racha 3 días",
  sudoku_streak_7: "Racha 7 días",
  sudoku_perfect: "Sin errores",
  sudoku_speed: "Velocidad",
  sudoku_10_puzzles: "10 resueltos",
  sudoku_50_puzzles: "50 resueltos",
  sudoku_hard: "Difícil",
  sudoku_expert: "Experto",
  sudoku_killer: "Killer",
};

export default function Profile() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { progress, rank, isServerProgress, sessionDifficultyError } = usePlayerProgress();

  const { data: unlockedKeys, isFetched: achievementsFetched } = useQuery({
    queryKey: ["sudoku-user-achievement-keys", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: ua, error: e1 } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user!.id);
      if (e1 || !ua?.length) return new Set<string>();
      const ids = ua.map((r) => r.achievement_id as string);
      const { data: ach, error: e2 } = await supabase
        .from("achievements")
        .select("id, key, category")
        .in("id", ids)
        .eq("category", "sudoku");
      if (e2) return new Set<string>();
      return new Set((ach ?? []).map((a) => a.key as string));
    },
  });

  const { data: bestTimesJson } = useQuery({
    queryKey: ["profile-sudoku-best", user?.id],
    enabled: Boolean(user) && Boolean(profile),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("sudoku_best_times")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.sudoku_best_times ?? {}) as Partial<Record<Difficulty, number>>;
    },
  });

  if (!authLoading && !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: "Iniciá sesión para ver tu progreso." }}
      />
    );
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  const displayName =
    profile?.display_name || profile?.username || user.email?.split("@")[0] || "Jugador";

  const totalSolved = isServerProgress
    ? (profile?.sudoku_puzzles_solved ?? 0)
    : Object.values(progress.puzzlesSolved).reduce((a, b) => a + b, 0);

  const allAchievementsLocked =
    achievementsFetched && unlockedKeys !== undefined && unlockedKeys.size === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container max-w-3xl space-y-8 px-4 py-8">
        {sessionDifficultyError && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            No pudimos cargar el desglose por dificultad. El resto del perfil sigue disponible.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="font-serif text-3xl text-gradient-gold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              Nivel {progress.level} — {rank}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut().then(() => refreshProfile())}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>

        <XPBar progress={progress} rank={rank} className="max-w-md" />

        {totalSolved === 0 && (
          <p className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Jugá tu primer sudoku para ver estadísticas acá.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">XP total (servidor)</p>
            <p className="text-2xl font-semibold tabular-nums">{profile?.xp ?? progress.totalXp}</p>
          </div>
          <div className="glass rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Sudokus resueltos</p>
            <p className="text-2xl font-semibold tabular-nums">
              {profile?.sudoku_puzzles_solved ?? "—"}
            </p>
          </div>
          <div className="glass rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Racha / mejor racha</p>
            <p className="text-lg font-semibold">
              {profile?.sudoku_current_streak ?? progress.streakDays} /{" "}
              {profile?.sudoku_best_streak ?? "—"}
            </p>
          </div>
          <div className="glass rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">Origen datos</p>
            <p className="text-sm">{isServerProgress ? "Supabase" : "Solo dispositivo"}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-serif text-xl text-primary">Por dificultad</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
              <div key={d} className="flex justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span>{DIFFICULTY_CONFIG[d].label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {progress.puzzlesSolved[d]} partidas
                  {bestTimesJson?.[d] != null && (
                    <span className="ml-2 text-foreground">
                      · mejor {(bestTimesJson[d]! / 1000 / 60).toFixed(1)} min
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-serif text-xl text-primary">Logros</h2>
          {allAchievementsLocked && (
            <p className="mb-3 text-sm text-muted-foreground">
              Completá tu primer sudoku para desbloquear logros.
            </p>
          )}
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {ACH_KEYS.map((key) => {
              const unlocked = unlockedKeys?.has(key) ?? false;
              const label = ACHIEVEMENT_LABELS[key];
              return (
                <div
                  key={key}
                  title={label}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-full border-2 text-[10px] font-medium",
                    unlocked ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  <span className="sr-only">{label}</span>
                  <span aria-hidden>{key.replace("sudoku_", "").replace(/_/g, "").slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Link to="/" className="inline-block text-sm text-primary hover:underline">
          Volver a jugar
        </Link>
      </main>
    </div>
  );
}
