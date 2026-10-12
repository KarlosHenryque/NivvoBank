import { AuthForm } from "@/components/auth-form";
import { entrar } from "../actions";

export const metadata = { title: "Entrar | NivvoBank" };

export default function LoginPage() {
  return <AuthForm titulo="Entre na sua conta" acao={entrar} />;
}
