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

  const email = user?.email ?? "";
  return (
    <span className="flex items-center gap-2 px-1">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
        {email[0]}
      </span>
      <span className="truncate text-xs text-muted-foreground">{email}</span>
    </span>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r bg-card p-4 md:flex">
        <span className="font-heading flex items-center gap-2.5 px-3 text-xl font-semibold tracking-tight">
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

      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/85 px-4 py-2.5 backdrop-blur-md md:hidden">
        <span className="font-heading flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Logo size={28} />
          NivvoBank
        </span>
        <div className="flex gap-2">
          <SairButton />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] p-4 pb-28 sm:p-8 md:pb-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <NavLinks variant="bottom" />
      </nav>
    </div>
  );
}
