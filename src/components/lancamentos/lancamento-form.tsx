"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { InputMoeda } from "@/components/input-moeda";
import { SubmitButton } from "@/components/submit-button";
import { hojeBR, type Categoria, type Lancamento } from "@/lib/lancamentos";
import { createLancamento, updateLancamento } from "@/app/(app)/lancamentos/actions";

const campo =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const rotulo = "flex flex-col gap-1.5 text-sm font-medium";
const semSpinner =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function LinhaSwitch({
  rotulo: texto,
  checked,
  onChange,
}: {
  rotulo: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-medium">
      {texto}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function Segmentado<T extends string>({
  name,
  valor,
  onChange,
  opcoes,
}: {
  name: string;
  valor: T;
  onChange: (v: T) => void;
  opcoes: { valor: T; label: string }[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border p-1">
      {opcoes.map((o) => (
        <label
          key={o.valor}
          className="cursor-pointer rounded-lg py-1.5 text-center text-sm font-medium has-checked:bg-foreground has-checked:text-background"
        >
          <input
            type="radio"
            name={name}
            value={o.valor}
            checked={valor === o.valor}
            onChange={() => onChange(o.valor)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function LancamentoForm({
  item,
  categorias,
  onFechar,
}: {
  item: Lancamento | null;
  categorias: Categoria[];
  onFechar: () => void;
}) {
  const [tipo, setTipo] = useState(item?.tipo ?? "despesa");
  const [recorrencia, setRecorrencia] = useState(item?.recorrencia ?? "variavel");
  const [parcelado, setParcelado] = useState(false);
  const [repetir, setRepetir] = useState(false);
  const [erro, setErro] = useState<string>();

  const mudarRecorrencia = (v: typeof recorrencia) => {
    setRecorrencia(v);
    if (v !== "fixa") setRepetir(false);
  };
  const mudarParcelado = (v: boolean) => {
    setParcelado(v);
    if (v) setRepetir(false);
  };
  const mudarRepetir = (v: boolean) => {
    setRepetir(v);
    if (v) setParcelado(false);
  };

  async function enviar(formData: FormData) {
    const dados = Object.fromEntries(formData);
    const r = item
      ? await updateLancamento(item.id, dados)
      : await createLancamento({ ...dados, parcelado, repetir });
    if (r.erro) setErro(r.erro);
    else {
      toast.success(item ? "Lançamento atualizado" : "Lançamento criado");
      onFechar();
    }
  }

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Segmentado
        name="tipo"
        valor={tipo}
        onChange={setTipo}
        opcoes={[
          { valor: "despesa", label: "Despesa" },
          { valor: "receita", label: "Receita" },
        ]}
      />

      <label className={rotulo}>
        Descrição
        <input name="descricao" required maxLength={120} defaultValue={item?.descricao} className={campo} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={rotulo}>
          Valor
          <InputMoeda name="valor" defaultValue={item?.valor} className={campo} />
        </label>
        <label className={rotulo}>
          Vencimento
          <input
            name="data_vencimento"
            type="date"
            required
            defaultValue={item?.data_vencimento ?? hojeBR()}
            className={campo}
          />
        </label>
      </div>

      <label className={rotulo}>
        Categoria
        <select key={tipo} name="categoria_id" defaultValue={item?.categoria_id ?? ""} className={campo}>
          <option value="">Sem categoria</option>
          {categorias
            .filter((c) => c.tipo === tipo)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
        </select>
      </label>

      <div className={rotulo}>
        Recorrência
        <Segmentado
          name="recorrencia"
          valor={recorrencia}
          onChange={mudarRecorrencia}
          opcoes={[
            { valor: "variavel", label: "Variável" },
            { valor: "fixa", label: "Fixa" },
          ]}
        />
      </div>

      <label className={rotulo}>
        Observação
        <textarea
          name="observacao"
          rows={2}
          maxLength={500}
          defaultValue={item?.observacao ?? ""}
          className={`${campo} h-auto py-2`}
        />
      </label>

      {!item && (
        <div className="flex flex-col">
          <LinhaSwitch rotulo="Parcelado?" checked={parcelado} onChange={mudarParcelado} />
          {parcelado && (
            <label className={rotulo}>
              Número de parcelas
              <input
                name="parcelas"
                type="number"
                inputMode="numeric"
                min={2}
                max={360}
                defaultValue={2}
                required
                className={`${campo} ${semSpinner}`}
              />
            </label>
          )}
          {recorrencia === "fixa" && (
            <LinhaSwitch rotulo="Repetir pelos próximos 12 meses" checked={repetir} onChange={mudarRepetir} />
          )}
        </div>
      )}

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="lg" className="h-10" onClick={onFechar}>
          Cancelar
        </Button>
        <SubmitButton>{item ? "Salvar alterações" : "Salvar"}</SubmitButton>
      </div>
    </form>
  );
}
