import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  days: number;
  className?: string;
}

export function StreakCounter({ days, className }: StreakCounterProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Flame className="h-4 w-4 text-orange-400" aria-hidden />
      <span>
        <span className="font-semibold text-foreground">{days}</span> días
      </span>
    </div>
  );
}
