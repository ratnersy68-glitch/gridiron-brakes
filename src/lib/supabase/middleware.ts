import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const TEACHER_PREFIXES = ["/dashboard", "/classes", "/students", "/assignments", "/gradebook", "/analytics", "/settings"];
const STUDENT_PREFIXES = ["/student"];
const AUTH_PREFIXES = ["/login", "/signup", "/reset-password", "/update-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const role = (user?.user_metadata?.role as string | undefined) ?? "student";

  const isTeacherRoute = TEACHER_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  const isStudentRoute = STUDENT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthPage = AUTH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && (isTeacherRoute || isStudentRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  if (user && isTeacherRoute && role !== "teacher") {
    const url = request.nextUrl.clone();
    url.pathname = "/student/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && isStudentRoute && role !== "student") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = role === "teacher" ? "/dashboard" : "/student/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
