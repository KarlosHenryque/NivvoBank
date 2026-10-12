import { expect, test as setup } from "@playwright/test";
import { credenciais } from "./helpers/dados";

setup("login do usuário de teste", async ({ page }) => {
  const { email, senha } = credenciais();
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
