import { cn } from "@/lib/utils";

interface PuzzleTechniqueBadgeProps {
  /** Nivel lógico 1–5 o texto libre */
  levelLabel?: string;
  /** Línea corta sobre técnicas */
  summary: string;
  className?: string;
}

export function PuzzleTechniqueBadge({ levelLabel, summary, className }: PuzzleTechniqueBadgeProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
        className
      )}
    >
      {levelLabel ? (
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-medium text-primary">
          Puzzle {levelLabel}
        </span>
      ) : null}
      <span>{summary}</span>
    </div>
  );
}
