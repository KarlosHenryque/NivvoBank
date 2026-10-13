"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/estado-vazio";
import { Modal } from "@/components/modal";
import { LancamentoForm } from "./lancamento-form";
import { StatusTag } from "./status-tag";
import { brl, dataBR, hojeBR, type Categoria, type Lancamento } from "@/lib/lancamentos";
import { excluirLancamento, pagarLancamento } from "@/app/(app)/lancamentos/actions";

type Modo = { tipo: "form" | "pagar" | "excluir"; item: Lancamento | null } | null;

const campo =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function LancamentosView({
  lancamentos,
  categorias,
  filtros,
}: {
  lancamentos: Lancamento[];
  categorias: Categoria[];
  filtros: React.ReactNode;
}) {
  const [modo, setModo] = useState<Modo>(null);
  const [erro, setErro] = useState<string>();
  const [pending, start] = useTransition();

  const fechar = () => {
    setModo(null);
    setErro(undefined);
  };
  const item = modo?.item ?? null;
  const cat = (id: number | null) => categorias.find((c) => c.id === id);

  function executar(acao: () => Promise<{ erro?: string }>, sucesso: string, fecharAoFim = true) {
    start(async () => {
      const r = await acao();
      if (r.erro) {
        setErro(r.erro);
        toast.error(r.erro);
      } else {
        toast.success(sucesso);
        if (fecharAoFim) fechar();
      }
    });
  }

  const parcelada = !!item && !!item.grupo_parcelas && item.total_parcelas > 1;

  const hojeStr = hojeBR();
  const receitas = lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const despesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
  const saldo = receitas - despesas;

  const badge = (l: Lancamento) =>
    l.tipo === "despesa" ? <StatusTag status={l.status} vencimento={l.data_vencimento} hoje={hojeStr} /> : null;

  const valor = (l: Lancamento) => (
    <span className="font-semibold">
      {l.tipo === "despesa" ? "−" : "+"}
      {brl(l.valor)}
    </span>
  );

  const acoes = (l: Lancamento) => (
    <div className="flex gap-1">
      {l.tipo === "receita" ? null : l.status === "pago" ? (
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => executar(() => pagarLancamento(l.id, null), "Pagamento desfeito", false)}>
          Desfazer
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setModo({ tipo: "pagar", item: l })}>
          Pagar
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => setModo({ tipo: "form", item: l })}>
        Editar
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setModo({ tipo: "excluir", item: l })}>
        Excluir
      </Button>
    </div>
  );

  const detalhes = (l: Lancamento) => {
    const c = cat(l.categoria_id);
    return (
      <>
        <p className="truncate font-medium">
          {l.descricao}
          {l.total_parcelas > 1 && (
            <span className="ml-2 text-xs text-muted-foreground">
              {l.parcela_atual}/{l.total_parcelas}
            </span>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {c && (
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ background: c.cor }} />
              {c.nome}
            </span>
          )}
        </p>
      </>
    );
  };

  const totais = [
    { rotulo: "Receitas", v: receitas },
    { rotulo: "Despesas", v: despesas },
    { rotulo: "Saldo", v: saldo },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <Button size="lg" className="h-10" onClick={() => setModo({ tipo: "form", item: null })}>
          Novo lançamento
        </Button>
      </div>

      {filtros}

      <div className="grid grid-cols-3 gap-2">
        {totais.map((t) => (
          <div key={t.rotulo} className="rounded-xl border bg-card p-4 sm:p-6">
            <p className="text-xs text-muted-foreground">{t.rotulo}</p>
            <p className="text-sm font-semibold sm:text-xl">{brl(t.v)}</p>
          </div>
        ))}
      </div>

      {lancamentos.length === 0 ? (
        <EstadoVazio texto="Nenhum lançamento neste filtro.">
          <Button onClick={() => setModo({ tipo: "form", item: null })}>Novo lançamento</Button>
        </EstadoVazio>
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {lancamentos.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">{detalhes(l)}</div>
                  {badge(l)}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col text-xs text-muted-foreground">
                    <span>Vence {dataBR(l.data_vencimento)}</span>
                    {l.tipo === "despesa" && l.data_pagamento && <span>Pago {dataBR(l.data_pagamento)}</span>}
                  </div>
                  {valor(l)}
                </div>
                {acoes(l)}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Descrição</th>
                  <th className="p-3 font-medium">Vencimento</th>
                  <th className="p-3 font-medium">Pagamento</th>
                  <th className="p-3 text-right font-medium">Valor</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {lancamentos.map((l) => (
                  <tr key={l.id}>
                    <td className="max-w-64 p-3">{detalhes(l)}</td>
                    <td className="p-3">{dataBR(l.data_vencimento)}</td>
                    <td className="p-3">{l.tipo === "despesa" && l.data_pagamento ? dataBR(l.data_pagamento) : "—"}</td>
                    <td className="p-3 text-right">{valor(l)}</td>
                    <td className="p-3">{badge(l) ?? "—"}</td>
                    <td className="p-3">{acoes(l)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal aberto={modo?.tipo === "form"} onFechar={fechar} titulo={item ? "Editar lançamento" : "Novo lançamento"}>
        <LancamentoForm item={item} categorias={categorias} onFechar={fechar} />
      </Modal>

      <Modal aberto={modo?.tipo === "pagar"} onFechar={fechar} titulo="Marcar como pago">
        <form
          action={(fd) => executar(() => pagarLancamento(item!.id, String(fd.get("data"))), "Marcado como pago")}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-muted-foreground">{item?.descricao}</p>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Data do pagamento
            <input name="data" type="date" required defaultValue={hojeBR()} className={`${campo} min-w-0 appearance-none`} />
          </label>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="lg" className="h-10" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="h-10" disabled={pending}>
              Confirmar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal aberto={modo?.tipo === "excluir"} onFechar={fechar} titulo="Excluir lançamento">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {parcelada
              ? `"${item?.descricao}" é a parcela ${item?.parcela_atual}/${item?.total_parcelas}. O que deseja excluir?`
              : `Excluir "${item?.descricao}"? Esta ação não pode ser desfeita.`}
          </p>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" size="lg" className="h-10" onClick={fechar}>
              Cancelar
            </Button>
            <Button variant="destructive" size="lg" className="h-10" disabled={pending} onClick={() => executar(() => excluirLancamento(item!.id, "uma"), "Lançamento excluído")}>
              {parcelada ? "Só esta" : "Excluir"}
            </Button>
            {parcelada && (
              <Button variant="destructive" size="lg" className="h-10" disabled={pending} onClick={() => executar(() => excluirLancamento(item!.id, "proximas"), "Lançamentos excluídos")}>
                Esta e as próximas
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
