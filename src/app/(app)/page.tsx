import { Suspense } from "react";
import Loading from "./loading";
import Link from "next/link";
import { connection } from "next/server";
import { StatusTag } from "@/components/lancamentos/status-tag";
import { BarrasMeses, PizzaDespesas, type DespesaCategoria, type MesTotais } from "@/components/dashboard/graficos";
import { Medidor } from "@/components/dashboard/medidor";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { brl, dataBR, hojeBR, mesAtual, mesVizinho, nomeMes } from "@/lib/lancamentos";
import { filtrosSchema } from "@/lib/validations/lancamento";

export const metadata = { title: "Dashboard | NivvoBank" };

type Resumo = {
  receitas: number;
  despesas: number;
  a_pagar: number;
  saldo_atual: number;
  categorias: DespesaCategoria[];
  meses: MesTotais[];
};

type Pendente = { id: number; descricao: string; valor: number; data_vencimento: string };

const navClass = "flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-muted active:bg-muted/70";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function DashboardPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: Props) {
  const { mes: mesParam } = filtrosSchema.pick({ mes: true }).parse(await searchParams);
  await connection();
  const mes = mesParam ?? mesAtual();
  const hoje = hojeBR();

  const supabase = await createClient();
  const pendentes = () =>
    supabase
      .from("lancamentos")
      .select("id, descricao, valor, data_vencimento")
      .eq("tipo", "despesa")
      .eq("status", "pendente")
      .order("data_vencimento")
      .limit(5);

  const [resumo, aVencer, vencidas] = await Promise.all([
    supabase.rpc("resumo_dashboard", { p_mes: `${mes}-01` }),
    pendentes().gte("data_vencimento", hoje).lt("data_vencimento", `${mesVizinho(hoje.slice(0, 7), 2)}-01`),
    pendentes().lt("data_vencimento", hoje),
  ]);

  const r = resumo.error ? null : (resumo.data as Resumo | null);
  if (!r) return <p className="text-sm text-destructive">Não foi possível carregar o dashboard.</p>;

  const lista = (titulo: string, itens: Pendente[] | null, vazio: string, alerta?: boolean) => (
    <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        {titulo}
        {!!itens?.length && (
          <span className={`num rounded-full px-2 py-0.5 text-xs font-medium ${alerta ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            {itens.length}
          </span>
        )}
      </h2>
      {itens?.length ? (
        <ul className="divide-y">
          {itens.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.descricao}</p>
                <p className="text-xs text-muted-foreground">Vence {dataBR(c.data_vencimento)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="num font-semibold">{brl(c.valor)}</span>
                <StatusTag status="pendente" vencimento={c.data_vencimento} hoje={hoje} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>
      )}
      <Link href="/lancamentos" className="mt-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
        Ver lançamentos
      </Link>
    </section>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <div className="flex items-center justify-between rounded-xl border bg-card p-1 sm:min-w-64">
          <Link href={`/?mes=${mesVizinho(mes, -1)}`} aria-label="Mês anterior" className={navClass}>
            <ChevronLeft className="size-5" />
          </Link>
          <span className="font-medium first-letter:uppercase">{nomeMes(mes)}</span>
          <Link href={`/?mes=${mesVizinho(mes, 1)}`} aria-label="Próximo mês" className={navClass}>
            <ChevronRight className="size-5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Medidor receitas={r.receitas} despesas={r.despesas} aPagar={r.a_pagar} categorias={r.categorias} />
          <section className="rounded-xl border bg-card p-5 sm:p-6">
            <h2 className="mb-3 font-semibold">Receitas x despesas (6 meses)</h2>
            <BarrasMeses dados={r.meses} />
          </section>
        </div>
        <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          {lista("Próximas a vencer", aVencer.data, "Nada a vencer.")}
          {lista("Vencidas", vencidas.data, "Nenhum lançamento vencido.", true)}
        </div>
      </div>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">Despesas por categoria</h2>
        <PizzaDespesas dados={r.categorias} />
      </section>
    </div>
  );
}
