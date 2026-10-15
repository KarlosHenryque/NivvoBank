import { Inbox } from "lucide-react";

export function EstadoVazio({
  texto,
  children,
}: {
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <Inbox className="size-8 text-muted-foreground/60" aria-hidden />
      <p className="text-sm text-muted-foreground">{texto}</p>
      {children}
    </div>
  );
}
