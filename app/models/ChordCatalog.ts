import mongoose, { Schema, type Model } from "mongoose";
import type {
  ChordDefinition,
  ChordProposal,
  VoicingTemplate,
} from "@/types/chords";

type DefinitionRecord = ChordDefinition & {
  symbols: string[];
  intervalSignature: string;
};
type VoicingRecord = VoicingTemplate & { identity: string };
type ProposalRecord = Omit<ChordProposal, "createdAt"> & {
  createdAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
};
const definitionSchema = new Schema<DefinitionRecord>(
  {
    _id: String,
    quality: { type: String, default: "" },
    name: { type: String, required: true },
    category: { type: String, required: true },
    aliases: [String],
    intervals: [Number],
    optionalIntervals: [Number],
    symbols: [String],
    intervalSignature: { type: String, required: true },
  },
  { timestamps: true },
);
definitionSchema.index({ symbols: 1 }, { unique: true });
definitionSchema.index({ intervalSignature: 1 }, { unique: true });
const voicingSchema = new Schema<VoicingRecord>(
  {
    _id: String,
    chordId: { type: String, required: true, index: true },
    root: Number,
    bass: { type: Number, default: null },
    frets: [Number],
    fingers: [Number],
    barres: [
      {
        _id: false,
        fret: Number,
        fromString: Number,
        toString: Number,
        finger: Number,
      },
    ],
    movable: Boolean,
    octaveVariants: Boolean,
    omittedIntervals: [Number],
    version: { type: Number, default: 1 },
    identity: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);
const proposalSchema = new Schema<ProposalRecord>(
  {
    _id: String,
    userId: { type: String, required: true, index: true },
    authorName: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      required: true,
      index: true,
    },
    input: { type: Schema.Types.Mixed, required: true },
    before: Schema.Types.Mixed,
    definitionSnapshot: { type: Schema.Types.Mixed, required: true },
    reviewComment: String,
    reviewedBy: String,
    reviewedAt: Date,
  },
  { timestamps: true },
);
export const ChordDefinitionModel =
  (mongoose.models.ChordDefinition as Model<DefinitionRecord> | undefined) ??
  mongoose.model<DefinitionRecord>("ChordDefinition", definitionSchema);
export const ChordVoicingModel =
  (mongoose.models.ChordVoicing as Model<VoicingRecord> | undefined) ??
  mongoose.model<VoicingRecord>("ChordVoicing", voicingSchema);
export const ChordProposalModel =
  (mongoose.models.ChordProposal as Model<ProposalRecord> | undefined) ??
  mongoose.model<ProposalRecord>("ChordProposal", proposalSchema);
