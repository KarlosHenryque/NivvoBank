"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({ children = "Salvar" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-10" disabled={pending}>
      {pending ? "Salvando..." : children}
    </Button>
  );
}
