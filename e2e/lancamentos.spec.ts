import { expect, test, type Page } from "@playwright/test";
import { limparDadosE2E, linha, unico, valorCard } from "./helpers/dados";

test.describe.configure({ mode: "serial" });

test.beforeAll(limparDadosE2E);
test.afterAll(limparDadosE2E);

const dialog = (page: Page) => page.getByRole("dialog");

async function abrirNovo(page: Page) {
  await page.goto("/lancamentos");
  await page.getByRole("button", { name: "Novo lançamento" }).first().click();
  await expect(dialog(page).getByRole("heading", { name: "Novo lançamento" })).toBeVisible();
}

async function criar(page: Page, descricao: string, centavos: string) {
  await abrirNovo(page);
  await dialog(page).getByLabel("Descrição").fill(descricao);
  await dialog(page).getByLabel("Valor").fill(centavos);
  await dialog(page).getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Lançamento criado")).toBeVisible();
  await expect(dialog(page)).toBeHidden();
}

test.describe("validações do formulário", () => {
  test("descrição é obrigatória", async ({ page }) => {
    await abrirNovo(page);
    await dialog(page).getByLabel("Valor").fill("1000");
    await dialog(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(dialog(page)).toBeVisible();
    const vazio = await dialog(page).getByLabel("Descrição").evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    expect(vazio).toBe(true);
  });

  test("valor zero é rejeitado pelo servidor", async ({ page }) => {
    await abrirNovo(page);
    await dialog(page).getByLabel("Descrição").fill(unico("zero"));
    await dialog(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(dialog(page).getByRole("alert")).toHaveText("Informe um valor maior que zero");
  });

  test("parcelado exige ao menos 2 parcelas", async ({ page }) => {
    await abrirNovo(page);
    await dialog(page).getByLabel("Descrição").fill(unico("parc"));
    await dialog(page).getByLabel("Valor").fill("1000");
    await dialog(page).getByRole("switch", { name: "Parcelado?" }).click();
    await dialog(page).getByLabel("Número de parcelas").fill("1");
    await dialog(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(dialog(page)).toBeVisible();
    const baixo = await dialog(page).getByLabel("Número de parcelas").evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow);
    expect(baixo).toBe(true);
  });

  test("cancelar fecha o modal sem criar", async ({ page }) => {
    await abrirNovo(page);
    await dialog(page).getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog(page)).toBeHidden();
  });
});

test.describe("ciclo de vida de uma despesa", () => {
  const nome = unico("despesa");

  test("cria, aparece na lista e no total de despesas", async ({ page }) => {
    await page.goto("/lancamentos");
    const antes = await valorCard(page, "Despesas");
    await criar(page, nome, "12345");
    await expect(linha(page, nome)).toBeVisible();
    await expect(linha(page, nome)).toContainText("123,45");
    await expect.poll(() => valorCard(page, "Despesas")).toBeCloseTo(antes + 123.45, 2);
  });

  test("dashboard reflete a despesa criada", async ({ page }) => {
    await page.goto("/");
    expect(await valorCard(page, "Despesas")).toBeGreaterThanOrEqual(123.45);
    expect(await valorCard(page, "Total a pagar")).toBeGreaterThanOrEqual(123.45);
    await expect(page.getByRole("list").filter({ hasText: nome }).or(page.getByText(nome)).first()).toBeVisible();
  });

  test("edita descrição e valor", async ({ page }) => {
    await page.goto("/lancamentos");
    await linha(page, nome).getByRole("button", { name: "Editar" }).click();
    await expect(dialog(page).getByRole("heading", { name: "Editar lançamento" })).toBeVisible();
    await dialog(page).getByLabel("Descrição").fill(`${nome}-ed`);
    await dialog(page).getByLabel("Valor").fill("20000");
    await dialog(page).getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Lançamento atualizado")).toBeVisible();
    await expect(linha(page, `${nome}-ed`)).toContainText("200,00");
  });

  test("marca como pago e desfaz", async ({ page }) => {
    await page.goto("/lancamentos");
    await linha(page, `${nome}-ed`).getByRole("button", { name: "Pagar" }).click();
    await dialog(page).getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText("Marcado como pago")).toBeVisible();
    await expect(linha(page, `${nome}-ed`).getByText("Paga", { exact: true })).toBeVisible();
    await linha(page, `${nome}-ed`).getByRole("button", { name: "Desfazer" }).click();
    await expect(page.getByText("Pagamento desfeito")).toBeVisible();
    await expect(linha(page, `${nome}-ed`).getByText("Paga", { exact: true })).toHaveCount(0);
  });

  test("filtros por tipo e status", async ({ page }) => {
    await page.goto("/lancamentos");
    await page.getByLabel("Todos os tipos").selectOption("receita");
    await expect(page).toHaveURL(/tipo=receita/);
    await expect(linha(page, `${nome}-ed`)).toHaveCount(0);
    await page.getByLabel("Todos os tipos").selectOption("despesa");
    await expect(page).toHaveURL(/tipo=despesa/);
    await page.getByLabel("Todos os status").selectOption("pendente");
    await expect(page).toHaveURL(/status=pendente/);
    await expect(linha(page, `${nome}-ed`)).toBeVisible();
    await page.getByLabel("Todos os status").selectOption("pago");
    await expect(page).toHaveURL(/status=pago/);
    await expect(linha(page, `${nome}-ed`)).toHaveCount(0);
  });

  test("exclui após confirmação", async ({ page }) => {
    await page.goto("/lancamentos");
    await linha(page, `${nome}-ed`).getByRole("button", { name: "Excluir" }).click();
    await expect(dialog(page)).toContainText("Esta ação não pode ser desfeita");
    await dialog(page).getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Lançamento excluído")).toBeVisible();
    await expect(linha(page, `${nome}-ed`)).toHaveCount(0);
  });
});

test.describe("receita e parcelamento", () => {
  test("cria receita", async ({ page }) => {
    const nome = unico("receita");
    await abrirNovo(page);
    await dialog(page).getByText("Receita", { exact: true }).click();
    await dialog(page).getByLabel("Descrição").fill(nome);
    await dialog(page).getByLabel("Valor").fill("50000");
    await dialog(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("Lançamento criado")).toBeVisible();
    await expect(linha(page, nome)).toContainText("+");
  });

  test("parcela em 3x, valores somam o total e exclui as próximas", async ({ page }) => {
    const nome = unico("parcelada");
    await abrirNovo(page);
    await dialog(page).getByLabel("Descrição").fill(nome);
    await dialog(page).getByLabel("Valor").fill("10000");
    await dialog(page).getByRole("switch", { name: "Parcelado?" }).click();
    await dialog(page).getByLabel("Número de parcelas").fill("3");
    await dialog(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("Lançamento criado")).toBeVisible();
    await expect(linha(page, nome)).toContainText("1/3");

    await page.getByRole("button", { name: "Próximo mês" }).click();
    await expect(linha(page, nome)).toContainText("2/3");
    await page.getByRole("button", { name: "Próximo mês" }).click();
    await expect(linha(page, nome)).toContainText("3/3");

    await page.getByRole("button", { name: "Mês anterior" }).click();
    await expect(linha(page, nome)).toContainText("2/3");
    await linha(page, nome).getByRole("button", { name: "Excluir" }).click();
    await dialog(page).getByRole("button", { name: "Esta e as próximas" }).click();
    await expect(page.getByText("Lançamentos excluídos")).toBeVisible();

    await page.getByRole("button", { name: "Próximo mês" }).click();
    await expect(linha(page, nome)).toHaveCount(0);
    await page.getByRole("button", { name: "Mês anterior" }).click();
    await page.getByRole("button", { name: "Mês anterior" }).click();
    await expect(linha(page, nome)).toContainText("1/3");
  });

  test("repete 12 meses (13 lançamentos) e exclui as próximas", async ({ page }) => {
    const nome = unico("fixa");
    await abrirNovo(page);
    await dialog(page).getByLabel("Descrição").fill(nome);
    await dialog(page).getByLabel("Valor").fill("5000");
    await dialog(page).getByText("Fixa", { exact: true }).click();
    await dialog(page).getByRole("switch", { name: "Repetir pelos próximos 12 meses" }).click();
    await dialog(page).getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("Lançamento criado")).toBeVisible();
    await expect(linha(page, nome)).toContainText("1/13");

    await page.getByRole("button", { name: "Próximo mês" }).click();
    await expect(linha(page, nome)).toContainText("2/13");
    await linha(page, nome).getByRole("button", { name: "Excluir" }).click();
    await dialog(page).getByRole("button", { name: "Esta e as próximas" }).click();
    await expect(page.getByText("Lançamentos excluídos")).toBeVisible();
    await expect(linha(page, nome)).toHaveCount(0);

    await page.getByRole("button", { name: "Mês anterior" }).click();
    await expect(linha(page, nome)).toContainText("1/13");
  });
});
