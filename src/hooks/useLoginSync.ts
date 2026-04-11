import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { sudokuService } from "@/lib/sudokuService";

/** Runs once per session when user signs in: flushes offline completions to the server. */
export function useLoginSync() {
  const { user } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;
    void sudokuService.syncPending().then(({ synced, failed }) => {
      if (synced > 0) {
        toast.success(`Sincronizadas ${synced} partida${synced === 1 ? "" : "s"} offline`);
      }
      if (failed > 0) {
        toast.message("Algunas partidas no se pudieron sincronizar", {
          description: "Reintentá más tarde desde tu perfil.",
        });
      }
    });
  }, [user]);
}
