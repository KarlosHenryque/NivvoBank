"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cadastroSchema, loginSchema } from "@/lib/validations/auth";

export type AuthState = { erro?: string; info?: string };

export async function entrar(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });
  if (error) return { erro: "E-mail ou senha incorretos" };

  redirect("/");
}

export async function cadastrar(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = cadastroSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.senha,
  });
  if (error) return { erro: "Não foi possível criar a conta" };
  if (!data.session) {
    return { info: "Conta criada! Confirme seu e-mail para entrar." };
  }

  redirect("/");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
