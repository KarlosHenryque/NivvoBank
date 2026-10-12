export function EstadoVazio({
  texto,
  children,
}: {
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">{texto}</p>
      {children}
    </div>
  );
}
