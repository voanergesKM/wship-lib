import crypto from "crypto";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { initData, widgetData } = body;

    if (!initData && !widgetData) {
      return NextResponse.json(
        { error: "Authentication data is missing" },
        { status: 400 },
      );
    }

    let tgUser: any = null;
    const isDevMock =
      process.env.NODE_ENV === "development" &&
      initData &&
      (initData.includes("mock") || !new URLSearchParams(initData).get("hash"));

    if (isDevMock) {
      tgUser = { id: 99999, first_name: "John", username: "testuser" };
    } else if (initData) {
      // Validate WebApp initData
      const params = new URLSearchParams(initData);
      const hash = params.get("hash");
      params.delete("hash");
      params.sort();

      const dataCheckString = Array.from(params.entries())
        .map(([key, value]) => `${key}=${decodeURIComponent(value)}`)
        .join("\n");

      const secretKey = crypto
        .createHmac("sha256", "WebAppData")
        .update(process.env.BOT_TOKEN || "")
        .digest();

      const calculatedHash = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

      if (calculatedHash !== hash) {
        return NextResponse.json(
          { error: "Invalid authentication hash" },
          { status: 401 },
        );
      }

      const userRaw = params.get("user");
      if (!userRaw) {
        return NextResponse.json(
          { error: "User data missing" },
          { status: 400 },
        );
      }
      tgUser = JSON.parse(userRaw);
    } else if (widgetData) {
      // Validate Telegram Login Widget data
      const { hash, ...data } = widgetData;
      const dataCheckString = Object.keys(data)
        .sort()
        .map((key) => `${key}=${data[key]}`)
        .join("\n");

      const secretKey = crypto
        .createHash("sha256")
        .update(process.env.BOT_TOKEN || "")
        .digest();

      const calculatedHash = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

      if (calculatedHash !== hash) {
        return NextResponse.json(
          { error: "Invalid widget authentication hash" },
          { status: 401 },
        );
      }
      tgUser = widgetData;
    }

    const emailFromTg = tgUser.email ? tgUser.email.toLowerCase().trim() : null;

    await connectDB();

    let dbUser = null;

    if (emailFromTg) {
      dbUser = await User.findOne({ email: emailFromTg });
    }

    if (!dbUser) {
      dbUser = await User.findOne({ telegramId: String(tgUser.id) });
    }

    if (dbUser) {
      dbUser.telegramId = String(tgUser.id);
      dbUser.username = tgUser.username || dbUser.username || null;
      dbUser.firstName = tgUser.first_name || dbUser.firstName;
      dbUser.lastName = tgUser.last_name || dbUser.lastName || null;
      dbUser.languageCode = tgUser.language_code || dbUser.languageCode || null;
      dbUser.photoUrl = tgUser.photo_url || dbUser.photoUrl;
      if (emailFromTg) dbUser.email = emailFromTg;

      await dbUser.save();
    } else {
      const payload = {
        telegramId: String(tgUser.id),
        username: tgUser.username || null,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name || null,
        languageCode: tgUser.language_code || null,
        photoUrl: tgUser.photo_url,
        ...(emailFromTg ? { email: emailFromTg } : {}),
      };

      dbUser = await User.create(payload);
    }

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

    return response;
  } catch (err: any) {
    console.error("❌ AUTH ERROR:", err.message || err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
