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
              "group relative transition-colors",
              variant === "sidebar"
                ? "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
                : "flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium",
              ativo ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              variant === "sidebar" && (ativo ? "bg-muted" : "hover:bg-muted/60"),
            )}
          >
            {variant === "sidebar" && ativo && (
              <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" />
            )}
            <span
              className={cn(
                variant === "bottom" && "flex h-7 w-14 items-center justify-center rounded-full transition-colors",
                variant === "bottom" && ativo && "bg-primary/15",
              )}
            >
              <Icon className={cn("size-5 transition-colors", ativo && "text-primary")} />
            </span>
            {label}
          </Link>
        );
      })}
    </>
  );
}
