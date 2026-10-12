import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export const senhaForte = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres")
  .regex(/[a-z]/, "A senha deve ter uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve ter uma letra maiúscula")
  .regex(/\d/, "A senha deve ter um número")
  .regex(/[^A-Za-z0-9]/, "A senha deve ter um símbolo (ex.: ! @ #)");

export const cadastroSchema = loginSchema
  .extend({ senha: senhaForte, confirmarSenha: z.string() })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
  });
