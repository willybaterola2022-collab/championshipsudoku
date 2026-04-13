import { Leaf, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useFeaturedPuzzles } from "@/hooks/useFeaturedPuzzles";
import { GameOverLost } from "@/components/GameOverLost";
import { HowToPlayDialog } from "@/components/HowToPlayDialog";
import { Navbar } from "@/components/Navbar";
import { BoardThemeSelector, readBoardTheme, writeBoardTheme, type BoardThemeId } from "@/components/sudoku/BoardThemeSelector";
import { GameModePreview } from "@/components/sudoku/GameModePreview";
import { DailyCountdown } from "@/components/sudoku/DailyCountdown";
import { DifficultySelector } from "@/components/sudoku/DifficultySelector";
import { GameControls } from "@/components/sudoku/GameControls";
import { GameResult } from "@/components/sudoku/GameResult";
import { NumPad } from "@/components/sudoku/NumPad";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { StreakCounter } from "@/components/sudoku/StreakCounter";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { WeeklyMissions } from "@/components/sudoku/WeeklyMissions";
import { XPBar } from "@/components/sudoku/XPBar";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayerProgress } from "@/hooks/usePlayerProgress";
import { useWinPostGameStats } from "@/hooks/useWinPostGameStats";
import { useSudokuGame } from "@/hooks/useSudokuGame";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTY_CONFIG, type Difficulty } from "@/lib/sudoku/types";
import { cn } from "@/lib/utils";

const HOWTO_KEY = "sudoku-first-visit-help-v1";

export default function Landing() {
  const { user } = useAuth();
  const { progress, rank, recordWin, tutorialXpPending } = usePlayerProgress();
  const game = useSudokuGame({ onWin: recordWin });
  const winStats = useWinPostGameStats({
    userId: user?.id,
    isCompleted: game.isCompleted,
    difficulty: game.difficulty,
    timeMs: game.timerSeconds * 1000,
  });
  const [theme, setTheme] = useState<BoardThemeId>(() => readBoardTheme());
  const [helpOpen, setHelpOpen] = useState(false);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const { data: featuredRows, isLoading: featuredLoading } = useFeaturedPuzzles(5);

  useEffect(() => {
    try {
      if (localStorage.getItem(HOWTO_KEY) !== "1") setHelpOpen(true);
    } catch {
      setHelpOpen(true);
    }
  }, []);

  const themeClass = useMemo(
    () => (theme === "classic" ? "" : `board-theme-${theme}`),
    [theme]
  );

  useSudokuKeyboard({
    enabled: !game.isCompleted && !game.isPaused && !game.isOutOfLives,
    onDigit: game.placeNumber,
    onErase: game.eraseCell,
    onUndo: game.undo,
    onToggleNotes: game.toggleNotes,
  });

  const onThemeChange = (id: BoardThemeId) => {
    setTheme(id);
    writeBoardTheme(id);
  };

  const shareTimeLabel = `${Math.floor(game.timerSeconds / 60)}:${(game.timerSeconds % 60).toString().padStart(2, "0")}`;

  const todayStr = new Date().toISOString().slice(0, 10);
  const playedToday = progress.lastPlayedDate === todayStr;

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
          variant: "classic",
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

  return (
    <div className={cn("min-h-screen bg-background text-foreground", themeClass)}>
      <Navbar />
      <HowToPlayDialog
        open={helpOpen}
        onOpenChange={(v) => {
          setHelpOpen(v);
          if (!v) {
            try {
              localStorage.setItem(HOWTO_KEY, "1");
            } catch {
              /* ignore */
            }
          }
        }}
        onDismiss={() => {
          try {
            localStorage.setItem(HOWTO_KEY, "1");
          } catch {
            /* ignore */
          }
          setHelpOpen(false);
        }}
      />
      <main className="container space-y-8 px-4 pb-10 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl text-gradient-gold sm:text-5xl">Sudoku</h1>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              ¿Cómo juego?
            </button>
            <DifficultySelector
              value={game.difficulty}
              onChange={(d) => game.newGame(d)}
              disabled={game.generating}
            />
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <Link
              to="/play?mode=zen"
              className="glass inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-4 py-2 text-sm font-medium text-emerald-200/90 transition hover:border-emerald-500/50"
            >
              <Leaf className="h-4 w-4" aria-hidden />
              Modo Zen
            </Link>
            <Link
              to="/play"
              className="glass hidden rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:border-primary/50 hover:bg-primary/10 sm:inline-flex"
            >
              Vista amplia
            </Link>
          </div>
        </div>

        <section className="space-y-3" aria-labelledby="modes-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="modes-heading" className="font-serif text-lg tracking-tight text-foreground sm:text-xl">
                Modos de juego
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Deslizá en el celular · En escritorio, grilla completa.
              </p>
            </div>
          </div>
          <div
            className={cn(
              "-mx-4 flex gap-3 overflow-x-auto scroll-pl-4 scroll-pr-4 px-4 pb-2 pt-0.5 [scrollbar-width:thin] snap-x snap-mandatory",
              "md:mx-0 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:px-0 md:pb-0 md:snap-none lg:grid-cols-5"
            )}
          >
            <div
              className="relative min-w-[min(86vw,280px)] shrink-0 snap-center overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-b from-primary/10 to-card/40 p-4 shadow-[0_0_0_1px_hsla(43,90%,55%,0.12)] md:min-w-0"
              aria-current="page"
            >
              <div className="mb-3 rounded-lg bg-muted/40 p-2 ring-1 ring-border/45">
                <GameModePreview mode="home" />
              </div>
              <p className="text-sm font-semibold text-foreground">Inicio</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">Clásico 9×9 en esta página.</p>
            </div>
            <Link
              to="/play"
              className="group relative min-w-[min(86vw,280px)] shrink-0 snap-center overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/90 to-muted/15 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 md:min-w-0"
            >
              <div className="mb-3 rounded-lg bg-muted/40 p-2 ring-1 ring-border/45 transition group-hover:ring-primary/25">
                <GameModePreview mode="wide" />
              </div>
              <p className="text-sm font-semibold text-foreground">Vista amplia</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">HUD completo, filtros y técnicas.</p>
            </Link>
            <Link
              to="/play?variant=diagonal"
              className="group relative min-w-[min(86vw,280px)] shrink-0 snap-center overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/90 to-muted/15 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 md:min-w-0"
            >
              <div className="mb-3 rounded-lg bg-muted/40 p-2 ring-1 ring-border/45 transition group-hover:ring-primary/25">
                <GameModePreview mode="diagonal" />
              </div>
              <p className="text-sm font-semibold text-foreground">Diagonal</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">Diagonales únicas 1–9.</p>
            </Link>
            <Link
              to="/play/mini"
              className="group relative min-w-[min(86vw,280px)] shrink-0 snap-center overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/90 to-muted/15 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 md:min-w-0"
            >
              <div className="mb-3 rounded-lg bg-muted/40 p-2 ring-1 ring-border/45 transition group-hover:ring-primary/25">
                <GameModePreview mode="mini" />
              </div>
              <p className="text-sm font-semibold text-foreground">Mini 6×6</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">Cajas 2×3, números 1–6.</p>
            </Link>
            <Link
              to="/play/killer"
              className="group relative min-w-[min(86vw,280px)] shrink-0 snap-center overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/90 to-muted/15 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 md:min-w-0"
            >
              <div className="mb-3 rounded-lg bg-muted/40 p-2 ring-1 ring-border/45 transition group-hover:ring-primary/25">
                <GameModePreview mode="killer" />
              </div>
              <p className="text-sm font-semibold text-foreground">Killer</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">Jaulas y sumas.</p>
            </Link>
          </div>
        </section>

        <section className="space-y-2" aria-labelledby="theme-heading">
          <h2 id="theme-heading" className="font-serif text-lg tracking-tight text-foreground sm:text-xl">
            Apariencia del tablero
          </h2>
          <p className="text-sm text-muted-foreground">Colores y contraste (se guarda en este dispositivo).</p>
          <BoardThemeSelector value={theme} onChange={onThemeChange} />
        </section>

        {featuredLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-muted/40" data-placeholder />
        ) : featuredRows && featuredRows.length > 0 ? (
          <section className="space-y-4" aria-labelledby="featured-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" aria-hidden />
                  <h2 id="featured-heading" className="font-serif text-xl text-gradient-gold sm:text-2xl">
                    Destacados
                  </h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Selección del catálogo — tocá para abrir en vista amplia.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featuredRows.map((p, i) => {
                const diff = (p.difficulty as Difficulty) ?? "medium";
                return (
                  <article
                    key={p.id}
                    className="relative flex flex-col overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.07] via-card/50 to-card/80 p-5 shadow-[inset_0_1px_0_0_hsla(43,90%,55%,0.12)] transition hover:border-amber-500/35"
                  >
                    <span className="absolute right-3 top-3 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">
                      {DIFFICULTY_CONFIG[diff].label}
                    </span>
                    <p className="pr-16 font-serif text-lg text-foreground">Destacado {i + 1}</p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {(p.techniques_required?.length ?? 0) > 0
                        ? "Curado por técnicas del solver — ideal para practicar patrones."
                        : "Elegido por el equipo para retos equilibrados."}
                    </p>
                    <Link
                      to={`/play?loadFeatured=${p.id}`}
                      className="mt-4 inline-flex w-fit items-center justify-center rounded-full bg-primary/90 px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary"
                    >
                      Jugar ahora
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="sudoku-play-layout flex flex-col items-stretch gap-4 lg:flex-col">
          <div className="sudoku-board-wrap relative mx-auto w-full max-w-[520px]">
            <SudokuBoard
              board={game.board}
              selectedCell={game.selectedCell}
              onSelectCell={game.selectCell}
              animateStagger
            />
          </div>

          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4 landscape:max-h-[min(85vh,900px)] landscape:flex-row landscape:items-start landscape:justify-center">
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
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/40 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <StreakCounter days={progress.streakDays} playedToday={playedToday} />
              <DailyCountdown />
            </div>
          </div>
          <XPBar
            progress={progress}
            rank={rank}
            tutorialXpPending={tutorialXpPending}
            className="w-full sm:max-w-xs"
          />
        </div>

        {user ? <WeeklyMissions /> : null}

        <ProgressBar filled={game.filledCount} />
      </main>

      <GameResult
        open={game.isCompleted}
        timeMs={game.timerSeconds * 1000}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        onClose={() => game.newGame(game.difficulty)}
        shareVisualData={{
          difficulty: DIFFICULTY_CONFIG[game.difficulty].label,
          timeFormatted: shareTimeLabel,
          errors: game.mistakes,
          percentile: winStats.percentile,
          streak: progress.streakDays,
          variant: "Clásico",
        }}
        onChallengeFriend={createChallengeLink}
        challengeBusy={challengeBusy}
        percentile={winStats.percentile}
        showPersonalBestBadge={winStats.isPersonalBest}
      />
      <GameOverLost open={game.isOutOfLives} onNewGame={() => game.newGame(game.difficulty)} />
    </div>
  );
}
