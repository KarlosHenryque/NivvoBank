export type Lancamento = {
  id: number;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: "pendente" | "pago";
  recorrencia: "fixa" | "variavel";
  parcela_atual: number;
  total_parcelas: number;
  grupo_parcelas: number | null;
  categoria_id: number | null;
  observacao: string | null;
};

export type Categoria = { id: number; nome: string; tipo: "receita" | "despesa"; cor: string };

export function addMeses(data: string, n: number) {
  const [y, m, d] = data.split("-").map(Number);
  const t = m - 1 + n;
  const ano = y + Math.floor(t / 12);
  const mes = ((t % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

export function dividirValor(valor: number, n: number) {
  const centavos = Math.round(valor * 100);
  const base = Math.floor(centavos / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? centavos - base * (n - 1) : base) / 100);
}

export type ModoValor = "parcela" | "total";

export function calcularParcelas(valor: number, n: number, modo: ModoValor) {
  const valores = modo === "total" ? dividirValor(valor, n) : Array.from({ length: n }, () => valor);
  const total = valores.reduce((s, v) => s + Math.round(v * 100), 0) / 100;
  return { valores, total, parcela: valores[0], ultima: valores[n - 1] };
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (d: string) => d.split("-").reverse().join("/");

export const hojeBR = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

export const mesAtual = () => hojeBR().slice(0, 7);

export const mesVizinho = (mes: string, n: number) => addMeses(`${mes}-01`, n).slice(0, 7);

export const nomeMes = (mes: string) =>
  new Date(`${mes}-01T00:00:00Z`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
