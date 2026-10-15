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
      className="sem-scroll m-auto overflow-y-auto bg-background p-0 text-foreground backdrop:bg-black/50 max-md:m-0 max-md:mt-auto max-md:max-h-[92dvh] max-md:w-full max-md:max-w-none max-md:rounded-t-2xl max-md:border-t md:max-h-[90dvh] md:w-full md:max-w-lg md:rounded-2xl md:border md:shadow-2xl"
    >
      {aberto && (
        <div className="flex flex-col gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          <span aria-hidden className="mx-auto -mb-1 h-1 w-10 rounded-full bg-border md:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="flex size-9 items-center justify-center rounded-lg text-xl leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
