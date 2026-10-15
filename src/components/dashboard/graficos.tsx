"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl } from "@/lib/lancamentos";
import { cn } from "@/lib/utils";

export type DespesaCategoria = { nome: string; cor: string; total: number };
export type MesTotais = { mes: string; receitas: number; despesas: number };

const tooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--card-foreground)",
  },
  itemStyle: { color: "var(--card-foreground)" },
};

const fmt = (v: unknown) => brl(Number(v));
const compacto = (v: number) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v);
const mesCurto = (m: string) => `${m.slice(5)}/${m.slice(2, 4)}`;

export function PizzaDespesas({ dados }: { dados: DespesaCategoria[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);

  if (dados.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Sem despesas no mês.</p>;
  }

  const total = dados.reduce((s, d) => s + d.total, 0);
  const maior = Math.max(...dados.map((d) => d.total));
  const sel = ativo === null ? null : dados[ativo];

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative size-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="total"
              nameKey="nome"
              innerRadius="64%"
              outerRadius="96%"
              stroke="var(--card)"
              strokeWidth={2}
              onMouseEnter={(_, i) => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
            >
              {dados.map((d, i) => (
                <Cell
                  key={`${d.nome}-${d.cor}`}
                  fill={d.cor}
                  fillOpacity={ativo === null || ativo === i ? 1 : 0.3}
                  style={{ transition: "fill-opacity 150ms", outline: "none" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <span className="max-w-full truncate text-xs text-muted-foreground">{sel ? sel.nome : "Total"}</span>
          <span className="num font-heading text-lg font-semibold">{brl(sel ? sel.total : total)}</span>
        </div>
      </div>

      <ul className="flex w-full flex-1 flex-col gap-1" onMouseLeave={() => setAtivo(null)}>
        {dados.map((d, i) => (
          <li key={`${d.nome}-${d.cor}`}>
            <button
              type="button"
              onMouseEnter={() => setAtivo(i)}
              onClick={() => setAtivo((a) => (a === i ? null : i))}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
              className={cn(
                "flex w-full flex-col gap-1.5 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                ativo === i && "bg-muted",
              )}
            >
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.cor }} />
                  <span className="truncate font-medium">{d.nome}</span>
                </span>
                <span className="num shrink-0">
                  {brl(d.total)}
                  <span className="ml-2 text-xs text-muted-foreground">{Math.round((d.total / total) * 100)}%</span>
                </span>
              </span>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(d.total / maior) * 100}%`, background: d.cor }}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarrasMeses({ dados }: { dados: MesTotais[] }) {
  return (
    <div className="h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados.map((d) => ({ ...d, mes: mesCurto(d.mes) }))} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={compacto}
          />
          <Tooltip formatter={fmt} cursor={{ fill: "var(--muted)", opacity: 0.6 }} {...tooltipStyle} />
          <Legend iconType="circle" iconSize={8} />
          <Bar dataKey="receitas" name="Receitas" fill="var(--positivo)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" name="Despesas" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
