"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function alternar() {
  const escuro = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("tema", escuro ? "dark" : "light");
  } catch {}
}

export function ThemeToggle() {
  return (
    <Button variant="outline" size="icon" aria-label="Alternar tema" onClick={alternar}>
      <Sun className="hidden text-foreground dark:block" />
      <Moon className="text-foreground dark:hidden" />
    </Button>
  );
}
