import { NextRequest, NextResponse } from "next/server";
import { isValidSessionCookie, COOKIE_NAME } from "@/lib/session";

const PROTECTED_PREFIXES = [
  "/inicio",
  "/dashboard",
  "/pacientes",
  "/pipeline",
  "/citas",
  "/agenda",
  "/actividades",
  "/facturacion",
  "/presupuestos",
  "/automatizaciones",
  "/analitica",
  "/configuracion",
];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthed = isValidSessionCookie(req.cookies.get(COOKIE_NAME)?.value);
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isProtected && !isAuthed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login" && isAuthed) {
    return NextResponse.redirect(new URL("/inicio", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/inicio/:path*",
    "/dashboard/:path*",
    "/pacientes/:path*",
    "/pipeline/:path*",
    "/citas/:path*",
    "/agenda/:path*",
    "/actividades/:path*",
    "/facturacion/:path*",
    "/presupuestos/:path*",
    "/automatizaciones/:path*",
    "/analitica/:path*",
    "/configuracion/:path*",
    "/login",
  ],
};
