"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/modal";

export function ExcluirModal({
  aberto,
  nome,
  erro,
  pending,
  onFechar,
  onConfirmar,
}: {
  aberto: boolean;
  nome?: string;
  erro?: string;
  pending: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Excluir">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Excluir &quot;{nome}&quot;? Esta ação não pode ser desfeita.
        </p>
        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="lg" className="h-10" onClick={onFechar}>
            Cancelar
          </Button>
          <Button variant="destructive" size="lg" className="h-10" disabled={pending} onClick={onConfirmar}>
            Excluir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
