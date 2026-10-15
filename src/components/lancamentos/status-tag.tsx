const estilos = {
  pago: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  pendente: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function StatusTag({ status, vencimento, hoje }: { status: "pendente" | "pago"; vencimento: string; hoje: string }) {
  const rotulo = status === "pago" ? "Paga" : vencimento < hoje ? "Vencida" : "A pagar";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[status]}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {rotulo}
    </span>
  );
}
