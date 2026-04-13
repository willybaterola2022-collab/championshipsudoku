import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DIFFICULTY_CONFIG,
  type Difficulty,
  getRankForLevel,
  xpToNextLevel,
} from "@/lib/sudoku/types";

const STORAGE_KEY = "sudoku-player-progress";
/** XP de lecciones de tutorial acumulado en cliente (sesión iniciada; sync servidor pendiente). */
const TUTORIAL_XP_PENDING_KEY = "sudoku-tutorial-xp-pending";

function readTutorialXpPending(): number {
  try {
    const n = parseInt(localStorage.getItem(TUTORIAL_XP_PENDING_KEY) || "0", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export interface AchievementState {
  id: string;
  unlockedAt: string | null;
}

export interface PlayerProgressState {
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  streakDays: number;
  lastPlayedDate: string | null;
  puzzlesSolved: Record<Difficulty, number>;
  bestTimes: Record<Difficulty, number | null>;
  achievements: AchievementState[];
}

const ACHIEVEMENT_IDS = [
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

function defaultProgress(): PlayerProgressState {
  const puzzlesSolved = {} as Record<Difficulty, number>;
  const bestTimes = {} as Record<Difficulty, number | null>;
  (Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).forEach((d) => {
    puzzlesSolved[d] = 0;
    bestTimes[d] = null;
  });
  return {
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1),
    totalXp: 0,
    streakDays: 0,
    lastPlayedDate: null,
    puzzlesSolved,
    bestTimes,
    achievements: ACHIEVEMENT_IDS.map((id) => ({ id, unlockedAt: null })),
  };
}

function load(): PlayerProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as PlayerProgressState;
    if (!parsed.puzzlesSolved) return defaultProgress();
    return parsed;
  } catch {
    return defaultProgress();
  }
}

function save(state: PlayerProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export interface WinPayload {
  difficulty: Difficulty;
  variant: "classic" | "killer";
  timeMs: number;
  errors: number;
  hintsUsed: number;
}

function addXp(base: number, opts: { perfect: boolean; fast: boolean; killer: boolean; noHints: boolean }) {
  let mult = 1;
  if (opts.perfect) mult *= 1.2;
  if (opts.fast) mult *= 1.15;
  if (opts.killer) mult *= 1.3;
  if (opts.noHints) mult *= 1.1;
  return Math.round(base * mult);
}

function profileToProgress(
  xp: number,
  level: number,
  streak: number,
  solvedByDifficulty: Record<Difficulty, number>
): PlayerProgressState {
  const puzzlesSolved = {} as Record<Difficulty, number>;
  const bestTimes = {} as Record<Difficulty, number | null>;
  (Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).forEach((d) => {
    puzzlesSolved[d] = solvedByDifficulty[d] ?? 0;
    bestTimes[d] = null;
  });
  const need = xpToNextLevel(level);
  return {
    level,
    xp,
    xpToNext: need,
    totalXp: xp,
    streakDays: streak,
    lastPlayedDate: null,
    puzzlesSolved,
    bestTimes,
    achievements: ACHIEVEMENT_IDS.map((id) => ({ id, unlockedAt: null })),
  };
}

export function usePlayerProgress() {
  const { user, profile, loading: authLoading } = useAuth();
  const [localProgress, setLocalProgress] = useState<PlayerProgressState>(load);
  const [tutorialXpPending, setTutorialXpPending] = useState(readTutorialXpPending);

  useEffect(() => {
    if (user) return;
    save(localProgress);
  }, [user, localProgress]);

  useEffect(() => {
    setTutorialXpPending(readTutorialXpPending());
  }, [user?.id]);

  const { data: sessionDifficulty, isError: sessionDifficultyError } = useQuery({
    queryKey: ["sudoku-session-difficulties", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sudoku_game_sessions")
        .select("difficulty")
        .eq("user_id", user!.id)
        .eq("completed", true);
      if (error) throw error;
      const counts = {
        easy: 0,
        medium: 0,
        hard: 0,
        expert: 0,
        fiendish: 0,
      } as Record<Difficulty, number>;
      for (const row of data ?? []) {
        const d = row.difficulty as Difficulty;
        if (d in counts) counts[d] += 1;
      }
      return counts;
    },
  });

  const serverProgress = useMemo((): PlayerProgressState | null => {
    if (!user || !profile) return null;
    const streak = profile.sudoku_current_streak ?? 0;
    const solvedMap = sessionDifficulty ?? {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
      fiendish: 0,
    };
    return profileToProgress(profile.xp, profile.level, streak, solvedMap);
  }, [user, profile, sessionDifficulty]);

  const progress = serverProgress ?? localProgress;
  const rank = useMemo(() => getRankForLevel(progress.level), [progress.level]);

  const recordWin = useCallback(
    (payload: WinPayload) => {
      if (user) return;
      setLocalProgress((prev) => {
        const base = DIFFICULTY_CONFIG[payload.difficulty].baseXp;
        const perfect = payload.errors === 0;
        const fast = payload.timeMs < 5 * 60 * 1000;
        const killer = payload.variant === "killer";
        const noHints = payload.hintsUsed === 0;
        const gained = addXp(base, { perfect, fast, killer, noHints });

        let { level, xp, totalXp } = prev;
        totalXp += gained;
        xp += gained;
        let need = xpToNextLevel(level);
        while (xp >= need) {
          xp -= need;
          level += 1;
          need = xpToNextLevel(level);
        }

        const today = new Date().toISOString().slice(0, 10);
        let streakDays = prev.streakDays;
        let lastPlayedDate = prev.lastPlayedDate;
        if (lastPlayedDate !== today) {
          if (!lastPlayedDate) {
            streakDays = 1;
          } else {
            const prevDay = new Date(`${lastPlayedDate}T12:00:00`);
            const todayD = new Date(`${today}T12:00:00`);
            const diffDays = Math.round((todayD.getTime() - prevDay.getTime()) / 86400000);
            if (diffDays === 1) streakDays = prev.streakDays + 1;
            else streakDays = 1;
          }
          lastPlayedDate = today;
        }

        const puzzlesSolved = { ...prev.puzzlesSolved };
        puzzlesSolved[payload.difficulty] = (puzzlesSolved[payload.difficulty] ?? 0) + 1;

        const bestTimes = { ...prev.bestTimes };
        const prevBest = bestTimes[payload.difficulty];
        if (prevBest == null || payload.timeMs < prevBest) {
          bestTimes[payload.difficulty] = payload.timeMs;
        }

        const achievements = prev.achievements.map((a) => ({ ...a }));
        const unlock = (id: string) => {
          const i = achievements.findIndex((x) => x.id === id);
          if (i >= 0 && !achievements[i].unlockedAt) {
            achievements[i] = { id, unlockedAt: new Date().toISOString() };
          }
        };

        const totalSolved = Object.values(puzzlesSolved).reduce((s, n) => s + n, 0);
        if (totalSolved >= 1) unlock("sudoku_first_puzzle");
        if (totalSolved >= 10) unlock("sudoku_10_puzzles");
        if (totalSolved >= 50) unlock("sudoku_50_puzzles");
        if (streakDays >= 3) unlock("sudoku_streak_3");
        if (streakDays >= 7) unlock("sudoku_streak_7");
        if (perfect) unlock("sudoku_perfect");
        if (payload.difficulty === "easy" && fast) unlock("sudoku_speed");
        if (payload.difficulty === "hard") unlock("sudoku_hard");
        if (payload.difficulty === "expert") unlock("sudoku_expert");
        if (killer) unlock("sudoku_killer");

        return {
          ...prev,
          level,
          xp,
          xpToNext: xpToNextLevel(level),
          totalXp,
          streakDays,
          lastPlayedDate,
          puzzlesSolved,
          bestTimes,
          achievements,
        };
      });
    },
    [user]
  );

  /** +30 XP por lección: invitados actualizan progreso local; con sesión se guarda en `sudoku-tutorial-xp-pending` hasta sync backend. */
  const grantTutorialXp = useCallback(
    (amount: number) => {
      if (user) {
        const next = readTutorialXpPending() + amount;
        try {
          localStorage.setItem(TUTORIAL_XP_PENDING_KEY, String(next));
        } catch {
          /* ignore */
        }
        setTutorialXpPending(next);
        toast.success(
          `+${amount} XP de tutorial guardados (${next} XP pendientes de sincronizar con el servidor)`
        );
        return;
      }
      setLocalProgress((prev) => {
        let { level, xp, totalXp } = prev;
        totalXp += amount;
        xp += amount;
        let need = xpToNextLevel(level);
        while (xp >= need) {
          xp -= need;
          level += 1;
          need = xpToNextLevel(level);
        }
        return {
          ...prev,
          level,
          xp,
          totalXp,
          xpToNext: xpToNextLevel(level),
        };
      });
      toast.success(`+${amount} XP`);
    },
    [user]
  );

  return {
    progress,
    rank,
    recordWin,
    grantTutorialXp,
    tutorialXpPending,
    isServerProgress: Boolean(user && profile),
    authLoading,
    sessionDifficultyError,
  };
}
