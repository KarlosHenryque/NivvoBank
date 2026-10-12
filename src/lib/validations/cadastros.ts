import { z } from "zod";

const nome = z.string().trim().min(1, "Informe o nome").max(60, "Nome muito longo");

export const categoriaSchema = z.object({
  nome,
  tipo: z.enum(["receita", "despesa"], "Tipo inválido"),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});
