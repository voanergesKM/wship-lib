export type GuitarFrets = readonly [number, number, number, number, number, number];
export interface Barre { fret: number; fromString: number; toString: number; finger: number }
export interface ChordDefinition {
  _id: string;
  quality: string;
  name: string;
  category: "basic" | "jazz" | "suspended";
  aliases: string[];
  intervals: number[];
  optionalIntervals: number[];
}
export interface VoicingData {
  root: number;
  bass: number | null;
  frets: GuitarFrets;
  fingers: GuitarFrets;
  barres: Barre[];
  movable: boolean;
  octaveVariants: boolean;
  omittedIntervals: number[];
}
export interface VoicingTemplate extends VoicingData { _id: string; chordId: string; version: number }
export interface GuitarVoicing {
  frets: GuitarFrets;
  fingers?: GuitarFrets;
  barres?: Barre[];
  omittedIntervals?: readonly number[];
  templateId?: string;
}
export interface ChordCatalogData { chords: ChordDefinition[]; voicings: VoicingTemplate[] }
export type ChordProposalInput = {
  kind: "add-voicing" | "edit-voicing" | "add-chord";
  chordId?: string;
  targetId?: string;
  baseVersion?: number;
  definition?: Omit<ChordDefinition, "_id">;
  voicing: VoicingData;
  comment: string;
};
export interface ChordProposal {
  _id: string;
  userId: string;
  authorName: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  input: ChordProposalInput;
  before?: VoicingTemplate;
  definitionSnapshot: ChordDefinition;
  createdAt: string;
  reviewComment?: string;
}
