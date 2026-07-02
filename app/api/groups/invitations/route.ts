import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/serverAuth";
import { connectDB } from "@/lib/db";
import { Group } from "@/models/Group";

export async function GET() {
  await connectDB();
  try {
    const session = await getServerAuth();
    if (!session || !session.authenticated || !session.user) {
      return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
    }

    const { username, email } = session.user;
    const conditions = [];

    if (username) {
      const normalizedTg = username.replace(/^@/, "").toLowerCase();
      conditions.push({
        "invitations.type": "telegram",
        "invitations.value": { $regex: new RegExp(`^@?${normalizedTg}$`, "i") },
      });
    }

    if (email) {
      conditions.push({
        "invitations.type": "email",
        "invitations.value": email.toLowerCase(),
      });
    }

    if (conditions.length === 0) {
      return NextResponse.json([]);
    }

    // Find groups that have an invitation matching the current user
    const groups = await Group.find({
      $or: conditions,
    })
      .populate("createdBy", "firstName username")
      .populate("invitations.invitedBy", "firstName username");

    // Extract the specific invitation info for this user from the groups
    const invitations = groups.map((group) => {
      const invite = group.invitations.find((inv: any) => {
        if (inv.type === "telegram" && username) {
          const normalizedVal = inv.value.replace(/^@/, "").toLowerCase();
          const normalizedUser = username.replace(/^@/, "").toLowerCase();
          return normalizedVal === normalizedUser;
        }
        if (inv.type === "email" && email) {
          return inv.value.toLowerCase() === email.toLowerCase();
        }
        return false;
      });

      return {
        groupId: group._id,
        groupName: group.name,
        createdBy: group.createdBy,
        role: invite?.role || "member",
        invitedBy: invite?.invitedBy,
        createdAt: invite?.createdAt,
      };
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}
