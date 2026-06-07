import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath =
    pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  if (isProtectedPath) {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, jwtSecret);

      return NextResponse.next();
    } catch (err) {
      console.warn(
        "❌ [Proxy Auth]: Token is not valid or expired. Removing session.",
      );

      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("session_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
