"use client";

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
  if (dados.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Sem despesas no mês.</p>;
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={dados} dataKey="total" nameKey="nome" innerRadius="50%" outerRadius="80%">
            {dados.map((d) => (
              <Cell key={`${d.nome}-${d.cor}`} fill={d.cor} />
            ))}
          </Pie>
          <Tooltip formatter={fmt} {...tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarrasMeses({ dados }: { dados: MesTotais[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados.map((d) => ({ ...d, mes: mesCurto(d.mes) }))}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="mes" tick={{ fill: "currentColor" }} />
          <YAxis width={56} tick={{ fill: "currentColor" }} tickFormatter={compacto} />
          <Tooltip formatter={fmt} {...tooltipStyle} />
          <Legend />
          <Bar dataKey="receitas" name="Receitas" fill="var(--green)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" name="Despesas" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
