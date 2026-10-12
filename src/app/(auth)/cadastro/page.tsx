import { AuthForm } from "@/components/auth-form";
import { cadastrar } from "../actions";

export const metadata = { title: "Cadastro | NivvoBank" };

export default function CadastroPage() {
  return <AuthForm titulo="Crie sua conta" acao={cadastrar} cadastro />;
}
