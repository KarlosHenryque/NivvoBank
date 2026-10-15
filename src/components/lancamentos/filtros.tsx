"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mesVizinho, nomeMes, type Categoria } from "@/lib/lancamentos";

const campo =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function Filtros({
  mes,
  categorias,
}: {
  mes: string;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const busca = useRef("");
  busca.current = params.toString();

  function ir(chave: string, valor: string) {
    const p = new URLSearchParams(busca.current);
    if (valor) p.set(chave, valor);
    else p.delete(chave);
    busca.current = p.toString();
    router.replace(`/lancamentos?${p}`);
  }

  const tipo = params.get("tipo") ?? "despesa";
  const select = (
    chave: string,
    rotulo: string,
    opcoes: { valor: string | number; label: string }[],
    padrao?: string,
  ) => (
    <select
      aria-label={rotulo}
      value={params.get(chave) ?? padrao ?? ""}
      onChange={(e) => ir(chave, e.target.value)}
      className={campo}
    >
      {!padrao && <option value="">{rotulo}</option>}
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border bg-card p-1">
        <Button variant="ghost" size="icon-lg" aria-label="Mês anterior" onClick={() => ir("mes", mesVizinho(mes, -1))}>
          ‹
        </Button>
        <span className="font-medium first-letter:uppercase">{nomeMes(mes)}</span>
        <Button variant="ghost" size="icon-lg" aria-label="Próximo mês" onClick={() => ir("mes", mesVizinho(mes, 1))}>
          ›
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {select(
          "tipo",
          "Tipo",
          [
            { valor: "todos", label: "Todos os tipos" },
            { valor: "despesa", label: "Despesas" },
            { valor: "receita", label: "Receitas" },
          ],
          "despesa",
        )}
        {select("status", "Todos os status", [
          { valor: "pago", label: "Pagos" },
          { valor: "pendente", label: "Pendentes" },
        ])}
        {select(
          "categoria",
          "Todas as categorias",
          categorias.filter((c) => tipo === "todos" || c.tipo === tipo).map((c) => ({ valor: c.id, label: c.nome })),
        )}
      </div>
    </div>
  );
}
