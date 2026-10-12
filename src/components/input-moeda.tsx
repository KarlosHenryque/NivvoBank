"use client";

import { useState } from "react";

const formatar = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function InputMoeda({
  name,
  defaultValue = 0,
  permitirNegativo,
  onValor,
  className,
}: {
  name: string;
  defaultValue?: number;
  permitirNegativo?: boolean;
  onValor?: (valor: number) => void;
  className?: string;
}) {
  const [centavos, setCentavos] = useState(Math.round(defaultValue * 100));

  return (
    <>
      <input
        type="text"
        inputMode={permitirNegativo ? "text" : "numeric"}
        autoComplete="off"
        value={formatar(centavos)}
        onChange={(e) => {
          const v = e.target.value;
          const n = Number(v.replace(/\D/g, "") || 0);
          const c = permitirNegativo && v.includes("-") ? -n : n;
          setCentavos(c);
          onValor?.(c / 100);
        }}
        className={className}
      />
      <input type="hidden" name={name} value={(centavos / 100).toFixed(2)} />
    </>
  );
}
