import { useCallback, useMemo, useState } from "react";
import { TUTORIAL_LESSONS } from "@/lib/sudoku/tutorials";

const STORAGE_KEY = "sudoku-tutorial-progress";

function readCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeCompleted(keys: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

export function useTutorialProgress() {
  const [completed, setCompleted] = useState<Set<string>>(() => readCompleted());

  const markComplete = useCallback((key: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(key);
      writeCompleted(next);
      return next;
    });
  }, []);

  const lessons = useMemo(
    () => [...TUTORIAL_LESSONS].sort((a, b) => a.order - b.order),
    []
  );

  const completedCount = useMemo(() => {
    if (!lessons.length) return 0;
    return lessons.filter((l) => completed.has(l.key)).length;
  }, [lessons, completed]);

  const isUnlocked = useCallback(
    (order: number) => {
      if (order <= 1) return true;
      const prev = lessons.find((l) => l.order === order - 1);
      return prev ? completed.has(prev.key) : true;
    },
    [lessons, completed]
  );

  return {
    lessons,
    completedKeys: completed,
    completedCount,
    markComplete,
    isUnlocked,
  };
}
