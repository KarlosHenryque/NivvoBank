import { expect, test } from "@playwright/test";

test.describe("mobile", () => {
  test("usa barra inferior e esconde a lateral", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("aside")).toBeHidden();
    const bottom = page.locator("body > div > nav");
    await expect(bottom).toBeVisible();
    await bottom.getByRole("link", { name: "Lançamentos" }).click();
    await expect(page).toHaveURL(/\/lancamentos$/);
    await bottom.getByRole("link", { name: "Categorias" }).click();
    await expect(page).toHaveURL(/\/categorias$/);
  });

  test("não há rolagem horizontal nas páginas", async ({ page }) => {
    for (const rota of ["/", "/lancamentos", "/categorias"]) {
      await page.goto(rota);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const estoura = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(estoura, rota).toBe(false);
    }
  });

  test("modal de novo lançamento ocupa a tela toda", async ({ page }) => {
    await page.goto("/lancamentos");
    await page.getByRole("button", { name: "Novo lançamento" }).first().click();
    const box = await page.getByRole("dialog").boundingBox();
    const vw = page.viewportSize()!;
    expect(box!.width).toBeGreaterThanOrEqual(vw.width - 1);
    await page.getByRole("button", { name: "Cancelar" }).click();
  });
});

test.describe("desktop em viewport larga", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test("usa menu lateral e esconde barra inferior", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("body > div > nav")).toBeHidden();
  });
});
