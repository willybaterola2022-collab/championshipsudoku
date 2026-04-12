import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generatePuzzle } from "@/lib/sudoku/generator";
import {
  boardToNumbers,
  cloneBoard,
  createEmptyBoard,
  numbersToBoard,
  type Board,
  type CellNotes,
  type Difficulty,
  type HistoryEntry,
} from "@/lib/sudoku/types";
import { checkCompletion, updateAllErrors } from "@/lib/sudoku/validator";
import { showSubmitResult } from "@/lib/submitFeedback";
import { sudokuService } from "@/lib/sudokuService";
import type { WinPayload } from "@/hooks/usePlayerProgress";

const DEFAULT_PERSISTENCE_KEY = "sudoku-game-state";
const MAX_HINTS = 3;
const MAX_MISTAKES = 3;

export interface SelectedCell {
  row: number;
  col: number;
}

interface PersistedState {
  difficulty: Difficulty;
  solution: number[][];
  board: Board;
  selectedCell: SelectedCell | null;
  isNotesMode: boolean;
  timerSeconds: number;
  isPaused: boolean;
  isCompleted: boolean;
  mistakes: number;
  hintsUsed: number;
  history: HistoryEntry[];
}

function serialize(state: Omit<PersistedState, never>): string {
  return JSON.stringify(state);
}

function deserialize(raw: string): PersistedState | null {
  try {
    const p = JSON.parse(raw) as PersistedState;
    if (!p.solution || !p.board) return null;
    return p;
  } catch {
    return null;
  }
}

export interface UseSudokuGameOptions {
  onWin?: (payload: WinPayload) => void;
  /** Default `sudoku-game-state`. Use a different key for daily route so it does not overwrite classic progress. */
  persistenceKey?: string;
  /** When set, initial load uses this puzzle instead of generating a random one. */
  seeded?: {
    puzzle: number[][];
    solution: number[][];
    difficulty: Difficulty;
  };
  /** When set, completed games call `sudoku-daily-submit` via service flags. */
  dailyMeta?: { challengeId: string; puzzleId: string | null };
}

export function useSudokuGame(opts: UseSudokuGameOptions = {}) {
  const { user, refreshProfile } = useAuth();
  const storageKey = opts.persistenceKey ?? DEFAULT_PERSISTENCE_KEY;
  const dailyMeta = opts.dailyMeta;
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [solution, setSolution] = useState<number[][]>(() =>
    Array.from({ length: 9 }, () => Array(9).fill(0))
  );
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintLoading, setHintLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onWinRef = useRef(opts.onWin);
  onWinRef.current = opts.onWin;

  const persist = useCallback(() => {
    const state: PersistedState = {
      difficulty,
      solution,
      board,
      selectedCell,
      isNotesMode,
      timerSeconds,
      isPaused,
      isCompleted,
      mistakes,
      hintsUsed,
      history,
    };
    try {
      localStorage.setItem(storageKey, serialize(state));
    } catch {
      /* ignore */
    }
  }, [
    board,
    difficulty,
    history,
    hintsUsed,
    isCompleted,
    isNotesMode,
    isPaused,
    mistakes,
    selectedCell,
    solution,
    storageKey,
    timerSeconds,
  ]);

  useEffect(() => {
    persist();
  }, [persist]);

  useEffect(() => {
    if (isCompleted || isPaused) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isCompleted, isPaused]);

  const applySeed = useCallback((seed: { puzzle: number[][]; solution: number[][]; difficulty: Difficulty }) => {
    queueMicrotask(() => {
      const givens = seed.puzzle.map((row) => row.map((v) => (v !== 0 ? 1 : 0)));
      const b = numbersToBoard(seed.puzzle, givens);
      const withErrors = updateAllErrors(b);
      setSolution(seed.solution);
      setBoard(withErrors);
      setDifficulty(seed.difficulty);
      setSelectedCell(null);
      setIsNotesMode(false);
      setTimerSeconds(0);
      setIsPaused(false);
      setIsCompleted(false);
      setMistakes(0);
      setHintsUsed(0);
      setHistory([]);
      setGenerating(false);
    });
  }, []);

  const newGame = useCallback(
    (d: Difficulty = difficulty) => {
      if (dailyMeta && opts.seeded) {
        applySeed(opts.seeded);
        return;
      }
      setGenerating(true);
      setDifficulty(d);
      queueMicrotask(() => {
        const gen = generatePuzzle(d);
        const givens = gen.puzzle.map((row) => row.map((v) => (v !== 0 ? 1 : 0)));
        const b = numbersToBoard(gen.puzzle, givens);
        const withErrors = updateAllErrors(b);
        setSolution(gen.solution);
        setBoard(withErrors);
        setSelectedCell(null);
        setIsNotesMode(false);
        setTimerSeconds(0);
        setIsPaused(false);
        setIsCompleted(false);
        setMistakes(0);
        setHintsUsed(0);
        setHistory([]);
        setGenerating(false);
      });
    },
    [applySeed, dailyMeta, difficulty, opts.seeded]
  );

  const loadGame = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return false;
      const p = deserialize(raw);
      if (!p) return false;
      setDifficulty(p.difficulty);
      setSolution(p.solution);
      setBoard(updateAllErrors(p.board));
      setSelectedCell(p.selectedCell);
      setIsNotesMode(p.isNotesMode);
      setTimerSeconds(p.timerSeconds);
      setIsPaused(p.isPaused);
      setIsCompleted(p.isCompleted);
      setMistakes(p.mistakes);
      setHintsUsed(p.hintsUsed);
      setHistory(p.history);
      return true;
    } catch {
      return false;
    }
  }, [storageKey]);

  const hasSavedGame = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return Boolean(raw && deserialize(raw));
    } catch {
      return false;
    }
  }, [storageKey]);

  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    if (opts.seeded) {
      applySeed(opts.seeded);
      return;
    }
    if (!hasSavedGame()) {
      newGame("medium");
    } else {
      loadGame();
    }
  }, [applySeed, hasSavedGame, loadGame, newGame, opts.seeded]);

  const placeNumber = useCallback(
    (n: number) => {
      if (isCompleted || isPaused || mistakes >= MAX_MISTAKES) return;
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      if (board[row][col].isGiven) return;

      const prev = board[row][col];
      const prevValue = prev.value;
      const prevNotes = { ...prev.notes };

      if (isNotesMode) {
        const notes: CellNotes = { ...prev.notes };
        if (notes[n]) delete notes[n];
        else notes[n] = true;
        const next = cloneBoard(board);
        next[row][col] = { ...next[row][col], value: null, notes };
        setBoard(updateAllErrors(next));
        setHistory((h) => [
          ...h,
          {
            row,
            col,
            previousValue: prevValue,
            previousNotes: prevNotes,
            newValue: null,
            newNotes: { ...notes },
          },
        ]);
        return;
      }

      const next = cloneBoard(board);
      if (next[row][col].value === n) return;

      next[row][col] = {
        ...next[row][col],
        value: n,
        notes: {},
      };
      let nextMistakes = mistakes;
      if (n !== solution[row][col]) {
        nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        toast.error("Ese número no va ahí");
        if (nextMistakes >= MAX_MISTAKES) {
          toast.message("Sin vidas", { description: "Reiniciá o empezá una partida nueva." });
        }
      }

      const updated = updateAllErrors(next);
      setBoard(updated);
      setHistory((h) => [
        ...h,
        {
          row,
          col,
          previousValue: prevValue,
          previousNotes: prevNotes,
          newValue: n,
          newNotes: {},
        },
      ]);

      if (checkCompletion(updated) && nextMistakes < MAX_MISTAKES) {
        setIsCompleted(true);
        const payload: WinPayload = {
          difficulty,
          variant: "classic",
          timeMs: timerSeconds * 1000,
          errors: nextMistakes,
          hintsUsed,
        };
        void (async () => {
          if (!user) onWinRef.current?.(payload);
          const result = await sudokuService.submitPuzzleResult({
            puzzleId: dailyMeta?.puzzleId ?? null,
            difficulty,
            variant: "classic",
            timeMs: timerSeconds * 1000,
            errors: nextMistakes,
            hintsUsed,
            boardState: boardToNumbers(updated),
            solution,
            isDaily: Boolean(dailyMeta),
            challengeId: dailyMeta?.challengeId ?? null,
          });
          await showSubmitResult(result, refreshProfile);
        })();
      }
    },
    [
      board,
      dailyMeta,
      difficulty,
      hintsUsed,
      isCompleted,
      isNotesMode,
      isPaused,
      mistakes,
      refreshProfile,
      selectedCell,
      solution,
      timerSeconds,
      user,
    ]
  );

  const eraseCell = useCallback(() => {
    if (isCompleted || isPaused || !selectedCell) return;
    const { row, col } = selectedCell;
    if (board[row][col].isGiven) return;
    const prev = board[row][col];
    const next = cloneBoard(board);
    next[row][col] = { ...next[row][col], value: null, notes: {} };
    setBoard(updateAllErrors(next));
    setHistory((h) => [
      ...h,
      {
        row,
        col,
        previousValue: prev.value,
        previousNotes: { ...prev.notes },
        newValue: null,
        newNotes: {},
      },
    ]);
  }, [board, isCompleted, isPaused, selectedCell]);

  const undo = useCallback(() => {
    if (isCompleted || history.length === 0) return;
    const last = history[history.length - 1];
    const next = cloneBoard(board);
    next[last.row][last.col] = {
      ...next[last.row][last.col],
      value: last.previousValue,
      notes: { ...last.previousNotes },
    };
    setBoard(updateAllErrors(next));
    setHistory((h) => h.slice(0, -1));
  }, [board, history, isCompleted]);

  const toggleNotes = useCallback(() => {
    setIsNotesMode((v) => !v);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    if (isCompleted) return;
    setSelectedCell({ row, col });
  }, [isCompleted]);

  const useHint = useCallback(async () => {
    if (isCompleted || isPaused || hintLoading) return;
    if (!selectedCell) {
      toast.message("Seleccioná una celda");
      return;
    }
    if (hintsUsed >= MAX_HINTS) return;
    const { row, col } = selectedCell;
    if (board[row][col].isGiven) return;

    const val = solution[row][col];
    setHintLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        value?: number;
        explanation?: string;
      }>("sudoku-hint", {
        body: {
          board: boardToNumbers(board),
          row,
          col,
          solution,
        },
      });
      if (error) {
        toast.error("No pudimos obtener la pista del servidor. Aplicamos una pista local.");
      }
      if (!error && data?.value != null) {
        if (data.explanation) toast.message("Pista", { description: data.explanation });
        const next = cloneBoard(board);
        next[row][col] = {
          ...next[row][col],
          value: data.value,
          notes: {},
        };
        const updated = updateAllErrors(next);
        setBoard(updated);
        setHintsUsed((h) => h + 1);
        setHistory((hist) => [
          ...hist,
          {
            row,
            col,
            previousValue: board[row][col].value,
            previousNotes: { ...board[row][col].notes },
            newValue: data.value ?? null,
            newNotes: {},
          },
        ]);
        if (checkCompletion(updated)) {
          setIsCompleted(true);
          const payload: WinPayload = {
            difficulty,
            variant: "classic",
            timeMs: timerSeconds * 1000,
            errors: mistakes,
            hintsUsed: hintsUsed + 1,
          };
          void (async () => {
            if (!user) onWinRef.current?.(payload);
            const result = await sudokuService.submitPuzzleResult({
              puzzleId: dailyMeta?.puzzleId ?? null,
              difficulty,
              variant: "classic",
              timeMs: timerSeconds * 1000,
              errors: mistakes,
              hintsUsed: hintsUsed + 1,
              boardState: boardToNumbers(updated),
              solution,
              isDaily: Boolean(dailyMeta),
              challengeId: dailyMeta?.challengeId ?? null,
            });
            await showSubmitResult(result, refreshProfile);
          })();
        }
      } else {
        const next = cloneBoard(board);
        next[row][col] = { ...next[row][col], value: val, notes: {} };
        const updated = updateAllErrors(next);
        setBoard(updated);
        setHintsUsed((h) => h + 1);
        setHistory((hist) => [
          ...hist,
          {
            row,
            col,
            previousValue: board[row][col].value,
            previousNotes: { ...board[row][col].notes },
            newValue: val,
            newNotes: {},
          },
        ]);
        if (!error) toast.message("Pista aplicada");
        if (checkCompletion(updated)) {
          setIsCompleted(true);
          const payload: WinPayload = {
            difficulty,
            variant: "classic",
            timeMs: timerSeconds * 1000,
            errors: mistakes,
            hintsUsed: hintsUsed + 1,
          };
          void (async () => {
            if (!user) onWinRef.current?.(payload);
            const result = await sudokuService.submitPuzzleResult({
              puzzleId: dailyMeta?.puzzleId ?? null,
              difficulty,
              variant: "classic",
              timeMs: timerSeconds * 1000,
              errors: mistakes,
              hintsUsed: hintsUsed + 1,
              boardState: boardToNumbers(updated),
              solution,
              isDaily: Boolean(dailyMeta),
              challengeId: dailyMeta?.challengeId ?? null,
            });
            await showSubmitResult(result, refreshProfile);
          })();
        }
      }
    } catch {
      toast.error("No pudimos obtener la pista. Intentá de nuevo.");
    } finally {
      setHintLoading(false);
    }
  }, [
    board,
    dailyMeta,
    difficulty,
    hintLoading,
    hintsUsed,
    isCompleted,
    isPaused,
    mistakes,
    refreshProfile,
    selectedCell,
    solution,
    timerSeconds,
    user,
  ]);

  const filledCount = board.flat().filter((c) => c.value != null).length;

  return {
    difficulty,
    setDifficulty: (d: Difficulty) => newGame(d),
    solution,
    board,
    selectedCell,
    isNotesMode,
    timerSeconds,
    isPaused,
    isCompleted,
    mistakes,
    hintsUsed,
    hintLoading,
    history,
    generating,
    newGame,
    loadGame,
    hasSavedGame,
    placeNumber,
    eraseCell,
    undo,
    toggleNotes,
    togglePause,
    selectCell,
    useHint,
    setSelectedCell,
    filledCount,
    maxMistakes: MAX_MISTAKES,
    hintsRemaining: MAX_HINTS - hintsUsed,
  };
}
