import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function msUntilUtcMidnight() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

export function DailyCountdown({ className }: { className?: string }) {
  const [left, setLeft] = useState(msUntilUtcMidnight());
  useEffect(() => {
    const id = setInterval(() => setLeft(msUntilUtcMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Clock className="h-4 w-4 text-primary" aria-hidden />
      <span>
        Expira en <span className="tabular-nums text-foreground">{fmt(left)}</span>
      </span>
    </div>
  );
}
