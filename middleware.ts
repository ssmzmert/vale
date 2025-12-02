import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedAdmin = /^\/admin(\/.*)?$/;
const protectedValet = /^\/valet(\/.*)?$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!protectedAdmin.test(pathname) && !protectedValet.test(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInUrl = new URL("/giris", req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = token.role as string;

  if (protectedAdmin.test(pathname) && !["ADMIN", "VIEWER"].includes(role)) {
    return NextResponse.redirect(new URL("/valet", req.url));
  }

  if (protectedValet.test(pathname) && role !== "ADMIN" && role !== "VALET") {
    return NextResponse.redirect(new URL("/giris", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/valet/:path*"]
};
