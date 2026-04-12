const MUTE_KEY = "sudoku-sound-mute";

function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) !== "0";
  } catch {
    return true;
  }
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(freq: number, duration: number) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g);
  g.connect(c.destination);
  o.frequency.value = freq;
  g.gain.value = 0.06;
  o.start();
  o.stop(c.currentTime + duration);
}

export const gameSounds = {
  isMuted,
  setMuted(muted: boolean) {
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  },
  playCell() {
    beep(880, 0.02);
  },
  playError() {
    beep(180, 0.08);
  },
  playWin() {
    beep(523, 0.06);
    if (typeof window !== "undefined") window.setTimeout(() => beep(659, 0.06), 70);
  },
};
