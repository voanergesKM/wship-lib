import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { AuthSession } from "@/models/AuthSession";

export async function GET() {
  try {
    await connectDB();

    // Generate a unique short code
    const code = `auth_${crypto.randomBytes(4).toString("hex")}`;

    await AuthSession.create({
      code,
      status: "pending",
    });

    return NextResponse.json({ success: true, code });
  } catch (err: any) {
    console.error("Error generating auth code:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
