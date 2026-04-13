import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { GameControls } from "@/components/sudoku/GameControls";
import { GameResult } from "@/components/sudoku/GameResult";
import { NumPad } from "@/components/sudoku/NumPad";
import { ProgressBar } from "@/components/sudoku/ProgressBar";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { Timer } from "@/components/sudoku/Timer";
import { useSudokuGame } from "@/hooks/useSudokuGame";
import { useSudokuKeyboard } from "@/hooks/useSudokuKeyboard";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTY_CONFIG, type Difficulty } from "@/lib/sudoku/types";
import { cn } from "@/lib/utils";

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface ChallengeRow {
  id: string;
  code: string;
  puzzle: string | number[][];
  solution: string | number[][];
  difficulty: string;
  variant: string | null;
  creator_time_ms: number | null;
  creator_errors: number | null;
}

function mapRpcChallengeRow(o: Record<string, unknown>): ChallengeRow | null {
  const id = o.challenge_id ?? o.id;
  if (id == null) return null;
  return {
    id: String(id),
    code: String(o.code ?? ""),
    puzzle: (o.puzzle as string | number[][]) ?? "[]",
    solution: (o.solution as string | number[][]) ?? "[]",
    difficulty: String(o.difficulty ?? "medium"),
    variant: (o.variant as string | null) ?? "classic",
    creator_time_ms: o.creator_time_ms != null ? Number(o.creator_time_ms) : null,
    creator_errors: o.creator_errors != null ? Number(o.creator_errors) : null,
  };
}

function ChallengeSession({
  row,
  seeded,
  code,
}: {
  row: ChallengeRow;
  seeded: { puzzle: number[][]; solution: number[][]; difficulty: Difficulty };
  code: string;
}) {
  const guestRef = useRef("");
  const [guestName, setGuestName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    guestRef.current = guestName;
  }, [guestName]);

  const game = useSudokuGame({
    seeded,
    persistenceKey: `sudoku-challenge-${code}`,
    challengeMeta: {
      challengeId: row.id,
      getGuestName: () => guestRef.current.trim() || undefined,
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["challenge-attempts", row.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sudoku_challenge_attempts")
        .select("time_ms, errors, guest_name, user_id")
        .eq("challenge_id", row.id)
        .order("time_ms", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (game.challengeFinish) {
      void queryClient.invalidateQueries({ queryKey: ["challenge-attempts", row.id] });
    }
  }, [game.challengeFinish, queryClient, row.id]);

  useSudokuKeyboard({
    enabled: !game.isCompleted && !game.isPaused && !game.isOutOfLives,
    onDigit: game.placeNumber,
    onErase: game.eraseCell,
    onUndo: game.undo,
    onToggleNotes: game.toggleNotes,
  });

  const variant = row.variant === "diagonal" ? "diagonal" : "classic";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <header className="border-b border-border/40 bg-background/90 px-4 py-3">
        <div className="container flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-primary"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-serif text-xl text-gradient-gold">Te desafiaron</h1>
            <p className="text-sm text-muted-foreground">
              Resolvé el mismo Sudoku y compará tiempos.
            </p>
          </div>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
            {DIFFICULTY_CONFIG[seeded.difficulty].label}
          </span>
          {row.creator_time_ms != null ? (
            <span className="text-sm text-muted-foreground">
              Tiempo del creador:{" "}
              <span className="font-mono text-foreground">{fmtMs(row.creator_time_ms)}</span>
              {row.creator_errors != null ? ` · ${row.creator_errors} errores` : ""}
            </span>
          ) : null}
        </div>
      </header>

      <main className="container space-y-4 px-4 py-6">
        <label className="flex max-w-md flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Nombre (opcional, para el ranking)</span>
          <input
            className="rounded-lg border border-border bg-background px-3 py-2"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Invitado"
            maxLength={40}
          />
        </label>

        <SudokuBoard
          board={game.board}
          selectedCell={game.selectedCell}
          onSelectCell={game.selectCell}
          sizeClassName="w-[min(90vw,450px)]"
          diagonal={variant === "diagonal"}
        />

        <div className="flex flex-wrap items-center gap-4">
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

        {attempts && attempts.length > 0 ? (
          <div className="rounded-xl border border-border/60 p-4">
            <p className="mb-2 font-semibold text-foreground">Intentos</p>
            <ul className="space-y-1 text-sm">
              {attempts.map((a, i) => (
                <li key={`${a.time_ms}-${i}`} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">#{i + 1}</span>
                  <span className="font-mono">{fmtMs(a.time_ms)}</span>
                  <span>{a.errors ?? 0} err.</span>
                  <span className="truncate text-right">
                    {a.guest_name || (a.user_id ? "Jugador" : "—")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </main>

      <GameResult
        open={game.isCompleted}
        timeMs={game.timerSeconds * 1000}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        onClose={() => game.newGame(game.difficulty)}
        percentile={null}
        footerExtra={
          game.challengeFinish ? (
            <p className="text-center text-sm text-primary">
              Tu puesto: #{game.challengeFinish.rank} de {game.challengeFinish.total}
            </p>
          ) : null
        }
      />
    </div>
  );
}

export default function Challenge() {
  const { code } = useParams<{ code: string }>();

  const { data: row, isLoading, error } = useQuery({
    queryKey: ["sudoku-challenge", code],
    enabled: Boolean(code),
    queryFn: async () => {
      const { data: rpcRaw, error: rpcErr } = await supabase.rpc("get_sudoku_challenge", {
        p_code: code!,
      });
      if (!rpcErr && rpcRaw != null) {
        const payload = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw;
        if (payload && typeof payload === "object") {
          const mapped = mapRpcChallengeRow(payload as Record<string, unknown>);
          if (mapped?.id) return mapped;
        }
      }
      const { data, error: e } = await supabase
        .from("sudoku_challenges")
        .select("id, code, puzzle, solution, difficulty, variant, creator_time_ms, creator_errors")
        .eq("code", code!)
        .maybeSingle();
      if (e) throw e;
      return data as ChallengeRow | null;
    },
  });

  const seeded = useMemo(() => {
    if (!row?.puzzle || !row?.solution) return null;
    const puzzle =
      typeof row.puzzle === "string" ? (JSON.parse(row.puzzle) as number[][]) : row.puzzle;
    const solution =
      typeof row.solution === "string" ? (JSON.parse(row.solution) as number[][]) : row.solution;
    return {
      puzzle,
      solution,
      difficulty: (row.difficulty as Difficulty) ?? "medium",
    };
  }, [row]);

  if (isLoading) {
    return (
      <div className={cn("flex min-h-screen flex-col bg-background")}>
        <Navbar />
        <p className="p-8 text-muted-foreground">Cargando desafío…</p>
      </div>
    );
  }

  if (error || !row || !seeded || !code) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container px-4 py-12 text-center">
          <p className="font-serif text-2xl text-primary">Desafío no encontrado</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return <ChallengeSession key={row.id} row={row} seeded={seeded} code={code} />;
}
