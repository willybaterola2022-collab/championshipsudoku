/** Flags de entorno (staging / kill-switch sin redeploy de lógica). */
export const FEATURES = {
  hints: import.meta.env.VITE_FEATURE_HINTS !== "0",
  daily: import.meta.env.VITE_FEATURE_DAILY !== "0",
} as const;
