import { cn } from "@/lib/utils";

type Mode = "home" | "wide" | "diagonal" | "mini" | "killer";

interface GameModePreviewProps {
  mode: Mode;
  className?: string;
}

/** Miniaturas SVG abstractas del tipo de tablero (sin assets externos). */
export function GameModePreview({ mode, className }: GameModePreviewProps) {
  const base = "pointer-events-none h-16 w-full text-muted-foreground/90";

  switch (mode) {
    case "home":
      return (
        <svg viewBox="0 0 36 36" className={cn(base, className)} aria-hidden>
          <g stroke="currentColor" strokeWidth="0.4" fill="none">
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 4} x2="36" y2={i * 4} strokeWidth={i % 3 === 0 ? 1 : 0.35} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`v${i}`} x1={i * 4} y1="0" x2={i * 4} y2="36" strokeWidth={i % 3 === 0 ? 1 : 0.35} />
            ))}
          </g>
          <circle cx="18" cy="18" r="2.2" className="fill-primary/40" />
        </svg>
      );
    case "wide":
      return (
        <svg viewBox="0 0 36 36" className={cn(base, className)} aria-hidden>
          <g stroke="currentColor" strokeWidth="0.4" fill="none">
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 4} x2="36" y2={i * 4} strokeWidth={i % 3 === 0 ? 1 : 0.35} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`v${i}`} x1={i * 4} y1="0" x2={i * 4} y2="36" strokeWidth={i % 3 === 0 ? 1 : 0.35} />
            ))}
          </g>
          <path
            d="M4 4 L10 4 M4 4 L4 10 M32 4 L26 4 M32 4 L32 10 M4 32 L10 32 M4 32 L4 26 M32 32 L26 32 M32 32 L32 26"
            stroke="currentColor"
            strokeWidth="0.9"
            className="text-primary/70"
            fill="none"
          />
        </svg>
      );
    case "diagonal":
      return (
        <svg viewBox="0 0 36 36" className={cn(base, className)} aria-hidden>
          <g stroke="currentColor" strokeWidth="0.4" fill="none">
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 4} x2="36" y2={i * 4} strokeWidth={i % 3 === 0 ? 1 : 0.35} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`v${i}`} x1={i * 4} y1="0" x2={i * 4} y2="36" strokeWidth={i % 3 === 0 ? 1 : 0.35} />
            ))}
          </g>
          <line
            x1="2"
            y1="2"
            x2="34"
            y2="34"
            stroke="hsl(43, 90%, 55%)"
            strokeWidth="1.2"
            opacity="0.65"
          />
          <line
            x1="34"
            y1="2"
            x2="2"
            y2="34"
            stroke="hsl(43, 90%, 55%)"
            strokeWidth="1.2"
            opacity="0.65"
          />
        </svg>
      );
    case "mini":
      return (
        <svg viewBox="0 0 36 36" className={cn(base, className)} aria-hidden>
          <g stroke="currentColor" strokeWidth="0.45" fill="none">
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 6} x2="36" y2={i * 6} strokeWidth={i % 2 === 0 ? 1.1 : 0.4} />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`v${i}`} x1={i * 6} y1="0" x2={i * 6} y2="36" strokeWidth={i % 3 === 0 ? 1.1 : 0.4} />
            ))}
          </g>
        </svg>
      );
    case "killer":
      return (
        <svg viewBox="0 0 36 36" className={cn(base, className)} aria-hidden>
          <g stroke="currentColor" strokeWidth="0.4" fill="none">
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 4} x2="36" y2={i * 4} strokeWidth={i % 3 === 0 ? 1 : 0.35} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`v${i}`} x1={i * 4} y1="0" x2={i * 4} y2="36" strokeWidth={i % 3 === 0 ? 1 : 0.35} />
            ))}
          </g>
          <rect
            x="1.5"
            y="1.5"
            width="16"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
            className="text-primary/60"
          />
          <rect x="20" y="14" width="14" height="12" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 1" className="text-primary/45" />
        </svg>
      );
    default:
      return null;
  }
}
