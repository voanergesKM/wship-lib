import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ChordDefinitionModel, ChordVoicingModel } from "@/models/ChordCatalog";
import { chordApiError } from "@/lib/chords/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await connectDB();
    const [chords, voicings] = await Promise.all([
      ChordDefinitionModel.find().select("-symbols -intervalSignature -__v -createdAt -updatedAt").sort({ createdAt: 1, _id: 1 }).lean(),
      ChordVoicingModel.find().select("-identity -__v -createdAt -updatedAt").sort({ createdAt: 1, _id: 1 }).lean(),
    ]);
    return NextResponse.json({ chords, voicings });
  } catch (error) { return chordApiError(error); }
}
