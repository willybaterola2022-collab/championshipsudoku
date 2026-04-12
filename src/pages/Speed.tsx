import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GameOverLost } from "@/components/GameOverLost";
import { Navbar } from "@/components/Navbar";
import { GameControls } from "@/components/sudoku/GameControls";
import { GameResult } from "@/components/sudoku/GameResult";
import { NumPad } from "@/components/sudoku/NumPad";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { Timer } from "@/components/sudoku/Timer";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import {
  mapSpeedDifficulty,
  parseSpeedGrid,
  type SpeedChallengePayload,
  useSpeedChallenge,
  useSpeedLeaderboard,
} from "@/hooks/useSpeedChallenge";
import { useSudokuGame } from "@/hooks/useSudokuGame";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import { useWinPostGameStats } from "@/hooks/useWinPostGameStats";
import { DIFFICULTY_CONFIG } from "@/lib/sudoku/types";
import { toast } from "sonner";

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function EndsCountdown({ endsAt }: { endsAt: string }) {
  const [leftMs, setLeftMs] = useState(0);
  useEffect(() => {
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      setLeftMs(Math.max(0, ms));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  if (leftMs <= 0) {
    return <span className="text-destructive">Challenge finalizado</span>;
  }
  return <span className="tabular-nums text-foreground">Termina en {fmtMs(leftMs)}</span>;
}

function SpeedInner({ challenge }: { challenge: SpeedChallengePayload }) {
  const { user } = useAuth();
  const { recordWin } = usePlayerProgress();
  const seeded = useMemo(
    () => ({
      puzzle: parseSpeedGrid(challenge.puzzle),
      solution: parseSpeedGrid(challenge.solution),
      difficulty: mapSpeedDifficulty(challenge.difficulty),
    }),
    [challenge]
  );

  const game = useSudokuGame({
    seeded,
    persistenceKey: `speed-challenge-${challenge.challenge_id}`,
    speedMeta: { challengeId: challenge.challenge_id },
    onWin: recordWin,
  });

  const winStats = useWinPostGameStats({
    userId: user?.id,
    isCompleted: game.isCompleted,
    difficulty: game.difficulty,
    timeMs: game.timerSeconds * 1000,
  });

  const { data: lbRaw } = useSpeedLeaderboard(challenge.challenge_id, 20);

  useSudokuKeyboard({
    enabled: !game.isCompleted && !game.isPaused && !game.isOutOfLives,
    onDigit: game.placeNumber,
    onErase: game.eraseCell,
    onUndo: game.undo,
    onToggleNotes: game.toggleNotes,
  });

  const shareResult = async () => {
    const text = `Speed Challenge — Championship Sudoku`;
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

  const leaderboardRows = Array.isArray(lbRaw) ? lbRaw : lbRaw ? [lbRaw] : [];

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-gradient-gold">Speed Challenge</h1>
            <p className="text-sm text-muted-foreground">
              Mismo tablero para todos · {DIFFICULTY_CONFIG[game.difficulty].label}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <EndsCountdown endsAt={challenge.ends_at} />
            {typeof challenge.completions === "number" ? (
              <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                {challenge.completions} completaron
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Timer
            seconds={game.timerSeconds}
            isPaused={game.isPaused}
            onTogglePause={game.togglePause}
            disabled={game.isCompleted}
          />
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

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-xl text-primary">Ranking del challenge</h2>
        {leaderboardRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay tiempos o el ranking no está disponible.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {leaderboardRows.map((row: Record<string, unknown>, i: number) => (
              <li
                key={i}
                className="flex justify-between rounded-lg border border-border/50 px-3 py-2"
              >
                <span>
                  #{(row.rank as number) ?? i + 1}{" "}
                  <span className="text-muted-foreground">
                    {(row.display_name as string) ?? (row.username as string) ?? "Jugador"}
                  </span>
                </span>
                <span className="font-mono tabular-nums">{fmtMs(Number(row.time_ms ?? 0))}</span>
              </li>
            ))}
          </ul>
        )}
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
      />
      <GameOverLost open={game.isOutOfLives} onNewGame={() => game.newGame(game.difficulty)} />
    </>
  );
}

export default function Speed() {
  const { data: challenge, isLoading, error, refetch, isFetching } = useSpeedChallenge();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container space-y-8 px-4 pb-16 pt-8">
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Volver al inicio
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mx-auto h-[min(90vw,400px)] max-w-md animate-pulse rounded-lg bg-muted" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <p className="text-destructive">
              No se pudo cargar el Speed Challenge. Verificá que el RPC{" "}
              <code className="rounded bg-muted px-1">get_current_speed_challenge</code> exista en Supabase.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="mt-3 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !error && !challenge && (
          <p className="text-muted-foreground">No hay un challenge activo en este momento.</p>
        )}

        {challenge ? (
          <div key={challenge.challenge_id}>
            <SpeedInner challenge={challenge} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
