import { z } from "zod";

const idOpcional = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.coerce.number().int().positive().nullable(),
);
const observacao = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? v.trim() : null),
  z.string().max(500, "Observação muito longa").nullable(),
);

const base = z.object({
  tipo: z.enum(["receita", "despesa"], "Tipo inválido"),
  descricao: z.string().trim().min(1, "Informe a descrição").max(120, "Descrição muito longa"),
  valor: z.coerce
    .number("Valor inválido")
    .positive("Informe um valor maior que zero")
    .max(9999999999.99, "Valor muito alto"),
  categoria_id: idOpcional,
  data_vencimento: z.iso.date("Data de vencimento inválida"),
  recorrencia: z.enum(["fixa", "variavel"], "Recorrência inválida"),
  observacao,
});

export const lancamentoEdicaoSchema = base;

export const lancamentoSchema = base
  .extend({
    parcelado: z.boolean(),
    modo_valor: z.enum(["parcela", "total"]).default("total"),
    repetir: z.boolean(),
    parcelas: z.preprocess(
      (v) => (v === "" || v == null ? 1 : v),
      z.coerce.number().int().min(1).max(360, "Máximo de 360 parcelas"),
    ),
  })
  .refine((d) => !(d.parcelado && d.repetir), { message: "Escolha parcelado ou repetir", path: ["repetir"] })
  .refine((d) => !d.parcelado || d.parcelas >= 2, {
    message: "Informe ao menos 2 parcelas",
    path: ["parcelas"],
  })
  .refine((d) => !d.repetir || d.recorrencia === "fixa", {
    message: "Repetir exige recorrência fixa",
    path: ["repetir"],
  });

const idFiltro = z.coerce.number().int().positive().optional().catch(undefined);

export const filtrosSchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .catch(undefined),
  tipo: z.enum(["receita", "despesa", "todos"]).optional().catch(undefined),
  status: z.enum(["pendente", "pago"]).optional().catch(undefined),
  categoria: idFiltro,
});

export const pagamentoSchema = z.iso.date("Data de pagamento inválida");
