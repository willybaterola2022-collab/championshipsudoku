import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { GameOverLost } from "@/components/GameOverLost";
import { Navbar } from "@/components/Navbar";
import { DailyCountdown } from "@/components/sudoku/DailyCountdown";
import { GameControls } from "@/components/sudoku/GameControls";
import { GameResult } from "@/components/sudoku/GameResult";
import { Leaderboard } from "@/components/sudoku/Leaderboard";
import { NumPad } from "@/components/sudoku/NumPad";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { Timer } from "@/components/sudoku/Timer";
import { FEATURES } from "@/config";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import { useWinPostGameStats } from "@/hooks/useWinPostGameStats";
import { useSudokuGame } from "@/hooks/useSudokuGame";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import type { DailyChallengeRow } from "@/hooks/useTodayDailyChallenge";
import { utcToday, useTodayDailyChallenge } from "@/hooks/useTodayDailyChallenge";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTY_CONFIG, type Difficulty } from "@/lib/sudoku/types";
import { toast } from "sonner";

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function DailyInner({ row }: { row: DailyChallengeRow }) {
  const { user } = useAuth();
  const { recordWin } = usePlayerProgress();
  const seeded = useMemo(() => {
    const puzzle = JSON.parse(row.sudoku_puzzles.puzzle) as number[][];
    const solution = JSON.parse(row.sudoku_puzzles.solution) as number[][];
    return {
      puzzle,
      solution,
      difficulty: row.difficulty as Difficulty,
    };
  }, [row]);

  const game = useSudokuGame({
    seeded,
    persistenceKey: "sudoku-daily-game-state",
    dailyMeta: { challengeId: row.id, puzzleId: row.puzzle_id },
    onWin: recordWin,
  });

  const winStats = useWinPostGameStats({
    userId: user?.id,
    isCompleted: game.isCompleted,
    difficulty: game.difficulty,
    timeMs: game.timerSeconds * 1000,
  });

  const isTodayRow = row.challenge_date === utcToday();

  const { data: bestDailyMs } = useQuery({
    queryKey: ["sudoku-leaderboard-daily-top", row.challenge_date],
    enabled: game.isCompleted && isTodayRow,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ entries?: { time_ms: number }[] }>(
        "sudoku-leaderboard",
        { body: { type: "daily", limit: 1 } }
      );
      if (error) throw error;
      return data?.entries?.[0]?.time_ms ?? null;
    },
  });

  const compareLine =
    game.isCompleted && bestDailyMs != null && isTodayRow
      ? `Mejor del día: ${fmtMs(bestDailyMs)} · Tu tiempo: ${fmtMs(game.timerSeconds * 1000)}`
      : undefined;

  useSudokuKeyboard({
    enabled: !game.isCompleted && !game.isPaused && !game.isOutOfLives,
    onDigit: game.placeNumber,
    onErase: game.eraseCell,
    onUndo: game.undo,
    onToggleNotes: game.toggleNotes,
  });

  const shareResult = async () => {
    const text = "Puzzle del día — Championship Sudoku";
    try {
      if (navigator.share) await navigator.share({ title: "Championship Sudoku", text });
      else {
        await navigator.clipboard.writeText(text);
        toast.message("Copiado al portapapeles");
      }
    } catch {
      toast.error("No se pudo compartir");
    }
  };

  const dateLabel = new Date(row.challenge_date + "T12:00:00").toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const weekdayUtc = DAY_NAMES_ES[new Date(row.challenge_date + "T12:00:00Z").getUTCDay()];

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-gradient-gold">Puzzle del día</h1>
            <p className="mt-1 text-sm text-foreground">
              {weekdayUtc} — {DIFFICULTY_CONFIG[row.difficulty].label} (+{row.bonus_xp} XP)
            </p>
            <p className="capitalize text-muted-foreground">{dateLabel}</p>
            {!isTodayRow && (
              <p className="mt-1 text-xs text-muted-foreground">
                Estás viendo un desafío histórico (UTC). El ranking en vivo corresponde al día actual.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              +{row.bonus_xp} XP bonus
            </span>
            <DailyCountdown />
            <button
              type="button"
              className="text-xs text-primary underline-offset-2 hover:underline"
              onClick={() => {
                const url = `${window.location.origin}/daily?date=${row.challenge_date}`;
                void navigator.clipboard.writeText(url).then(() => toast.message("Enlace copiado"));
              }}
            >
              Copiar enlace del día
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Timer
            seconds={game.timerSeconds}
            isPaused={game.isPaused}
            onTogglePause={game.togglePause}
            disabled={game.isCompleted}
          />
          <span className="rounded-full border border-border/60 px-3 py-1 text-xs uppercase text-muted-foreground">
            {row.difficulty}
          </span>
        </div>

        <SudokuBoard
          board={game.board}
          selectedCell={game.selectedCell}
          onSelectCell={game.selectCell}
        />

        <ProgressBar filled={game.filledCount} />

        <GameControls
          canUndo={game.history.length > 0}
          notesActive={game.isNotesMode}
          onUndo={game.undo}
          onErase={game.eraseCell}
          onToggleNotes={game.toggleNotes}
          onHint={() => void game.useHint()}
          hintsRemaining={game.hintsRemaining}
          hintLoading={game.hintLoading}
          hintLevelNext={game.nextHintLevel}
          disabled={game.isCompleted || game.mistakes >= game.maxMistakes}
        />

        <NumPad
          board={game.board}
          onInput={game.placeNumber}
          disabled={game.isCompleted || game.isPaused || game.mistakes >= game.maxMistakes}
        />
      </section>

      <section id="daily-leaderboard" className="mt-12 scroll-mt-24 space-y-4">
        <h2 className="font-serif text-xl text-primary">Ranking de hoy</h2>
        <Leaderboard type="daily" limit={20} />
      </section>

      <GameResult
        open={game.isCompleted}
        timeMs={game.timerSeconds * 1000}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        onClose={() => game.newGame(game.difficulty)}
        onShare={shareResult}
        percentile={winStats.percentile}
        showPersonalBestBadge={winStats.isPersonalBest}
        compareLine={compareLine}
        footerExtra={
          <a href="#daily-leaderboard" className="text-center text-sm text-primary hover:underline">
            Ver ranking de hoy
          </a>
        }
      />
      <GameOverLost open={game.isOutOfLives} onNewGame={() => game.newGame(game.difficulty)} />
    </>
  );
}

export default function Daily() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const invalidDate = Boolean(dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam));

  const { data, isLoading, error, refetch, isFetching } = useTodayDailyChallenge(dateParam, !invalidDate);

  if (!FEATURES.daily) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container space-y-8 px-4 pb-16 pt-8">
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Volver al inicio
        </Link>

        {invalidDate && (
          <p className="text-sm text-destructive">
            Fecha en la URL no válida. Usá el formato <code className="rounded bg-muted px-1">?date=YYYY-MM-DD</code>{" "}
            en UTC.
          </p>
        )}

        {isLoading && (
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mx-auto h-[min(90vw,400px)] max-w-md animate-pulse rounded-lg bg-muted" />
          </div>
        )}

        {error && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-destructive">No se pudo cargar el puzzle del día. Intentá de nuevo.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {isFetching ? "Cargando…" : "Reintentar"}
            </button>
          </div>
        )}

        {!isLoading && !error && !data && !invalidDate && (
          <p className="text-muted-foreground">
            El puzzle del día se prepara a medianoche <strong className="text-foreground">UTC</strong>. Si en tu
            zona horaria todavía es “ayer”, el tablero nuevo aparece al cambiar de día en UTC.
          </p>
        )}

        {data && <DailyInner row={data} />}
      </main>
    </div>
  );
}
