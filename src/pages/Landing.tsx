import { Grid3x3, Maximize2, Swords } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FirstVisitHelp } from "@/components/FirstVisitHelp";
import { Navbar } from "@/components/Navbar";
import { BoardThemeSelector, readBoardTheme, writeBoardTheme, type BoardThemeId } from "@/components/sudoku/BoardThemeSelector";
import { DailyCountdown } from "@/components/sudoku/DailyCountdown";
import { DifficultySelector } from "@/components/sudoku/DifficultySelector";
import { GameControls } from "@/components/sudoku/GameControls";
import { GameResult } from "@/components/sudoku/GameResult";
import { NumPad } from "@/components/sudoku/NumPad";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { StreakCounter } from "@/components/sudoku/StreakCounter";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { XPBar } from "@/components/sudoku/XPBar";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import { useSudokuGame } from "@/hooks/useSudokuGame";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import { cn } from "@/lib/utils";

export default function Landing() {
  const { progress, rank, recordWin } = usePlayerProgress();
  const game = useSudokuGame({ onWin: recordWin });
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

  const onThemeChange = (id: BoardThemeId) => {
    setTheme(id);
    writeBoardTheme(id);
  };

  const shareResult = async () => {
    const text = `Championship Sudoku — ${game.difficulty} en ${Math.floor(game.timerSeconds / 60)}:${(game.timerSeconds % 60).toString().padStart(2, "0")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Championship Sudoku", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.message("Copiado al portapapeles");
      }
    } catch {
      toast.error("No se pudo compartir");
    }
  };

  return (
    <div className={cn("min-h-screen bg-background text-foreground", themeClass)}>
      <Navbar />
      <FirstVisitHelp />
      <main className="container space-y-6 px-4 pb-10 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl text-gradient-gold sm:text-5xl">Sudoku</h1>
            <DifficultySelector
              value={game.difficulty}
              onChange={(d) => game.newGame(d)}
              disabled={game.generating}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/play"
              className="glass inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-primary"
              aria-label="Pantalla completa"
            >
              <Maximize2 className="h-5 w-5" />
            </Link>
            <Link
              to="/play"
              className="glass inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-primary"
              aria-label="Vista de juego clásico"
            >
              <Grid3x3 className="h-5 w-5" />
            </Link>
            <Link
              to="/play/killer"
              className="glass inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-primary"
              aria-label="Killer Sudoku"
            >
              <Swords className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <BoardThemeSelector value={theme} onChange={onThemeChange} />

        <div className="relative mx-auto max-w-[520px]">
          <SudokuBoard
            board={game.board}
            selectedCell={game.selectedCell}
            onSelectCell={game.selectCell}
            animateStagger
          />
        </div>

        <GameControls
          canUndo={game.history.length > 0}
          notesActive={game.isNotesMode}
          onUndo={game.undo}
          onErase={game.eraseCell}
          onToggleNotes={game.toggleNotes}
          onHint={() => void game.useHint()}
          hintsRemaining={game.hintsRemaining}
          hintLoading={game.hintLoading}
          disabled={game.isCompleted || game.mistakes >= game.maxMistakes}
        />

        <NumPad
          board={game.board}
          onInput={game.placeNumber}
          disabled={game.isCompleted || game.isPaused || game.mistakes >= game.maxMistakes}
        />

        <div className="flex flex-col gap-4 border-t border-border/40 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <StreakCounter days={progress.streakDays} />
            <DailyCountdown />
          </div>
          <XPBar progress={progress} rank={rank} className="w-full sm:max-w-xs" />
        </div>

        <ProgressBar filled={game.filledCount} />
      </main>

      <GameResult
        open={game.isCompleted}
        timeMs={game.timerSeconds * 1000}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        onClose={() => game.newGame(game.difficulty)}
        onShare={shareResult}
      />
    </div>
  );
}
