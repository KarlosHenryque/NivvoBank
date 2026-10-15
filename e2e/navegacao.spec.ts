import { expect, test } from "@playwright/test";

test("navega entre as páginas pelo menu", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("aside nav");
  await nav.getByRole("link", { name: "Lançamentos" }).click();
  await expect(page).toHaveURL(/\/lancamentos$/);
  await expect(page.getByRole("heading", { name: "Lançamentos" })).toBeVisible();
  await nav.getByRole("link", { name: "Categorias" }).click();
  await expect(page).toHaveURL(/\/categorias$/);
  await expect(page.getByRole("heading", { name: "Categorias" })).toBeVisible();
  await nav.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
});

test("dashboard mostra cards, gráficos e listas", async ({ page }) => {
  await page.goto("/");
  for (const r of ["Receitas", "Despesas", "Saldo do mês", "Total a pagar"]) {
    await expect(page.locator("p", { hasText: new RegExp(`^${r}$`) })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Despesas por categoria" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Receitas x despesas (6 meses)" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Próximas a vencer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vencidas" })).toBeVisible();
  await expect(page.getByText("Não foi possível carregar o dashboard.")).toHaveCount(0);
});

test("navegação de mês no dashboard", async ({ page }) => {
  await page.goto("/?mes=2026-03");
  await expect(page.getByText("março de 2026")).toBeVisible();
  await page.getByRole("link", { name: "Próximo mês" }).click();
  await expect(page).toHaveURL(/mes=2026-04/);
  await expect(page.getByText("abril de 2026")).toBeVisible();
  await page.getByRole("link", { name: "Mês anterior" }).click();
  await expect(page).toHaveURL(/mes=2026-03/);
});

test("mês inválido na URL não quebra o dashboard", async ({ page }) => {
  await page.goto("/?mes=abc");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("exibe esqueleto de carregamento ao navegar", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __viuLoading: boolean };
    w.__viuLoading = false;
    new MutationObserver(() => {
      if (document.querySelector('[aria-label="Carregando"]')) w.__viuLoading = true;
    }).observe(document, { childList: true, subtree: true, attributes: true });
  });
  await page.goto("/");
  await page.locator("aside nav").getByRole("link", { name: "Categorias" }).click();
  await expect(page.getByRole("heading", { name: "Categorias" })).toBeVisible();
  const viu = await page.evaluate(() => (window as unknown as { __viuLoading: boolean }).__viuLoading);
  expect(viu).toBe(true);
});
