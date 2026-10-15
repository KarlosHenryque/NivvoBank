"use client";

import { useEffect, useRef } from "react";

export function Modal({
  aberto,
  onFechar,
  titulo,
  children,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
      className="sem-scroll m-auto overflow-y-auto bg-background p-0 text-foreground backdrop:bg-black/50 max-md:m-0 max-md:h-dvh max-md:max-h-none max-md:w-full max-md:max-w-none md:w-full md:max-w-lg md:rounded-xl md:border md:shadow-lg"
    >
      {aberto && (
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="rounded-lg px-2 py-1 text-xl leading-none text-muted-foreground hover:bg-muted"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
