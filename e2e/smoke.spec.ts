import { expect, test } from "@playwright/test";

/** Evita el overlay del primer visitante (HowToPlayDialog) que bloquea clics. */
const SKIP_HOWTO_LS = "sudoku-first-visit-help-v1";

test.describe("smoke", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript((key: string) => {
      try {
        localStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
    }, SKIP_HOWTO_LS);
  });

  test("inicio muestra título Sudoku", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("h1").first()).toContainText(/sudoku/i);
  });

  test("inicio: sección modos de juego y carrusel snap (móvil)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /modos de juego/i })).toBeVisible({ timeout: 15_000 });
    const modesSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /modos de juego/i }),
    });
    await expect(modesSection.locator(".snap-x").first()).toBeVisible();
  });

  test("navbar: menú Jugar abre y enlaza a vista amplia", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /jugar/i }).click();
    const vista = page.getByRole("menuitem", { name: /vista amplia/i });
    await expect(vista).toBeVisible();
    await vista.click();
    await expect(page).toHaveURL(/\/play$/);
    await expect(page.getByRole("link", { name: /volver/i })).toBeVisible();
  });

  test("landing: tarjeta Mini 6×6 navega a /play/mini", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /mini 6×6/i }).click();
    await expect(page).toHaveURL(/\/play\/mini/);
    await expect(page.getByText(/mini 6×6/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("ruta /play carga", async ({ page }) => {
    await page.goto("/play");
    await expect(page.getByRole("link", { name: /volver/i })).toBeVisible();
  });

  test("ruta /play/mini carga", async ({ page }) => {
    await page.goto("/play/mini");
    await expect(page.getByRole("link", { name: "Volver a 9×9" })).toBeVisible({ timeout: 20_000 });
  });

  test("ruta /speed carga", async ({ page }) => {
    await page.goto("/speed");
    await expect(page.getByRole("heading", { name: /speed challenge/i })).toBeVisible({ timeout: 15_000 });
  });

  test("ruta /tutorial carga", async ({ page }) => {
    await page.goto("/tutorial");
    await expect(page.getByRole("heading", { name: /aprender técnicas/i })).toBeVisible({ timeout: 15_000 });
  });

  test("ruta /play?mode=zen muestra modo zen", async ({ page }) => {
    await page.goto("/play?mode=zen");
    await expect(page.getByText(/sin tiempo/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
