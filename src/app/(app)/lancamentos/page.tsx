import { Suspense } from "react";
import Loading from "../loading";
import { connection } from "next/server";
import { Filtros } from "@/components/lancamentos/filtros";
import { LancamentosView } from "@/components/lancamentos/lancamentos-view";
import { createClient } from "@/lib/supabase/server";
import { addMeses, mesAtual, type Categoria, type Lancamento } from "@/lib/lancamentos";
import { filtrosSchema } from "@/lib/validations/lancamento";

export const metadata = { title: "Lançamentos | NivvoBank" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function LancamentosPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: Props) {
  const f = filtrosSchema.parse(await searchParams);
  await connection();
  const mes = f.mes ?? mesAtual();

  const supabase = await createClient();
  let query = supabase
    .from("lancamentos")
    .select(
      "id, tipo, descricao, valor, data_vencimento, data_pagamento, status, recorrencia, parcela_atual, total_parcelas, grupo_parcelas, categoria_id, observacao",
    )
    .gte("data_vencimento", `${mes}-01`)
    .lt("data_vencimento", addMeses(`${mes}-01`, 1))
    .order("data_vencimento")
    .order("id");
  if (f.tipo) query = query.eq("tipo", f.tipo);
  if (f.status) query = query.eq("tipo", "despesa");
  if (f.status) query = query.eq("status", f.status);
  if (f.categoria) query = query.eq("categoria_id", f.categoria);

  const [lancamentos, categorias] = await Promise.all([
    query,
    supabase.from("categorias").select("id, nome, tipo, cor").order("nome"),
  ]);

  const lista = (lancamentos.data ?? []) as Lancamento[];
  const cats = (categorias.data ?? []) as Categoria[];

  return (
    <LancamentosView
      lancamentos={lista}
      categorias={cats}
      filtros={<Filtros mes={mes} categorias={cats} />}
    />
  );
}
