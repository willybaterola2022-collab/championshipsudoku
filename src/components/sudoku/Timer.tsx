import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TimerProps {
  seconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  disabled?: boolean;
  className?: string;
}

export function Timer({ seconds, isPaused, onTogglePause, disabled, className }: TimerProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onTogglePause}
      className={cn(
        "glass inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium tabular-nums text-foreground",
        className
      )}
    >
      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      {fmt(seconds)}
    </button>
  );
}
