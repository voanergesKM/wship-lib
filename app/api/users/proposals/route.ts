import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { SongProposal } from "@/models/SongProposal";
import "@/models/Song";
import "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();

  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ proposals: [] });
  }

  const proposals = await SongProposal.find({ user: session.user.id })
    .populate("song", "title slug key bpm")
    .populate("reviewedBy", "firstName lastName username")
    .sort({ createdAt: -1 });

  return NextResponse.json({ proposals });
}
