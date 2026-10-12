import Link from "next/link";
import { connection } from "next/server";
import { BarrasMeses, PizzaDespesas, type DespesaCategoria, type MesTotais } from "@/components/dashboard/graficos";
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

const navClass = "flex size-10 items-center justify-center rounded-lg text-xl hover:bg-muted";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
    pendentes().gte("data_vencimento", hoje),
    pendentes().lt("data_vencimento", hoje),
  ]);

  const r = resumo.error ? null : (resumo.data as Resumo | null);
  if (!r) return <p className="text-sm text-destructive">Não foi possível carregar o dashboard.</p>;

  const saldoMes = r.receitas - r.despesas;
  const cards = [
    { rotulo: "Receitas", v: r.receitas },
    { rotulo: "Despesas", v: r.despesas },
    { rotulo: "Saldo do mês", v: saldoMes },
    { rotulo: "Saldo atual", v: r.saldo_atual },
    { rotulo: "Total a pagar", v: r.a_pagar },
  ];

  const lista = (titulo: string, itens: Pendente[] | null, vazio: string) => (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-6">
      <h2 className="font-semibold">{titulo}</h2>
      {itens?.length ? (
        <ul className="divide-y">
          {itens.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.descricao}</p>
                <p className="text-xs text-muted-foreground">Vence {dataBR(c.data_vencimento)}</p>
              </div>
              <span className="font-semibold">{brl(c.valor)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">{vazio}</p>
      )}
      <Link href="/lancamentos" className="text-sm font-medium underline underline-offset-4">
        Ver lançamentos
      </Link>
    </section>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="flex items-center justify-between rounded-xl border bg-card p-1">
        <Link href={`/?mes=${mesVizinho(mes, -1)}`} aria-label="Mês anterior" className={navClass}>
          ‹
        </Link>
        <span className="font-medium first-letter:uppercase">{nomeMes(mes)}</span>
        <Link href={`/?mes=${mesVizinho(mes, 1)}`} aria-label="Próximo mês" className={navClass}>
          ›
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.rotulo} className="rounded-xl border bg-card p-4 last:col-span-2 sm:p-6 lg:last:col-span-1">
            <p className="text-xs text-muted-foreground">{c.rotulo}</p>
            <p className="text-lg font-semibold">{brl(c.v)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-2 font-semibold">Despesas por categoria</h2>
          <PizzaDespesas dados={r.categorias} />
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-2 font-semibold">Receitas x despesas (6 meses)</h2>
          <BarrasMeses dados={r.meses} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {lista("Próximas a vencer", aVencer.data, "Nada a vencer.")}
        {lista("Vencidas", vencidas.data, "Nenhum lançamento vencido.")}
      </div>
    </div>
  );
}
