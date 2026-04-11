import { cn } from "@/lib/utils";

interface ProgressBarProps {
  filled: number;
  total?: number;
  className?: string;
}

export function ProgressBar({ filled, total = 81, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((filled / total) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">{pct}%</p>
    </div>
  );
}
