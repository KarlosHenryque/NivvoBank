import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

export const PREFIXO = "E2E-";
export const unico = (nome: string) => `${PREFIXO}${nome}-${Date.now().toString(36)}`;

export function credenciais() {
  const email = process.env.E2E_EMAIL;
  const senha = process.env.E2E_SENHA;
  if (!email || !senha) throw new Error("Defina E2E_EMAIL e E2E_SENHA em .env.e2e (usuário de teste dedicado)");
  return { email, senha };
}

export async function limparDadosE2E() {
  const { email, senha } = credenciais();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
  await supabase.from("lancamentos").delete().like("descricao", `${PREFIXO}%`);
  await supabase.from("categorias").delete().like("nome", `${PREFIXO}%`);
  await supabase.auth.signOut({ scope: "local" });
}

export const parseBRL = (t: string) => Number(t.replace(/[^\d,-]/g, "").replace(",", "."));

export const valorCard = async (page: Page, rotulo: string) =>
  parseBRL(
    await page
      .locator("p", { hasText: new RegExp(`^${rotulo}$`) })
      .locator("xpath=following-sibling::p")
      .first()
      .innerText(),
  );

export const linha = (page: Page, texto: string) =>
  page.locator(":is(tbody tr, main ul > li):visible", { hasText: texto });
