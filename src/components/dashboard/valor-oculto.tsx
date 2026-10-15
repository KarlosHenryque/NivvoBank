"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { rotulo: string; valor: string; className?: string; valorClassName?: string };

export function ValorOculto({ rotulo, valor, className, valorClassName }: Props) {
  const [visivel, setVisivel] = useState(false);
  const Icone = visivel ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={() => setVisivel((v) => !v)}
      aria-label={visivel ? `Ocultar ${rotulo}` : `Mostrar ${rotulo}`}
      className={cn("rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50 sm:p-5", className)}
    >
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <span className={cn("num flex items-center gap-1.5 font-semibold", valorClassName)}>
        {visivel ? valor : "R$ •••••"}
        <Icone className="size-4 shrink-0 text-muted-foreground" />
      </span>
    </button>
  );
}
