"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, LayoutDashboard, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const itens = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { href: "/categorias", label: "Categorias", icon: Tags },
];

export function NavLinks({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();

  return (
    <>
      {itens.map(({ href, label, icon: Icon }) => {
        const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "transition-colors",
              variant === "sidebar"
                ? "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
                : "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium",
              ativo
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              variant === "bottom" && ativo && "bg-transparent",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
