export type CategoriaResumo = {
  id: number;
  nome: string;
  tipo: "receita" | "despesa";
  cor: string;
  qtd_lancamentos: number;
};

export const motivoVinculo = (n: number) =>
  `Há ${n} lançamento${n > 1 ? "s" : ""} vinculado${n > 1 ? "s" : ""}`;
