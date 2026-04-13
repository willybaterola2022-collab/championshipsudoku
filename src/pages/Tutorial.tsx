import { Check, ChevronDown, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { GameControls } from "@/components/sudoku/GameControls";
import { NumPad } from "@/components/sudoku/NumPad";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { Timer } from "@/components/sudoku/Timer";
import { useSudokuGame } from "@/hooks/useSudokuGame";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import type { TutorialLesson } from "@/lib/sudoku/tutorials";
import { cn } from "@/lib/utils";

function LessonRunner({
  lesson,
  onComplete,
}: {
  lesson: TutorialLesson;
  onComplete: () => void;
}) {
  const seeded = useMemo(
    () => ({
      puzzle: lesson.puzzle.map((r) => [...r]),
      solution: lesson.solution.map((r) => [...r]),
      difficulty: "easy" as const,
    }),
    [lesson]
  );

  const game = useSudokuGame({
    seeded,
    persistenceKey: `sudoku-tutorial-${lesson.key}`,
  });

  useSudokuKeyboard({
    enabled: !game.isCompleted && !game.isPaused && !game.isOutOfLives,
    onDigit: game.placeNumber,
    onErase: game.eraseCell,
    onUndo: game.undo,
    onToggleNotes: game.toggleNotes,
  });

  const target = lesson.targetCell;

  return (
    <div className="space-y-4 border-t border-border/40 pt-4">
      <div className="prose prose-invert max-w-none text-sm">
        <p className="text-foreground">{lesson.description}</p>
        <p className="text-muted-foreground">{lesson.explanation}</p>
      </div>
      <p className="text-xs text-primary">Celda objetivo: fila {target.row + 1}, columna {target.col + 1}</p>
      <SudokuBoard
        board={game.board}
        selectedCell={game.selectedCell}
        onSelectCell={game.selectCell}
        sizeClassName="w-[min(90vw,400px)]"
      />
      <div className="flex flex-wrap gap-3">
        <Timer
          seconds={game.timerSeconds}
          isPaused={game.isPaused}
          onTogglePause={game.togglePause}
          disabled={game.isCompleted}
        />
      </div>
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
      {game.isCompleted ? (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-center">
          <p className="font-semibold text-primary">¡Técnica dominada!</p>
          <button
            type="button"
            className="mt-3 rounded-lg border border-border px-4 py-2 text-sm"
            onClick={() => {
              onComplete();
              toast.success("Lección completada");
            }}
          >
            Marcar completada y volver
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Tutorial() {
  const { lessons, completedKeys, markComplete, isUnlocked } = useTutorialProgress();
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container max-w-2xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-serif text-3xl text-gradient-gold">Aprender técnicas</h1>
          <p className="mt-2 text-muted-foreground">
            Diez lecciones con tableros diseñados. Completá cada puzzle para dominar la técnica.
          </p>
        </div>

        <ol className="space-y-3">
          {lessons.map((lesson) => {
            const done = completedKeys.has(lesson.key);
            const locked = !isUnlocked(lesson.order);
            const expanded = openKey === lesson.key;

            return (
              <li
                key={lesson.key}
                className={cn(
                  "rounded-xl border border-border/60 bg-card/40",
                  locked && "opacity-70"
                )}
              >
                <button
                  type="button"
                  disabled={locked}
                  className="flex w-full items-start gap-3 p-4 text-left"
                  onClick={() => {
                    if (locked) return;
                    setOpenKey(expanded ? null : lesson.key);
                  }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-sm font-semibold">
                    {lesson.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{lesson.title}</span>
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <Check className="h-3.5 w-3.5" /> Completada
                        </span>
                      ) : null}
                      {locked ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" /> Completá la anterior
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{lesson.technique}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/90">{lesson.description}</p>
                  </div>
                  <ChevronDown
                    className={cn("h-5 w-5 shrink-0 transition-transform", expanded && "rotate-180")}
                  />
                </button>
                {expanded && !locked ? (
                  <div className="border-t border-border/40 px-4 pb-4">
                    <LessonRunner
                      lesson={lesson}
                      onComplete={() => {
                        markComplete(lesson.key);
                        setOpenKey(null);
                      }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
