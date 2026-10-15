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
  const tipo = f.tipo ?? "despesa";
  if (tipo !== "todos") query = query.eq("tipo", tipo);
  if (f.status) query = query.eq("tipo", "despesa");
  if (f.status) query = query.eq("status", f.status);
  if (f.categoria) query = query.eq("categoria_id", f.categoria);

  const [lancamentos, categorias, resumo] = await Promise.all([
    query,
    supabase.from("categorias").select("id, nome, tipo, cor").order("nome"),
    supabase.rpc("resumo_dashboard", { p_mes: `${mes}-01` }),
  ]);

  const lista = (lancamentos.data ?? []) as Lancamento[];
  const cats = (categorias.data ?? []) as Categoria[];

  const grupos = [...new Set(lista.filter((l) => l.grupo_parcelas && l.total_parcelas > 1).map((l) => l.grupo_parcelas!))];
  const parcelas = grupos.length
    ? (
        await supabase
          .from("lancamentos")
          .select("id, tipo, descricao, valor, data_vencimento, data_pagamento, status, recorrencia, parcela_atual, total_parcelas, grupo_parcelas, categoria_id, observacao")
          .in("grupo_parcelas", grupos)
          .order("parcela_atual")
      ).data ?? []
    : [];

  const r = resumo.error ? null : (resumo.data as { receitas: number; despesas: number } | null);
  const totais = { receitas: r?.receitas ?? 0, despesas: r?.despesas ?? 0 };

  return (
    <LancamentosView
      totais={totais}
      lancamentos={lista}
      parcelas={parcelas as Lancamento[]}
      categorias={cats}
      filtros={<Filtros mes={mes} categorias={cats} />}
    />
  );
}
