import { Check, ChevronDown, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { NumPad } from "@/components/sudoku/NumPad";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import type { TutorialLesson } from "@/lib/sudoku/tutorials";
import { cloneBoard, numbersToBoard, type Board } from "@/lib/sudoku/types";
import { updateAllErrors } from "@/lib/sudoku/validator";
import { cn } from "@/lib/utils";

function LessonRunner({
  lesson,
  onMarkComplete,
  onDismiss,
}: {
  lesson: TutorialLesson;
  onMarkComplete: () => void;
  onDismiss: () => void;
}) {
  const { grantTutorialXp } = usePlayerProgress();
  const target = lesson.targetCell;
  const xpGranted = useRef(false);

  const givens = useMemo(
    () =>
      lesson.puzzle.map((row, ri) =>
        row.map((v, ci) => {
          if (ri === target.row && ci === target.col) return 0;
          if (v !== 0) return 1;
          return 1;
        })
      ),
    [lesson.puzzle, target.col, target.row]
  );

  const [board, setBoard] = useState<Board>(() =>
    updateAllErrors(numbersToBoard(lesson.puzzle.map((r) => [...r]), givens))
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({
    row: target.row,
    col: target.col,
  });
  const [hintVisible, setHintVisible] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectCell = useCallback(
    (row: number, col: number) => {
      if (row !== target.row || col !== target.col) {
        toast.message("Usá la celda resaltada en dorado.");
        return;
      }
      setSelectedCell({ row, col });
    },
    [target.col, target.row]
  );

  const placeNumber = useCallback(
    (n: number) => {
      if (success) return;
      if (!selectedCell || selectedCell.row !== target.row || selectedCell.col !== target.col) {
        toast.message("Seleccioná la celda dorada.");
        return;
      }
      if (n !== target.value) {
        setHintVisible(true);
        toast.error(lesson.hint);
        return;
      }
      const next = cloneBoard(board);
      next[target.row][target.col] = {
        ...next[target.row][target.col],
        value: n,
        notes: {},
        isError: false,
      };
      const updated = updateAllErrors(next);
      setBoard(updated);
      setSuccess(true);
      if (!xpGranted.current) {
        xpGranted.current = true;
        grantTutorialXp(30);
        onMarkComplete();
      }
      toast.success("¡Técnica dominada!");
    },
    [board, grantTutorialXp, lesson.hint, onMarkComplete, selectedCell, success, target, lesson]
  );

  useSudokuKeyboard({
    enabled: !success,
    onDigit: placeNumber,
    onErase: () => {},
    onUndo: () => {},
    onToggleNotes: () => {},
  });

  return (
    <div className="space-y-4 border-t border-border/40 pt-4">
      <div className="max-w-none text-sm">
        <p className="text-foreground">{lesson.description}</p>
        <p className="mt-2 text-muted-foreground">{lesson.explanation}</p>
      </div>
      {hintVisible ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Pista: {lesson.hint}
        </p>
      ) : null}
      <SudokuBoard
        board={board}
        selectedCell={selectedCell}
        onSelectCell={selectCell}
        sizeClassName="w-[min(90vw,400px)]"
        pulseTarget={{ row: target.row, col: target.col }}
      />
      <NumPad
        gridSize={9}
        board={board}
        onInput={placeNumber}
        disabled={success}
      />
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className="rounded-xl border border-primary/50 bg-primary/10 p-4 text-center"
        >
          <p className="font-serif text-lg text-gradient-gold">¡Técnica dominada!</p>
          <p className="mt-1 text-sm text-muted-foreground">+30 XP de práctica</p>
          <button
            type="button"
            className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium"
            onClick={onDismiss}
          >
            Seguir
          </button>
        </motion.div>
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
            Diez lecciones. En cada una resolvé la celda dorada con la técnica indicada.
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
                      onMarkComplete={() => markComplete(lesson.key)}
                      onDismiss={() => setOpenKey(null)}
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
