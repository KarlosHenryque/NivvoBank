"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import type { AuthState } from "@/app/(auth)/actions";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const linkClass = "font-medium text-foreground underline underline-offset-4";

export function AuthForm({
  titulo,
  acao,
  cadastro,
}: {
  titulo: string;
  acao: (state: AuthState, formData: FormData) => Promise<AuthState>;
  cadastro?: boolean;
}) {
  const [state, action, pending] = useActionState(acao, {});

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <form
        action={action}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border bg-card p-6 sm:p-8"
      >
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <Logo size={40} />
          NivvoBank
        </h1>
        <p className="-mt-2 text-sm text-muted-foreground">{titulo}</p>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          E-mail
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Senha
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            autoComplete={cadastro ? "new-password" : "current-password"}
            className={inputClass}
          />
        </label>
        {cadastro && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Confirmar senha
            <input
              name="confirmarSenha"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
        )}

        {state.erro && (
          <p role="alert" className="text-sm text-destructive">
            {state.erro}
          </p>
        )}
        {state.info && <p className="text-sm text-muted-foreground">{state.info}</p>}

        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending ? "Aguarde..." : cadastro ? "Criar conta" : "Entrar"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {cadastro ? (
            <>
              Já tem conta?{" "}
              <Link href="/login" className={linkClass}>
                Entrar
              </Link>
            </>
          ) : (
            <>
              Não tem conta?{" "}
              <Link href="/cadastro" className={linkClass}>
                Cadastre-se
              </Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}
