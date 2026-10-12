import { expect, test } from "@playwright/test";
import { credenciais } from "./helpers/dados";

test.describe("rotas protegidas", () => {
  for (const rota of ["/", "/lancamentos", "/categorias"]) {
    test(`${rota} redireciona para /login sem sessão`, async ({ page }) => {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe("login", () => {
  test("campos obrigatórios e link de cadastro", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveAttribute("required", "");
    await expect(page.getByLabel("Senha")).toHaveAttribute("minlength", "6");
    await page.getByRole("link", { name: "Cadastre-se" }).click();
    await expect(page).toHaveURL(/\/cadastro$/);
  });

  test("senha curta é barrada pelo navegador", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("qualquer@example.com");
    await page.getByLabel("Senha").fill("123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/login$/);
    const curta = await page.getByLabel("Senha").evaluate((el: HTMLInputElement) => el.validity.tooShort);
    expect(curta).toBe(true);
  });

  test("credenciais inválidas mostram erro", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("inexistente-e2e@example.com");
    await page.getByLabel("Senha").fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText("E-mail ou senha incorretos");
  });

  test("mostra estado de carregamento ao enviar", async ({ page }) => {
    await page.route("**/login", async (route) => {
      if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("inexistente-e2e@example.com");
    await page.getByLabel("Senha").fill("senha-errada-123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("button", { name: "Aguarde..." })).toBeDisabled();
    await expect(page.locator("p[role=alert]")).toBeVisible();
  });

  test("login válido entra no dashboard e sair volta ao login", async ({ page }) => {
    const { email, senha } = credenciais();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(senha);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await page.getByRole("button", { name: "Sair" }).first().dispatchEvent("click");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("cadastro (só validações, não cria conta)", () => {
  test("senhas diferentes mostram erro", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByLabel("E-mail").fill("novo-e2e@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("Senha@1234");
    await page.getByLabel("Confirmar senha").fill("Outra@5678");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText("As senhas não conferem");
  });

  test("senha fraca é rejeitada pelo servidor", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByLabel("E-mail").fill("novo-e2e@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("senhafraca1");
    await page.getByLabel("Confirmar senha").fill("senhafraca1");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText("A senha deve ter uma letra maiúscula");
  });

  test("link volta para o login", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByRole("link", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
