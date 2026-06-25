import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AuthSession } from "@/models/AuthSession";
import { User } from "@/models/User";
import { SignJWT } from "jose";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Code is missing" }, { status: 400 });
    }

    await connectDB();

    const session = await AuthSession.findOne({ code }).populate("user");

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "pending") {
      return NextResponse.json({ success: true, status: "pending" });
    }

    if (session.status === "completed" && session.user) {
      const dbUser = session.user;

      const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({
        userId: dbUser._id.toString(),
        telegramId: dbUser.telegramId,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(jwtSecret);

      const response = NextResponse.json({
        success: true,
        status: "completed",
        user: { id: dbUser._id, firstName: dbUser.firstName },
      });

      response.cookies.set({
        name: "session_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      // Optionally delete the session after successful auth
      await AuthSession.deleteOne({ _id: session._id });

      return response;
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  } catch (err: any) {
    console.error("Error checking auth status:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
