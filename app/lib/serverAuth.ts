import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function getServerAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return { authenticated: false, user: null };
    }

    const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, jwtSecret);

    await connectDB();
    const dbUser = await User.findById(payload.userId).select("-password");

    if (!dbUser || !dbUser.isActive) {
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: {
        id: dbUser._id.toString(),
        telegramId: dbUser.telegramId,
        firstName: dbUser.firstName,
        username: dbUser.username,
        role: dbUser.role,
        photoUrl: dbUser.photoUrl,
        email: dbUser.email || null,
      },
    };
  } catch (err) {
    console.error("Error checking getServerAuth:", err);
    return { authenticated: false, user: null };
  }
}
