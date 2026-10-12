import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const cadastroSchema = loginSchema
  .extend({ confirmarSenha: z.string() })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
  });
