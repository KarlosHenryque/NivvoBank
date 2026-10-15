"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { brl } from "@/lib/lancamentos";
import { cn } from "@/lib/utils";
import type { DespesaCategoria } from "./graficos";

const OCULTO = "R$ •••••";

type Props = { receitas: number; despesas: number; aPagar: number; categorias: DespesaCategoria[] };

export function Medidor({ receitas, despesas, aPagar, categorias }: Props) {
  const [visivel, setVisivel] = useState(false);
  const [ativo, setAtivo] = useState<number | null>(null);

  const saldo = receitas - despesas;
  const base = Math.max(receitas, despesas);
  const trechos = categorias.filter((c) => c.total > 0);
  const gasto = receitas > 0 ? Math.round((despesas / receitas) * 100) : null;
  const sel = ativo === null ? null : trechos[ativo];
  const Icone = visivel ? EyeOff : Eye;

  const legenda = sel
    ? `${sel.nome}: ${brl(sel.total)} (${Math.round((sel.total / (receitas || base)) * 100)}% da receita)`
    : base === 0
      ? "Sem movimentos neste mês."
      : receitas === 0
        ? "Nenhuma receita lançada neste mês."
        : saldo < 0
          ? `Despesas passaram da receita em ${brl(-saldo)}.`
          : `Você gastou ${gasto}% da receita do mês.`;

  const totais = [
    { rotulo: "Receitas", v: visivel ? brl(receitas) : OCULTO },
    { rotulo: "Despesas", v: brl(despesas) },
    { rotulo: "Total a pagar", v: brl(aPagar) },
  ];

  return (
    <section className="flex flex-col gap-6 rounded-2xl border bg-card p-5 text-card-foreground sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Saldo do mês</p>
          <p
            className={cn(
              "num font-heading truncate text-4xl font-semibold tracking-tight sm:text-5xl",
              visivel && saldo < 0 && "text-destructive",
            )}
          >
            {visivel ? brl(saldo) : OCULTO}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar valores" : "Mostrar valores"}
          aria-pressed={visivel}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Icone className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <div
          role="group"
          aria-label="Despesas por categoria em relação à receita"
          className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
          onMouseLeave={() => setAtivo(null)}
        >
          {trechos.map((c, i) => (
            <button
              key={`${c.nome}-${c.cor}`}
              type="button"
              aria-label={`${c.nome}: ${brl(c.total)}`}
              onMouseEnter={() => setAtivo(i)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
              onClick={() => setAtivo((a) => (a === i ? null : i))}
              className={cn(
                "preencher h-full min-w-1 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring",
                ativo !== null && ativo !== i && "opacity-35",
              )}
              style={{ width: `${(c.total / base) * 100}%`, background: c.cor, animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {legenda}
        </p>
      </div>

      <dl className="grid gap-3 border-t pt-5 sm:grid-cols-3 sm:gap-6">
        {totais.map((t) => (
          <div key={t.rotulo} className="flex items-baseline justify-between gap-3 sm:flex-col sm:gap-1">
            <p className="text-sm text-muted-foreground">{t.rotulo}</p>
            <p className="num font-heading text-lg font-semibold">{t.v}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
