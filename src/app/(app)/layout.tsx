import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { SairButton } from "@/components/sair-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

async function EmailUsuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <span className="truncate px-1 text-xs text-muted-foreground">{user?.email}</span>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r bg-card p-4 md:flex">
        <span className="flex items-center gap-2 px-3 text-xl font-semibold">
          <Logo size={32} />
          NivvoBank
        </span>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLinks variant="sidebar" />
        </nav>
        <div className="flex flex-col gap-2">
          <Suspense fallback={<span className="h-4" />}>
            <EmailUsuario />
          </Suspense>
          <div className="flex gap-2">
            <SairButton />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <Logo size={28} />
          NivvoBank
        </span>
        <div className="flex gap-2">
          <SairButton />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] p-4 pb-24 sm:p-8 md:pb-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <NavLinks variant="bottom" />
      </nav>
    </div>
  );
}
