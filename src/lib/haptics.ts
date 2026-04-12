/** Vibración corta al completar fila/columna/caja (solo si el dispositivo lo permite). */
export function vibrateShort(): void {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
  } catch {
    /* ignore */
  }
}
