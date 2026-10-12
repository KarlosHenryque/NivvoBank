"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExcluirModal } from "@/components/excluir-modal";
import { EstadoVazio } from "@/components/estado-vazio";
import { Modal } from "@/components/modal";
import { SubmitButton } from "@/components/submit-button";
import { motivoVinculo, type CategoriaResumo } from "@/lib/cadastros";
import { excluirCategoria, salvarCategoria } from "@/app/(app)/categorias/actions";

type Modo = { tipo: "form" | "excluir"; item: CategoriaResumo | null } | null;

const campo =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const rotulo = "flex flex-col gap-1.5 text-sm font-medium";

export function CategoriasView({ categorias }: { categorias: CategoriaResumo[] }) {
  const [modo, setModo] = useState<Modo>(null);
  const [erro, setErro] = useState<string>();
  const [pending, start] = useTransition();
  const item = modo?.item ?? null;

  const fechar = () => {
    setModo(null);
    setErro(undefined);
  };

  async function salvar(formData: FormData) {
    const r = await salvarCategoria(item?.id ?? null, formData);
    if (r.erro) setErro(r.erro);
    else {
      toast.success(item ? "Categoria atualizada" : "Categoria criada");
      fechar();
    }
  }

  function excluir() {
    start(async () => {
      const r = await excluirCategoria(item!.id);
      if (r.erro) setErro(r.erro);
      else {
        toast.success("Categoria excluída");
        fechar();
      }
    });
  }

  const grupo = (tipo: CategoriaResumo["tipo"], titulo: string) => {
    const itens = categorias.filter((c) => c.tipo === tipo);
    return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{titulo}</h2>
      {itens.length === 0 && <EstadoVazio texto="Nenhuma categoria neste grupo." />}
      <ul className="grid gap-3 sm:grid-cols-2">
        {itens.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border bg-card p-4">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-4 shrink-0 rounded-full" style={{ background: c.cor }} />
                <span className="truncate font-medium">{c.nome}</span>
              </span>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => setModo({ tipo: "form", item: c })}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={c.qtd_lancamentos > 0}
                  title={c.qtd_lancamentos > 0 ? motivoVinculo(c.qtd_lancamentos) : undefined}
                  onClick={() => setModo({ tipo: "excluir", item: c })}
                >
                  Excluir
                </Button>
              </div>
            </li>
          ))}
      </ul>
    </section>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button size="lg" className="h-10" onClick={() => setModo({ tipo: "form", item: null })}>
          Nova categoria
        </Button>
      </div>

      {grupo("despesa", "Despesas")}
      {grupo("receita", "Receitas")}

      <Modal aberto={modo?.tipo === "form"} onFechar={fechar} titulo={item ? "Editar categoria" : "Nova categoria"}>
        <form action={salvar} className="flex flex-col gap-4">
          <label className={rotulo}>
            Nome
            <input name="nome" required maxLength={60} defaultValue={item?.nome} className={campo} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={rotulo}>
              Tipo
              {item && <input type="hidden" name="tipo" value={item.tipo} />}
              <select name="tipo" defaultValue={item?.tipo ?? "despesa"} disabled={!!item} className={campo}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </label>
            <label className={rotulo}>
              Cor
              <input
                name="cor"
                type="color"
                defaultValue={item?.cor ?? "#3b82f6"}
                className="h-10 w-full cursor-pointer rounded-lg border border-input bg-background p-1"
              />
            </label>
          </div>
          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="lg" className="h-10" onClick={fechar}>
              Cancelar
            </Button>
            <SubmitButton />
          </div>
        </form>
      </Modal>

      <ExcluirModal
        aberto={modo?.tipo === "excluir"}
        nome={item?.nome}
        erro={erro}
        pending={pending}
        onFechar={fechar}
        onConfirmar={excluir}
      />
    </div>
  );
}
