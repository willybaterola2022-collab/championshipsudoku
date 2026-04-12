import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { gameSounds } from "@/lib/gameSounds";

export function SoundToggle() {
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setMuted(gameSounds.isMuted());
  }, []);

  const toggle = () => {
    gameSounds.setMuted(!gameSounds.isMuted());
    setMuted(gameSounds.isMuted());
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-primary"
      aria-label={muted ? "Activar sonido" : "Silenciar"}
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
