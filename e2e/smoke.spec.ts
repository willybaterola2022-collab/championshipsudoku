import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("inicio muestra título Sudoku", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("h1").first()).toContainText(/sudoku/i);
  });

  test("ruta /play carga", async ({ page }) => {
    await page.goto("/play");
    await expect(page.getByRole("link", { name: /volver/i })).toBeVisible();
  });

  test("ruta /speed carga", async ({ page }) => {
    await page.goto("/speed");
    await expect(page.getByRole("heading", { name: /speed challenge/i })).toBeVisible({ timeout: 15_000 });
  });
});
