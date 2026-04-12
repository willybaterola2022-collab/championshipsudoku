import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { GameOverLost } from "@/components/GameOverLost";
import { BoardThemeSelector, readBoardTheme, writeBoardTheme, type BoardThemeId } from "@/components/sudoku/BoardThemeSelector";
import { DifficultySelector } from "@/components/sudoku/DifficultySelector";
import { GameControls } from "@/components/sudoku/GameControls";
import { GameResult } from "@/components/sudoku/GameResult";
import { HintCoachBanner } from "@/components/sudoku/HintCoachBanner";
import { NumPad } from "@/components/sudoku/NumPad";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { Timer } from "@/components/sudoku/Timer";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import { useMiniSudokuGame } from "@/hooks/useMiniSudokuGame";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import { useWinPostGameStats } from "@/hooks/useWinPostGameStats";
import { supabase } from "@/integrations/supabase/client";
import type { Difficulty } from "@/lib/sudoku/types";
import { DIFFICULTY_CONFIG } from "@/lib/sudoku/types";
import { cn } from "@/lib/utils";

interface SeededPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: Difficulty;
}

function PlayMiniSession({
  seeded,
  sessionId,
}: {
  seeded: SeededPuzzle | null;
  sessionId: number;
}) {
  const { user, profile } = useAuth();
  const { recordWin } = usePlayerProgress();
  const game = useMiniSudokuGame({
    onWin: recordWin,
    seeded: seeded ?? undefined,
  });

  const winStats = useWinPostGameStats({
    userId: user?.id,
    isCompleted: game.isCompleted,
    difficulty: game.difficulty,
    timeMs: game.timerSeconds * 1000,
  });

  const [theme, setTheme] = useState<BoardThemeId>(() => readBoardTheme());

  useSudokuKeyboard({
    enabled: !game.isCompleted && !game.isPaused && !game.isOutOfLives,
    onDigit: game.placeNumber,
    onErase: game.eraseCell,
    onUndo: game.undo,
    onToggleNotes: game.toggleNotes,
    maxDigit: 6,
  });

  const themeClass = useMemo(
    () => (theme === "classic" ? "" : `board-theme-${theme}`),
    [theme]
  );

  const shareResult = async () => {
    const text = `Championship Sudoku Mini 6×6 — ${game.difficulty}`;
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

  const autoNotesUnlocked = !user || (profile?.level ?? 1) >= 2;

  return (
    <div className={cn("min-h-screen bg-background text-foreground", themeClass)} data-session={sessionId}>
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/play"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-primary"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Mini 6×6 · {DIFFICULTY_CONFIG[game.difficulty].label}
            </span>
            <Timer
              seconds={game.timerSeconds}
              isPaused={game.isPaused}
              onTogglePause={game.togglePause}
              disabled={game.isCompleted}
            />
            <span className="text-sm text-muted-foreground">
              Errores:{" "}
              <span className="font-semibold text-foreground">
                {game.mistakes}/{game.maxMistakes}
              </span>
            </span>
          </div>
          <DifficultySelector
            value={game.difficulty}
            onChange={(d) => game.newGame(d)}
            disabled={game.generating}
          />
        </div>
      </header>

      <main className="container space-y-6 px-4 pb-12 pt-6">
        <BoardThemeSelector value={theme} onChange={(id) => { setTheme(id); writeBoardTheme(id); }} />

        <HintCoachBanner state={game.hintCoach} />

        <div className="sudoku-play-layout flex flex-col gap-4">
          <SudokuBoard
            board={game.board}
            selectedCell={game.selectedCell}
            onSelectCell={game.selectCell}
            sizeClassName="w-[min(90vw,380px)] landscape:w-[min(55vh,380px)]"
            gridSize={6}
          />

          <ProgressBar filled={game.filledCount} total={36} />

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
            onAutoNotes={game.applyAutoFillNotes}
            showAutoNotes={autoNotesUnlocked}
          />

          <NumPad
            board={game.board}
            onInput={game.placeNumber}
            disabled={game.isCompleted || game.isPaused || game.mistakes >= game.maxMistakes}
            gridSize={6}
          />
        </div>
      </main>

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
    </div>
  );
}

export default function PlayMini() {
  const [sessionId, setSessionId] = useState(0);
  const [seeded, setSeeded] = useState<SeededPuzzle | null>(null);
  const [ready, setReady] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const fetchPuzzle = useCallback(async (d: Difficulty) => {
    try {
      const { data, error } = await supabase
        .from("sudoku_puzzles")
        .select("puzzle, solution, difficulty")
        .eq("variant", "mini6")
        .eq("difficulty", d)
        .order("times_played", { ascending: true, nullsFirst: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data?.puzzle && data.solution) {
        const puzzle = JSON.parse(data.puzzle as string) as number[][];
        const solution = JSON.parse(data.solution as string) as number[][];
        setSeeded({
          puzzle,
          solution,
          difficulty: (data.difficulty as Difficulty) ?? d,
        });
        setSessionId((k) => k + 1);
        return;
      }
    } catch {
      /* fallback below */
    }
    setSeeded(null);
    setSessionId((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await fetchPuzzle(difficulty);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [difficulty, fetchPuzzle]);

  return (
    <>
      <div className="border-b border-border/40 bg-muted/20 px-4 py-3">
        <div className="container flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Dificultad del catálogo</span>
          <select
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value as Difficulty);
              setReady(false);
            }}
          >
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_CONFIG[d].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-lg border border-primary px-3 py-2 text-sm text-primary"
            onClick={() => void fetchPuzzle(difficulty)}
          >
            Otro puzzle
          </button>
          <Link to="/play" className="text-sm text-primary hover:underline">
            Volver a 9×9
          </Link>
        </div>
      </div>

      {ready ? <PlayMiniSession key={sessionId} seeded={seeded} sessionId={sessionId} /> : (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Cargando…</div>
      )}
    </>
  );
}
