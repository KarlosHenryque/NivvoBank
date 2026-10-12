import { expect, test, type Page } from "@playwright/test";
import { limparDadosE2E, unico } from "./helpers/dados";

test.describe.configure({ mode: "serial" });

test.beforeAll(limparDadosE2E);
test.afterAll(limparDadosE2E);

const dialog = (page: Page) => page.getByRole("dialog");
const item = (page: Page, nome: string) => page.locator("main ul > li", { hasText: nome });

test("lista categorias padrão agrupadas", async ({ page }) => {
  await page.goto("/categorias");
  await expect(page.getByRole("heading", { name: "Despesas", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Receitas", level: 2 })).toBeVisible();
  await expect(item(page, "Moradia")).toBeVisible();
  await expect(item(page, "Salário")).toBeVisible();
});

test("nome é obrigatório", async ({ page }) => {
  await page.goto("/categorias");
  await page.getByRole("button", { name: "Nova categoria" }).click();
  await dialog(page).getByRole("button", { name: "Salvar" }).click();
  const vazio = await dialog(page).getByLabel("Nome").evaluate((el: HTMLInputElement) => el.validity.valueMissing);
  expect(vazio).toBe(true);
});

test.describe("ciclo de vida de uma categoria", () => {
  const nome = unico("cat");
  const lanc = unico("vinculo");

  test("cria categoria", async ({ page }) => {
    await page.goto("/categorias");
    await page.getByRole("button", { name: "Nova categoria" }).click();
    await dialog(page).getByLabel("Nome").fill(nome);
    await dialog(page).getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Categoria criada")).toBeVisible();
    await expect(item(page, nome)).toBeVisible();
  });

  test("edita categoria e tipo fica bloqueado", async ({ page }) => {
    await page.goto("/categorias");
    await item(page, nome).getByRole("button", { name: "Editar" }).click();
    await expect(dialog(page).getByLabel("Tipo")).toBeDisabled();
    await dialog(page).getByLabel("Nome").fill(`${nome}-ed`);
    await dialog(page).getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Categoria atualizada")).toBeVisible();
    await expect(item(page, `${nome}-ed`)).toBeVisible();
  });

  test("categoria com lançamento não pode ser excluída", async ({ page }) => {
    await page.goto("/lancamentos");
    await page.getByRole("button", { name: "Novo lançamento" }).first().click();
    await dialog(page).getByLabel("Descrição").fill(lanc);
    await dialog(page).getByLabel("Valor").fill("1000");
    await dialog(page).getByLabel("Categoria").selectOption({ label: `${nome}-ed` });
    await dialog(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("Lançamento criado")).toBeVisible();

    await page.goto("/categorias");
    const excluir = item(page, `${nome}-ed`).getByRole("button", { name: "Excluir" });
    await expect(excluir).toBeDisabled();
    await expect(excluir).toHaveAttribute("title", "Há 1 lançamento vinculado");
  });

  test("exclui categoria sem vínculo", async ({ page }) => {
    await page.goto("/lancamentos");
    await page.locator(":is(tbody tr, main ul > li):visible", { hasText: lanc }).getByRole("button", { name: "Excluir" }).click();
    await dialog(page).getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Lançamento excluído")).toBeVisible();

    await page.goto("/categorias");
    await item(page, `${nome}-ed`).getByRole("button", { name: "Excluir" }).click();
    await dialog(page).getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Categoria excluída")).toBeVisible();
    await expect(item(page, `${nome}-ed`)).toHaveCount(0);
  });
});
