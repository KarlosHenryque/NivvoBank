"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addMeses, calcularParcelas } from "@/lib/lancamentos";
import { lancamentoEdicaoSchema, lancamentoSchema, pagamentoSchema } from "@/lib/validations/lancamento";

type Resultado = { erro?: string };

const FALHA = { erro: "Não foi possível concluir a operação" };

function atualizar() {
  revalidatePath("/lancamentos");
  revalidatePath("/");
}

async function contexto() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function categoriaValida(supabase: Awaited<ReturnType<typeof createClient>>, id: number | null, tipo: string) {
  if (id === null) return true;
  const { data } = await supabase.from("categorias").select("id").eq("id", id).eq("tipo", tipo).maybeSingle();
  return !!data;
}

export async function createLancamento(input: Record<string, unknown>): Promise<Resultado> {
  const parsed = lancamentoSchema.safeParse(input);
  if (!parsed.success) return { erro: parsed.error.issues[0].message };
  const d = parsed.data;

  const { supabase, user } = await contexto();
  if (!user) return { erro: "Sessão expirada" };
  if (!(await categoriaValida(supabase, d.categoria_id, d.tipo))) return { erro: "Categoria inválida" };

  const linha = (i: number, valor: number, total: number) => ({
    tipo: d.tipo,
    descricao: d.descricao,
    valor,
    data_vencimento: addMeses(d.data_vencimento, i),
    recorrencia: d.recorrencia,
    parcela_atual: i + 1,
    total_parcelas: total,
    categoria_id: d.categoria_id,
    observacao: d.observacao,
  });

  const total = d.parcelado ? d.parcelas : d.repetir ? 13 : 1;
  const valores = d.parcelado
    ? calcularParcelas(d.valor, total, d.modo_valor).valores
    : Array.from({ length: total }, () => d.valor);
  const linhas = valores.map((v, i) => linha(i, v, total));

  const { error } = await supabase.rpc("criar_lancamentos", { p_linhas: linhas, p_agrupar: total > 1 });
  if (error) return FALHA;

  atualizar();
  return {};
}

export async function updateLancamento(id: number, input: Record<string, unknown>): Promise<Resultado> {
  if (!Number.isInteger(id) || id <= 0) return FALHA;
  const parsed = lancamentoEdicaoSchema.safeParse(input);
  if (!parsed.success) return { erro: parsed.error.issues[0].message };
  const d = parsed.data;

  const { supabase, user } = await contexto();
  if (!user) return { erro: "Sessão expirada" };
  if (!(await categoriaValida(supabase, d.categoria_id, d.tipo))) return { erro: "Categoria inválida" };

  const { data, error } = await supabase
    .from("lancamentos")
    .update({ ...d, data_competencia: d.data_vencimento })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error || !data?.length) return FALHA;

  atualizar();
  return {};
}

export async function pagarLancamento(id: number, dataPagamento: string | null): Promise<Resultado> {
  let data: string | null = null;
  if (dataPagamento !== null) {
    const parsed = pagamentoSchema.safeParse(dataPagamento);
    if (!parsed.success) return { erro: parsed.error.issues[0].message };
    data = parsed.data;
  }

  const { supabase, user } = await contexto();
  if (!user) return { erro: "Sessão expirada" };
  const { data: atualizados, error } = await supabase
    .from("lancamentos")
    .update({ status: data ? "pago" : "pendente", data_pagamento: data })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error || !atualizados?.length) return FALHA;

  atualizar();
  return {};
}

export async function excluirLancamento(id: number, escopo: "uma" | "proximas"): Promise<Resultado> {
  const { supabase, user } = await contexto();
  if (!user) return { erro: "Sessão expirada" };
  const { data: l } = await supabase
    .from("lancamentos")
    .select("grupo_parcelas, parcela_atual")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!l) return FALHA;

  const q = supabase.from("lancamentos").delete().eq("user_id", user.id);
  const { error } =
    escopo === "proximas" && l.grupo_parcelas
      ? await q.eq("grupo_parcelas", l.grupo_parcelas).gte("parcela_atual", l.parcela_atual)
      : await q.eq("id", id);
  if (error) return FALHA;

  atualizar();
  return {};
}
