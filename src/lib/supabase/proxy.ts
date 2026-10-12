import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const rotasPublicas = ["/login", "/cadastro"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publica = rotasPublicas.includes(request.nextUrl.pathname);
  if (!user && !publica) return redirecionar(request, "/login", response);
  if (user && publica) return redirecionar(request, "/", response);

  return response;
}

function redirecionar(
  request: NextRequest,
  destino: string,
  origem: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  const redirect = NextResponse.redirect(url);
  origem.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}
