/** Genera PNG en data URL para compartir resultado (sin html2canvas). */

import { toast } from "sonner";

export interface ShareImageData {
  difficulty: string;
  timeFormatted: string;
  errors: number;
  percentile?: number | null;
  streak: number;
  variant: string;
}

export function generateShareImage(data: ShareImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(0, 0, 600, 400);

  ctx.strokeStyle = "#d4a843";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 580, 380);

  ctx.fillStyle = "#d4a843";
  ctx.font = "bold 28px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText("Championship Sudoku", 300, 60);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px system-ui, sans-serif";
  ctx.fillText(`${data.difficulty} · ${data.variant}`, 300, 110);
  ctx.font = "bold 48px system-ui, sans-serif";
  ctx.fillText(data.timeFormatted, 300, 180);
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText(`${data.errors} errores · Racha ${data.streak} días`, 300, 220);
  if (data.percentile != null) {
    ctx.fillStyle = "#d4a843";
    ctx.fillText(`Más rápido que el ${data.percentile}% de los jugadores`, 300, 260);
  }

  ctx.fillStyle = "#888888";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("championshipsudoku.vercel.app", 300, 360);

  return canvas.toDataURL("image/png");
}

export async function shareResultImage(data: ShareImageData, textFallback: string): Promise<void> {
  const imageUrl = generateShareImage(data);
  const blob = await (await fetch(imageUrl)).blob();
  const file = new File([blob], "sudoku-result.png", { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "Championship Sudoku",
      text: `Resolví un Sudoku ${data.difficulty} en ${data.timeFormatted}`,
      files: [file],
    });
    return;
  }

  await navigator.clipboard.writeText(textFallback);
  toast.success("Copiado al portapapeles");
}
