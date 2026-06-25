import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/setup/admin", "/forgot-password", "/reset-password", "/set-password"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = publicRoutes.some((route) => pathname === route);
  const hasSession = request.cookies.has("dha_access_token");

  if (!isPublic && !hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  if (isPublic && hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
