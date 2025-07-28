import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export async function middleware(req: NextRequest) {
  const protectedPaths = ["/clients", "/cases", "/sessions", "/home"];
  const authPages = ["/login"];
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPage = authPages.some((path) => pathname.startsWith(path));
  const isRoot = pathname === "/";

  let isAuth = false;

  // 1. حاول تجيب التوكن من next-auth
  const nextAuthToken = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (nextAuthToken) {
    isAuth = true;
    console.log("✅ NextAuth token found:", nextAuthToken);
  }

  // 2. لو مفيش توكن من next-auth، حاول من Authorization header
  if (!isAuth) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        isAuth = true;
        console.log("✅ JWT token verified:", decoded);
      } catch (error) {
        console.error("❌ Invalid JWT token:", error);
      }
    }
  }

  // ✅ مسجل دخول ورايح صفحة login → نحوله على الصفحة الرئيسية
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // 🚫 مش مسجل دخول وبيحاول يدخل صفحة محمية
  if (!isAuth && (isProtected || isRoot)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};