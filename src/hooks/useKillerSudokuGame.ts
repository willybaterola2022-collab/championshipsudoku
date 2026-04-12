import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { gameSounds } from "@/lib/gameSounds";
import { vibrateShort } from "@/lib/haptics";
import { isBoxFilled, isColFilled, isRowFilled } from "@/lib/sudoku/regionFilled";
import { useAuth } from "@/contexts/AuthContext";
import { generateKillerPuzzle } from "@/lib/sudoku/killer-generator";
import type { Cage } from "@/lib/sudoku/killer-types";
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
import { updateAllErrors } from "@/lib/sudoku/validator";
import { showSubmitResult } from "@/lib/submitFeedback";
import { sudokuService } from "@/lib/sudokuService";
import type { WinPayload } from "@/hooks/usePlayerProgress";

const STORAGE_KEY = "sudoku-killer-game-state";
const MAX_MISTAKES = 3;

export interface SelectedCell {
  row: number;
  col: number;
}

interface PersistedState {
  difficulty: Difficulty;
  solution: number[][];
  cages: Cage[];
  board: Board;
  selectedCell: SelectedCell | null;
  isNotesMode: boolean;
  timerSeconds: number;
  isPaused: boolean;
  isCompleted: boolean;
  mistakes: number;
  history: HistoryEntry[];
}

function deserialize(raw: string): PersistedState | null {
  try {
    const p = JSON.parse(raw) as PersistedState;
    if (!p.solution || !p.board || !p.cages) return null;
    return p;
  } catch {
    return null;
  }
}

function canPlaceKiller(
  values: (number | null)[][],
  cages: Cage[],
  row: number,
  col: number,
  num: number
): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && values[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && values[r][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && values[r][c] === num) return false;
    }
  }

  const cage = cages.find((c) => c.cells.some((p) => p.row === row && p.col === col));
  if (!cage) return true;

  let sum = 0;
  const seen = new Set<number>();
  for (const p of cage.cells) {
    const v = p.row === row && p.col === col ? num : values[p.row][p.col];
    if (v != null) {
      if (seen.has(v)) return false;
      seen.add(v);
      sum += v;
    }
  }
  if (sum > cage.sum) return false;
  const allFilled = cage.cells.every((p) => {
    const v = p.row === row && p.col === col ? num : values[p.row][p.col];
    return v != null;
  });
  if (allFilled && sum !== cage.sum) return false;
  return true;
}

function checkKillerComplete(board: Board, solution: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c].value == null) return false;
      if (board[r][c].value !== solution[r][c]) return false;
    }
  }
  return true;
}

export interface UseKillerOptions {
  onWin?: (payload: WinPayload) => void;
}

export function useKillerSudokuGame(opts: UseKillerOptions = {}) {
  const { user, refreshProfile } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [cages, setCages] = useState<Cage[]>([]);
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onWinRef = useRef(opts.onWin);
  onWinRef.current = opts.onWin;

  const persist = useCallback(() => {
    const state: PersistedState = {
      difficulty,
      solution,
      cages,
      board,
      selectedCell,
      isNotesMode,
      timerSeconds,
      isPaused,
      isCompleted,
      mistakes,
      history,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [
    board,
    cages,
    difficulty,
    history,
    isCompleted,
    isNotesMode,
    isPaused,
    mistakes,
    selectedCell,
    solution,
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
    tickRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isCompleted, isPaused]);

  const valuesFromBoard = useCallback((b: Board): (number | null)[][] => {
    return b.map((row) => row.map((c) => c.value));
  }, []);

  const newGame = useCallback(
    (d: Difficulty = difficulty) => {
      setGenerating(true);
      setDifficulty(d);
      queueMicrotask(() => {
        const killer = generateKillerPuzzle(d);
        setCages(killer.cages);
        setSolution(killer.solution);
        const empty = killer.puzzle.map((row) => row.map(() => 0));
        const givens = empty.map((row) => row.map(() => 0));
        const b = numbersToBoard(empty, givens);
        setBoard(updateAllErrors(b));
        setSelectedCell(null);
        setIsNotesMode(false);
        setTimerSeconds(0);
        setIsPaused(false);
        setIsCompleted(false);
        setMistakes(0);
        setHistory([]);
        setGenerating(false);
      });
    },
    [difficulty]
  );

  const loadGame = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const p = deserialize(raw);
      if (!p) return false;
      setDifficulty(p.difficulty);
      setCages(p.cages);
      setSolution(p.solution);
      setBoard(updateAllErrors(p.board));
      setSelectedCell(p.selectedCell);
      setIsNotesMode(p.isNotesMode);
      setTimerSeconds(p.timerSeconds);
      setIsPaused(p.isPaused);
      setIsCompleted(p.isCompleted);
      setMistakes(p.mistakes);
      setHistory(p.history);
      return true;
    } catch {
      return false;
    }
  }, []);

  const hasSavedGame = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return Boolean(raw && deserialize(raw));
    } catch {
      return false;
    }
  }, []);

  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    if (!hasSavedGame()) {
      newGame("medium");
    } else {
      loadGame();
    }
  }, [hasSavedGame, loadGame, newGame]);

  const placeNumber = useCallback(
    (n: number) => {
      if (isCompleted || isPaused || mistakes >= MAX_MISTAKES) return;
      if (!selectedCell) return;
      const { row, col } = selectedCell;

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

      const vals = valuesFromBoard(board);
      const nextVals = vals.map((r) => [...r]);
      if (!canPlaceKiller(nextVals, cages, row, col, n)) {
        toast.error("Movimiento inválido para Killer");
        return;
      }

      const next = cloneBoard(board);
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
          toast.message("Sin vidas");
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

      if (checkKillerComplete(updated, solution) && nextMistakes < MAX_MISTAKES) {
        setIsCompleted(true);
        gameSounds.playWin();
        const payload: WinPayload = {
          difficulty,
          variant: "killer",
          timeMs: timerSeconds * 1000,
          errors: nextMistakes,
          hintsUsed: 0,
        };
        void (async () => {
          if (!user) onWinRef.current?.(payload);
          const result = await sudokuService.submitPuzzleResult({
            puzzleId: null,
            difficulty,
            variant: "killer",
            timeMs: timerSeconds * 1000,
            errors: nextMistakes,
            hintsUsed: 0,
            boardState: boardToNumbers(updated),
            solution,
          });
          await showSubmitResult(result, refreshProfile);
        })();
      }
    },
    [
      board,
      cages,
      difficulty,
      isCompleted,
      isNotesMode,
      isPaused,
      mistakes,
      refreshProfile,
      selectedCell,
      solution,
      timerSeconds,
      user,
      valuesFromBoard,
    ]
  );

  const eraseCell = useCallback(() => {
    if (isCompleted || isPaused || !selectedCell) return;
    const { row, col } = selectedCell;
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

  const toggleNotes = useCallback(() => setIsNotesMode((v) => !v), []);
  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  const selectCell = useCallback(
    (row: number, col: number) => {
      if (isCompleted) return;
      setSelectedCell({ row, col });
    },
    [isCompleted]
  );

  const filledCount = board.flat().filter((c) => c.value != null).length;

  const useHint = useCallback(async () => {
    /* Killer: sin pistas en esta versión */
  }, []);

  return {
    difficulty,
    cages,
    solution,
    board,
    selectedCell,
    isNotesMode,
    timerSeconds,
    isPaused,
    isCompleted,
    mistakes,
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
    filledCount,
    maxMistakes: MAX_MISTAKES,
    hintsUsed: 0,
    hintsRemaining: 0,
    hintLoading: false,
    useHint,
    isOutOfLives: mistakes >= MAX_MISTAKES && !isCompleted,
  };
}
