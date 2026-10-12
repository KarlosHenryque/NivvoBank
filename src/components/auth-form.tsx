"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import type { AuthState } from "@/app/(auth)/actions";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const linkClass = "font-medium text-foreground underline underline-offset-4";

function PasswordInput(props: React.ComponentProps<"input">) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visivel ? "text" : "password"} className={`${inputClass} pr-10`} />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-foreground"
      >
        {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

const forca = [
  { cor: "bg-red-500", nivel: 1 },
  { cor: "bg-orange-500", nivel: 2 },
  { cor: "bg-yellow-400", nivel: 3 },
  { cor: "bg-green-500", nivel: 4 },
];

function avaliarSenha(s: string) {
  const ok = [s.length >= 8, /[a-z]/.test(s), /[A-Z]/.test(s), /\d/.test(s), /[^A-Za-z0-9]/.test(s)];
  const pontos = ok.filter(Boolean).length;
  const nivel = !s ? 0 : pontos === 5 ? 4 : pontos >= 3 ? 3 : pontos === 2 ? 2 : 1;
  return { valida: pontos === 5, nivel };
}

function ForcaSenha({ nivel }: { nivel: number }) {
  const atual = forca[nivel - 1];
  return (
    <div className="flex gap-1" aria-hidden>
      {forca.map((f) => (
        <div
          key={f.nivel}
          className={`h-1.5 flex-1 rounded-full ${atual && f.nivel <= nivel ? atual.cor : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

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
  const [senha, setSenha] = useState("");
  const [senhaInvalida, setSenhaInvalida] = useState(false);
  const { valida, nivel } = avaliarSenha(senha);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <form
        action={action}
        onSubmit={(e) => {
          if (cadastro && !valida) {
            e.preventDefault();
            setSenhaInvalida(true);
          }
        }}
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
          <PasswordInput
            name="senha"
            required
            minLength={cadastro ? undefined : 6}
            autoComplete={cadastro ? "new-password" : "current-password"}
            onChange={(e) => {
              setSenha(e.target.value);
              setSenhaInvalida(false);
            }}
          />
        </label>
        {cadastro && (
          <p className="-mt-2 text-xs text-muted-foreground">
            Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.
          </p>
        )}
        {cadastro && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Confirmar senha
            <PasswordInput
              name="confirmarSenha"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
        )}
        {cadastro && <ForcaSenha nivel={nivel} />}
        {cadastro && senhaInvalida && (
          <p role="alert" className="-mt-2 text-sm text-destructive">
            Senha inválida
          </p>
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
