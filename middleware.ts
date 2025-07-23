import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
export default withAuth(
  async function middleware(req) {
    // جلب الـ token مع التحقق من سرية  nextauth
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });
    // تضبيطات توضيح الـ token  لتتمكن من تتبع المشكلة الفعلية
    console.log("token", token);
    const isAuth = !!token; // التحقق لو فيه توكن موجودة
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");

    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for handling redirect on auth pages.
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/:path*"],
};
// middleware.ts
// import { NextRequest, NextResponse } from "next/server";
// import jwt from "jsonwebtoken";

// export function middleware(req: NextRequest) {
//   const protectedPaths = ["/clients", "/cases", "/sessions"];
//   const { pathname } = req.nextUrl;

//   // لو المسار غير محمي، سيبه يكمل
//   const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
//   if (!isProtected) return NextResponse.next();

//   const authHeader = req.headers.get("authorization");
//   const token = authHeader?.split(" ")[1]; // Bearer <token>

//   if (!token) {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!);
//     // تقدر تضيف هنا معلومات المستخدم في الـ request لو حبيت
//     return NextResponse.next();
//   } catch (error) {
//     console.error("Invalid token:", error);
//     return NextResponse.redirect(new URL("/login", req.url));
//   }
// }

// export const config = {
//   matcher: ["/clients/:path*", "/cases/:path*", "/sessions/:path*"],
// };
