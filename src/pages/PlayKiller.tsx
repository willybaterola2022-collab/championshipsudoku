import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BoardThemeSelector, readBoardTheme, writeBoardTheme, type BoardThemeId } from "@/components/sudoku/BoardThemeSelector";
import { CageOverlay } from "@/components/sudoku/CageOverlay";
import { DifficultySelector } from "@/components/sudoku/DifficultySelector";
import { GameControls } from "@/components/sudoku/GameControls";
import { GameResult } from "@/components/sudoku/GameResult";
import { NumPad } from "@/components/sudoku/NumPad";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { Timer } from "@/components/sudoku/Timer";
import { useKillerSudokuGame } from "@/hooks/useKillerSudokuGame";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import { cn } from "@/lib/utils";

export default function PlayKiller() {
  const { recordWin } = usePlayerProgress();
  const game = useKillerSudokuGame({ onWin: recordWin });
  const [theme, setTheme] = useState<BoardThemeId>(() => readBoardTheme());

  const themeClass = useMemo(
    () => (theme === "classic" ? "" : `board-theme-${theme}`),
    [theme]
  );

  useSudokuKeyboard({
    enabled: !game.isCompleted && !game.isPaused,
    onDigit: game.placeNumber,
    onErase: game.eraseCell,
    onUndo: game.undo,
    onToggleNotes: game.toggleNotes,
  });

  const shareResult = async () => {
    const text = "Championship Sudoku — Killer";
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

  return (
    <div className={cn("min-h-screen bg-background text-foreground", themeClass)}>
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-primary"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-destructive">
              Killer
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
          <DifficultySelector value={game.difficulty} onChange={(d) => game.newGame(d)} disabled={game.generating} />
        </div>
      </header>

      <main className="container space-y-6 px-4 pb-12 pt-6">
        <p className="text-center text-sm text-muted-foreground">
          Sumas por jaula, sin números iniciales. Sin pistas IA en esta versión.
        </p>
        <BoardThemeSelector value={theme} onChange={(id) => { setTheme(id); writeBoardTheme(id); }} />

        <div className="relative mx-auto w-[min(90vw,450px)]">
          <SudokuBoard
            board={game.board}
            selectedCell={game.selectedCell}
            onSelectCell={game.selectCell}
            sizeClassName="w-full"
          />
          <CageOverlay cages={game.cages} />
        </div>

        <ProgressBar filled={game.filledCount} />

        <GameControls
          showHints={false}
          canUndo={game.history.length > 0}
          notesActive={game.isNotesMode}
          onUndo={game.undo}
          onErase={game.eraseCell}
          onToggleNotes={game.toggleNotes}
          onHint={() => void game.useHint()}
          hintsRemaining={0}
          disabled={game.isCompleted || game.mistakes >= game.maxMistakes}
        />

        <NumPad
          board={game.board}
          onInput={game.placeNumber}
          disabled={game.isCompleted || game.isPaused || game.mistakes >= game.maxMistakes}
        />
      </main>

      <GameResult
        open={game.isCompleted}
        timeMs={game.timerSeconds * 1000}
        mistakes={game.mistakes}
        hintsUsed={0}
        onClose={() => game.newGame(game.difficulty)}
        onShare={shareResult}
      />
    </div>
  );
}
