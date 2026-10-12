import { CategoriasView } from "@/components/categorias/categorias-view";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaResumo } from "@/lib/cadastros";

export const metadata = { title: "Categorias | NivvoBank" };

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias_resumo")
    .select("id, nome, tipo, cor, qtd_lancamentos")
    .order("nome");

  return <CategoriasView categorias={(data ?? []) as CategoriaResumo[]} />;
}
