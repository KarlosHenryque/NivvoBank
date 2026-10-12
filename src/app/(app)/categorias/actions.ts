"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { motivoVinculo } from "@/lib/cadastros";
import { categoriaSchema } from "@/lib/validations/cadastros";

type Resultado = { erro?: string };

const FALHA = { erro: "Não foi possível concluir a operação" };

export async function salvarCategoria(id: number | null, formData: FormData): Promise<Resultado> {
  const parsed = categoriaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erro: parsed.error.issues[0].message };
  const { nome, cor, tipo } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada" };

  const { error } = id
    ? await supabase.from("categorias").update({ nome, cor }).eq("id", id)
    : await supabase.from("categorias").insert({ nome, cor, tipo, user_id: user.id });
  if (error) return FALHA;

  revalidatePath("/", "layout");
  return {};
}

export async function excluirCategoria(id: number): Promise<Resultado> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("lancamentos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", id);
  if (count) return { erro: motivoVinculo(count) };

  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) return FALHA;

  revalidatePath("/", "layout");
  return {};
}
