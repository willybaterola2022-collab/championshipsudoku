import { toast } from "sonner";
import { labelForAchievementKey } from "@/lib/achievementLabels";
import type { SubmitResult } from "@/lib/sudokuService";

export async function showSubmitResult(
  result: SubmitResult,
  refreshProfile: () => Promise<void>
): Promise<void> {
  if (result.persisted) {
    if (result.xpGained != null && result.xpGained > 0) {
      toast.success(`+${result.xpGained} XP`);
    }
    if (result.levelUp && result.newLevel != null) {
      toast.message(`¡Nivel ${result.newLevel}!`);
    }
    const ach = result.achievementsUnlocked ?? [];
    ach.forEach((key, i) => {
      window.setTimeout(() => {
        toast.message("Logro desbloqueado", { description: labelForAchievementKey(key) });
      }, i * 500);
    });
    await refreshProfile();
  } else if (result.error) {
    toast.error(result.error);
  }
}
