import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { GameOverLost } from "@/components/GameOverLost";
import { BoardThemeSelector, readBoardTheme, writeBoardTheme, type BoardThemeId } from "@/components/sudoku/BoardThemeSelector";
import { DifficultySelector } from "@/components/sudoku/DifficultySelector";
import { GameControls } from "@/components/sudoku/GameControls";
import { GameResult } from "@/components/sudoku/GameResult";
import { HintCoachBanner } from "@/components/sudoku/HintCoachBanner";
import { NumPad } from "@/components/sudoku/NumPad";
import { PuzzleTechniqueBadge } from "@/components/sudoku/PuzzleTechniqueBadge";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { Timer } from "@/components/sudoku/Timer";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import { useUnlocks } from "@/hooks/useUnlocks";
import { useWinPostGameStats } from "@/hooks/useWinPostGameStats";
import { useSudokuGame } from "@/hooks/useSudokuGame";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import { supabase } from "@/integrations/supabase/client";
import { TECHNIQUE_LABELS, type Technique } from "@/lib/sudoku/solver";
import { formatTechniquesLine, getDetailedSolveSteps } from "@/lib/sudoku/solverDetailed";
import type { Difficulty } from "@/lib/sudoku/types";
import { DIFFICULTY_CONFIG } from "@/lib/sudoku/types";
import { cn } from "@/lib/utils";

type PlayVariant = "classic" | "diagonal";

interface SeededPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: Difficulty;
}

function defaultLocked(userPresent: boolean, level: number): Partial<Record<Difficulty, number>> {
  if (!userPresent) return {};
  const m: Partial<Record<Difficulty, number>> = {};
  if (level < 7) m.expert = 7;
  if (level < 11) m.fiendish = 11;
  return m;
}

function PlaySession({
  variant,
  seeded,
  sessionId,
  zenMode,
}: {
  variant: PlayVariant;
  seeded?: SeededPuzzle | null;
  sessionId: number;
  zenMode: boolean;
}) {
  const { user, profile } = useAuth();
  const { recordWin, progress } = usePlayerProgress();
  const { data: unlockRows } = useUnlocks();

  const lockedDifficulties = useMemo(() => {
    if (!user) return {};
    const m: Partial<Record<Difficulty, number>> = { ...defaultLocked(true, profile?.level ?? 1) };
    for (const row of unlockRows ?? []) {
      const k = row.key as string | undefined;
      const req = row.required_level as number | undefined;
      if (k === "difficulty_expert" && req != null) m.expert = req;
      if (k === "difficulty_fiendish" && req != null) m.fiendish = req;
    }
    return m;
  }, [user, profile?.level, unlockRows]);

  const [challengeBusy, setChallengeBusy] = useState(false);

  const game = useSudokuGame({
    onWin: zenMode ? undefined : recordWin,
    diagonal: variant === "diagonal",
    seeded: seeded ?? undefined,
    zen: zenMode,
    persistenceKey: zenMode ? "sudoku-zen-game-state" : undefined,
  });

  const winStats = useWinPostGameStats({
    userId: user?.id,
    isCompleted: game.isCompleted,
    difficulty: game.difficulty,
    timeMs: game.timerSeconds * 1000,
  });

  const [theme, setTheme] = useState<BoardThemeId>(() => readBoardTheme());
  const [replayHighlight, setReplayHighlight] = useState<number | null>(null);

  const techniquesLine = useMemo(() => {
    const a = game.solveAnalysis;
    if (!a?.techniquesUsed?.length) return "";
    return formatTechniquesLine(a.techniquesUsed as Technique[]);
  }, [game.solveAnalysis]);

  const replaySteps = useMemo(() => {
    if (!game.initialPuzzleNumbers) return [];
    return getDetailedSolveSteps(game.initialPuzzleNumbers);
  }, [game.initialPuzzleNumbers, game.isCompleted]);

  const showXWing = Boolean(game.solveAnalysis?.techniquesUsed?.includes("x_wing"));

  useSudokuKeyboard({
    enabled: !game.isCompleted && !game.isPaused && !game.isOutOfLives,
    onDigit: game.placeNumber,
    onErase: game.eraseCell,
    onUndo: game.undo,
    onToggleNotes: game.toggleNotes,
  });

  const themeClass = useMemo(
    () => (theme === "classic" ? "" : `board-theme-${theme}`),
    [theme]
  );

  const shareTimeLabel = `${Math.floor(game.timerSeconds / 60)}:${(game.timerSeconds % 60).toString().padStart(2, "0")}`;

  const createChallengeLink = async () => {
    if (!game.initialPuzzleNumbers) {
      toast.error("No hay puzzle inicial para desafiar.");
      return;
    }
    setChallengeBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string }>("sudoku-create-challenge", {
        body: {
          puzzle: JSON.stringify(game.initialPuzzleNumbers),
          solution: JSON.stringify(game.solution),
          difficulty: game.difficulty,
          variant: variant === "diagonal" ? "diagonal" : "classic",
          time_ms: game.timerSeconds * 1000,
          errors: game.mistakes,
        },
      });
      if (error) throw error;
      if (data?.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link copiado — envialo a tu amigo");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el desafío");
    } finally {
      setChallengeBusy(false);
    }
  };

  const autoNotesUnlocked = !user || (profile?.level ?? 1) >= 2;

  const lockedForSelector = zenMode ? {} : lockedDifficulties;

  return (
    <div
      className={cn("min-h-screen bg-background text-foreground", themeClass, zenMode && "zen-mode")}
      data-session={sessionId}
    >
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
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {zenMode ? "Zen" : DIFFICULTY_CONFIG[game.difficulty].label}
            </span>
            {!zenMode ? (
              <>
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
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Sin tiempo · errores libres</span>
            )}
          </div>
          <DifficultySelector
            value={game.difficulty}
            onChange={(d) => {
              if (lockedForSelector[d] != null && (profile?.level ?? 1) < lockedForSelector[d]!) {
                toast.message(`Desbloqueá nivel ${lockedForSelector[d]}`);
                return;
              }
              game.newGame(d);
            }}
            disabled={game.generating}
            locked={lockedForSelector}
          />
        </div>
      </header>

      <main className="container space-y-6 px-4 pb-12 pt-6">
        {!zenMode ? (
          <BoardThemeSelector value={theme} onChange={(id) => { setTheme(id); writeBoardTheme(id); }} />
        ) : null}

        {!zenMode && game.solveAnalysis ? (
          <PuzzleTechniqueBadge
            levelLabel={`lógica ${game.solveAnalysis.difficultyLabel}`}
            summary={techniquesLine ? `Técnicas: ${techniquesLine}` : "Puzzle analizado"}
          />
        ) : null}

        {!zenMode ? <HintCoachBanner state={game.hintCoach} /> : null}

        <div className="sudoku-play-layout flex flex-col gap-4">
          <SudokuBoard
            board={game.board}
            selectedCell={game.selectedCell}
            onSelectCell={game.selectCell}
            sizeClassName="w-[min(90vw,450px)] landscape:w-[min(55vh,450px)]"
            diagonal={variant === "diagonal"}
          />

          {!zenMode ? <ProgressBar filled={game.filledCount} /> : null}

          <GameControls
            canUndo={game.history.length > 0}
            notesActive={game.isNotesMode}
            onUndo={game.undo}
            onErase={game.eraseCell}
            onToggleNotes={game.toggleNotes}
            onHint={() => void game.useHint()}
            hintsRemaining={zenMode ? 9999 : game.hintsRemaining}
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
          />
        </div>
      </main>

      <GameResult
        open={game.isCompleted}
        timeMs={game.timerSeconds * 1000}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        onClose={() => game.newGame(game.difficulty)}
        zenMode={zenMode}
        shareVisualData={
          !zenMode
            ? {
                difficulty: DIFFICULTY_CONFIG[game.difficulty].label,
                timeFormatted: shareTimeLabel,
                errors: game.mistakes,
                percentile: winStats.percentile,
                streak: progress.streakDays,
                variant: variant === "diagonal" ? "Diagonal" : "Clásico",
              }
            : null
        }
        onChallengeFriend={zenMode ? undefined : createChallengeLink}
        challengeBusy={challengeBusy}
        percentile={winStats.percentile}
        showPersonalBestBadge={winStats.isPersonalBest}
        techniquesLine={techniquesLine || undefined}
        logicalDifficultyLabel={game.solveAnalysis?.difficultyLabel}
        showXWingBadge={showXWing}
        replaySteps={replaySteps}
        highlightStepIndex={replayHighlight}
        onSelectStep={setReplayHighlight}
        moveCount={game.moveCount}
        optimalSteps={game.solveAnalysis?.stepsCount}
      />
      <GameOverLost open={game.isOutOfLives} onNewGame={() => game.newGame(game.difficulty)} />
    </div>
  );
}

export default function Play() {
  const { user, profile } = useAuth();
  const { data: unlockRows } = useUnlocks();
  const [searchParams, setSearchParams] = useSearchParams();
  const variant = (searchParams.get("variant") as PlayVariant) || "classic";
  const zenMode = searchParams.get("mode") === "zen";

  const diagonalRequiredLevel = useMemo(() => {
    let req = 5;
    for (const row of unlockRows ?? []) {
      const k = row.key as string | undefined;
      const r = row.required_level as number | undefined;
      if (r == null || !k) continue;
      if (k === "variant_diagonal" || k === "diagonal") req = r;
    }
    return req;
  }, [unlockRows]);
  const [sessionId, setSessionId] = useState(0);
  const [seeded, setSeeded] = useState<SeededPuzzle | null>(null);
  const [techniqueFilter, setTechniqueFilter] = useState<Technique | "">("");
  const [fetchingPuzzle, setFetchingPuzzle] = useState(false);
  const loadFeaturedId = searchParams.get("loadFeatured");

  const diagonalLocked =
    Boolean(user) && (profile?.level ?? 1) < diagonalRequiredLevel;

  const setVariant = (v: PlayVariant) => {
    if (v === "diagonal" && diagonalLocked) {
      toast.message(`Desbloqueá diagonal al nivel ${diagonalRequiredLevel}`);
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (v === "classic") next.delete("variant");
    else next.set("variant", v);
    setSearchParams(next);
    setSeeded(null);
    setSessionId((k) => k + 1);
  };

  useEffect(() => {
    if (variant !== "diagonal" || !diagonalLocked) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("variant");
        return next;
      },
      { replace: true }
    );
    toast.message(`Diagonal requiere nivel ${diagonalRequiredLevel}`);
  }, [variant, diagonalLocked, setSearchParams, diagonalRequiredLevel]);

  const loadPuzzleByTechnique = async () => {
    if (!techniqueFilter) {
      toast.message("Elegí una técnica");
      return;
    }
    setFetchingPuzzle(true);
    try {
      const { data, error } = await supabase
        .from("sudoku_puzzles")
        .select("puzzle, solution, difficulty")
        .eq("variant", "classic")
        .contains("techniques_required", [techniqueFilter])
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data?.puzzle || !data.solution) {
        toast.error("No hay puzzle con esa técnica.");
        return;
      }
      const puzzle = JSON.parse(data.puzzle as string) as number[][];
      const solution = JSON.parse(data.solution as string) as number[][];
      setSeeded({
        puzzle,
        solution,
        difficulty: (data.difficulty as Difficulty) ?? "medium",
      });
      setSessionId((k) => k + 1);
      toast.success("Nuevo puzzle cargado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setFetchingPuzzle(false);
    }
  };

  useEffect(() => {
    if (!loadFeaturedId) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("sudoku_puzzles")
          .select("puzzle, solution, difficulty, variant")
          .eq("id", loadFeaturedId)
          .maybeSingle();
        if (error) throw error;
        if (!data?.puzzle || !data.solution) {
          toast.error("Puzzle no encontrado.");
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("loadFeatured");
              return next;
            },
            { replace: true }
          );
          return;
        }
        if (cancelled) return;
        const puzzle = JSON.parse(data.puzzle as string) as number[][];
        const solution = JSON.parse(data.solution as string) as number[][];
        setSeeded({
          puzzle,
          solution,
          difficulty: (data.difficulty as Difficulty) ?? "medium",
        });
        setSessionId((k) => k + 1);
        const v = data.variant as string | undefined;
        const canDiagonal = !user || (profile?.level ?? 1) >= diagonalRequiredLevel;
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("loadFeatured");
            if (v === "diagonal" && canDiagonal) next.set("variant", "diagonal");
            else next.delete("variant");
            return next;
          },
          { replace: true }
        );
        toast.success("Puzzle cargado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al cargar puzzle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFeaturedId, setSearchParams, user, profile?.level, diagonalRequiredLevel]);

  return (
    <>
      <div className="border-b border-border/40 bg-muted/20 px-4 py-3">
        <div className="container flex flex-wrap gap-2">
          {(
            [
              ["classic", "Clásico"],
              ["diagonal", "Diagonal"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              title={v === "diagonal" && diagonalLocked ? `Nivel ${diagonalRequiredLevel}` : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm",
                variant === v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              )}
              onClick={() => setVariant(v)}
            >
              {label}
              {v === "diagonal" && diagonalLocked ? " 🔒" : ""}
            </button>
          ))}
          <Link
            to="/play/killer"
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-primary"
          >
            Killer
          </Link>
          <Link
            to="/play/mini"
            className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-primary"
          >
            Mini 6×6
          </Link>
        </div>
        <div className="container mt-3 flex max-w-md flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
            value={techniqueFilter}
            onChange={(e) => setTechniqueFilter(e.target.value as Technique | "")}
          >
            <option value="">Filtrar por técnica…</option>
            {(Object.keys(TECHNIQUE_LABELS) as Technique[]).map((t) => (
              <option key={t} value={t}>
                {TECHNIQUE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={fetchingPuzzle}
            className="rounded-lg border border-primary px-3 py-2 text-sm text-primary"
            onClick={() => void loadPuzzleByTechnique()}
          >
            {fetchingPuzzle ? "Buscando…" : "Cargar puzzle"}
          </button>
        </div>
      </div>

      <PlaySession key={sessionId} variant={variant} seeded={seeded} sessionId={sessionId} zenMode={zenMode} />
    </>
  );
}
