import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FEATURES } from "@/config";
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
import { gameSounds } from "@/lib/gameSounds";
import { vibrateShort } from "@/lib/haptics";
import { isBoxFilled, isColFilled, isRowFilled } from "@/lib/sudoku/regionFilled";
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
  /** Speed challenge: al ganar solo se llama `sudoku-speed-submit`, no `sudoku-save-game`. */
  speedMeta?: { challengeId: string };
}

export function useSudokuGame(opts: UseSudokuGameOptions = {}) {
  const { user, refreshProfile } = useAuth();
  const storageKey = opts.persistenceKey ?? DEFAULT_PERSISTENCE_KEY;
  const dailyMeta = opts.dailyMeta;
  const speedMeta = opts.speedMeta;
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
  /** Misma celda: pista nivel 1 → 2 → 3 (cada uno consume 1 uso). */
  const [hintChain, setHintChain] = useState<{ row: number; col: number; nextLevel: 1 | 2 | 3 } | null>(null);
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
      if (speedMeta && opts.seeded) {
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
    [applySeed, dailyMeta, difficulty, opts.seeded, speedMeta]
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

  const finalizeWin = useCallback(
    async (updated: Board, hintsUsedFinal: number, mistakesFinal: number) => {
      const payload: WinPayload = {
        difficulty,
        variant: "classic",
        timeMs: timerSeconds * 1000,
        errors: mistakesFinal,
        hintsUsed: hintsUsedFinal,
      };
      if (!user) onWinRef.current?.(payload);

      if (speedMeta) {
        try {
          const { data, error } = await supabase.functions.invoke<{ rank?: number; total?: number }>(
            "sudoku-speed-submit",
            {
              body: {
                challenge_id: speedMeta.challengeId,
                time_ms: timerSeconds * 1000,
                errors: mistakesFinal,
              },
            }
          );
          if (error) throw error;
          if (data?.rank != null && data?.total != null) {
            toast.success(`Puesto #${data.rank} de ${data.total}`);
          } else {
            toast.success("Tiempo registrado");
          }
          await refreshProfile();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "No se pudo enviar el tiempo del speed");
        }
        return;
      }

      const result = await sudokuService.submitPuzzleResult({
        puzzleId: dailyMeta?.puzzleId ?? null,
        difficulty,
        variant: "classic",
        timeMs: timerSeconds * 1000,
        errors: mistakesFinal,
        hintsUsed: hintsUsedFinal,
        boardState: boardToNumbers(updated),
        solution,
        isDaily: Boolean(dailyMeta),
        challengeId: dailyMeta?.challengeId ?? null,
      });
      await showSubmitResult(result, refreshProfile);
    },
    [dailyMeta, difficulty, refreshProfile, solution, speedMeta, timerSeconds, user]
  );

  useEffect(() => {
    if (!selectedCell) {
      setHintChain(null);
      return;
    }
    setHintChain((prev) => {
      if (prev && prev.row === selectedCell.row && prev.col === selectedCell.col) return prev;
      return { row: selectedCell.row, col: selectedCell.col, nextLevel: 1 };
    });
  }, [selectedCell]);

  const useHint = useCallback(async () => {
    if (!FEATURES.hints) {
      toast.message("Pistas desactivadas en esta build.");
      return;
    }
    if (isCompleted || isPaused || hintLoading) return;
    if (!selectedCell) {
      toast.message("Seleccioná una celda");
      return;
    }
    if (hintsUsed >= MAX_HINTS) return;
    const { row, col } = selectedCell;
    if (board[row][col].isGiven) return;

    const hintLevel =
      hintChain && hintChain.row === row && hintChain.col === col ? hintChain.nextLevel : 1;

    const val = solution[row][col];
    setHintLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        level?: number;
        zone?: string | null;
        technique?: string | null;
        value?: number | null;
        explanation?: string | null;
      }>("sudoku-hint", {
        body: {
          board: boardToNumbers(board),
          row,
          col,
          solution,
          level: hintLevel,
        },
      });

      if (error) {
        toast.error("No pudimos obtener la pista del servidor. Aplicamos una pista local.");
      }

      // Niveles 1–2: solo orientación, sin colocar dígito (consume 1 pista cada uno).
      if (!error && data && (data.value === null || data.value === undefined) && hintLevel <= 2) {
        if (hintLevel === 1 && data.zone) {
          toast.message("Pista — zona", { description: data.zone });
        } else if (hintLevel === 2) {
          toast.message(data.technique ?? "Técnica", {
            description: data.explanation ?? "Seguí analizando la celda.",
          });
        } else {
          toast.message("Pista", { description: "Seguí con el siguiente nivel de ayuda." });
        }
        setHintsUsed((h) => h + 1);
        setHintChain({ row, col, nextLevel: (hintLevel + 1) as 2 | 3 });
        return;
      }

      const placed = !error && data?.value != null && data.value !== undefined ? data.value : val;
      if (!error && data?.value != null && data.explanation) {
        toast.message("Pista", { description: data.explanation });
      } else if (error) {
        /* ya mostramos error arriba; colocamos valor local */
      } else if (!data?.value) {
        toast.message("Pista aplicada");
      }

      const next = cloneBoard(board);
      next[row][col] = { ...next[row][col], value: placed, notes: {} };
      const updated = updateAllErrors(next);
      setBoard(updated);
      setHintsUsed((h) => h + 1);
      setHintChain(null);
      setHistory((hist) => [
        ...hist,
        {
          row,
          col,
          previousValue: board[row][col].value,
          previousNotes: { ...board[row][col].notes },
          newValue: placed,
          newNotes: {},
        },
      ]);

      if (checkCompletion(updated)) {
        setIsCompleted(true);
        gameSounds.playWin();
        void finalizeWin(updated, hintsUsed + 1, mistakes);
      }
    } catch {
      toast.error("No pudimos obtener la pista. Intentá de nuevo.");
    } finally {
      setHintLoading(false);
    }
  }, [
    board,
    difficulty,
    finalizeWin,
    hintChain,
    hintLoading,
    hintsUsed,
    isCompleted,
    isPaused,
    mistakes,
    selectedCell,
    solution,
  ]);

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
        gameSounds.playError();
        toast.error("Ese número no va ahí");
        if (nextMistakes >= MAX_MISTAKES) {
          toast.message("Sin vidas", { description: "Reiniciá o empezá una partida nueva." });
        }
      } else {
        gameSounds.playCell();
      }

      const updated = updateAllErrors(next);
      setBoard(updated);

      if (!isNotesMode) {
        const br = Math.floor(row / 3);
        const bc = Math.floor(col / 3);
        const rowHadEmpty = board[row].some((c) => c.value == null);
        const colHadEmpty = board.some((r) => r[col].value == null);
        let boxHadEmpty = false;
        for (let r = br * 3; r < br * 3 + 3; r++) {
          for (let c = bc * 3; c < bc * 3 + 3; c++) {
            if (board[r][c].value == null) {
              boxHadEmpty = true;
              break;
            }
          }
          if (boxHadEmpty) break;
        }
        if (rowHadEmpty && isRowFilled(updated, row)) vibrateShort();
        else if (colHadEmpty && isColFilled(updated, col)) vibrateShort();
        else if (boxHadEmpty && isBoxFilled(updated, br, bc)) vibrateShort();
      }
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
        gameSounds.playWin();
        void finalizeWin(updated, hintsUsed, nextMistakes);
      }
    },
    [
      board,
      difficulty,
      finalizeWin,
      hintsUsed,
      isCompleted,
      isNotesMode,
      isPaused,
      mistakes,
      selectedCell,
      solution,
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
    isOutOfLives: mistakes >= MAX_MISTAKES && !isCompleted,
    nextHintLevel:
      selectedCell &&
      hintChain &&
      hintChain.row === selectedCell.row &&
      hintChain.col === selectedCell.col
        ? hintChain.nextLevel
        : 1,
  };
}
