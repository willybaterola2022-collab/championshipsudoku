import { cn } from "@/lib/utils";

export interface HintCoachState {
  level: 1 | 2 | 3;
  zone?: string | null;
  technique?: string | null;
  explanation?: string | null;
}

export function HintCoachBanner({ state }: { state: HintCoachState | null }) {
  if (!state) return null;

  const palette =
    state.level === 1
      ? "border-sky-500/40 bg-sky-500/10 text-sky-100"
      : state.level === 2
        ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";

  const title =
    state.level === 1 ? "Pista — zona" : state.level === 2 ? "Pista — técnica" : "Pista — solución";

  const body =
    state.level === 1
      ? (state.zone ?? "Observá la zona indicada.")
      : state.level === 2
        ? [state.technique, state.explanation].filter(Boolean).join(" — ")
        : [state.technique, state.explanation].filter(Boolean).join(" — ");

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm shadow-sm",
        palette
      )}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-balance opacity-95">{body}</p>
    </div>
  );
}
