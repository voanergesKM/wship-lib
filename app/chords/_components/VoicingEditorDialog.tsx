"use client";
import { useAuth } from "@/components/providers/AuthContext";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ChordAudioButton } from "@/components/chords/ChordAudioButton";
import { ChordDiagram } from "@/components/chords/ChordDiagram";
import {
  chordCatalogKey,
  chordRequest,
  useChordCatalog,
} from "@/hooks/useChordCatalog";
import {
  chordSymbols,
  definitionSchema,
  intervalSignature,
  proposalSchema,
  validateVoicingNotes,
  voicingSchema,
} from "@/lib/chords/validation";
import type {
  ChordDefinition,
  ChordProposal,
  ChordProposalInput,
  VoicingTemplate,
} from "@/types/chords";
import { NOTE_NAMES, soundingNotes } from "@/utils/guitarChords";
import { ChordFormatGuideDialog } from "./ChordFormatGuideDialog";
import {
  ChordDefinitionFields,
  type DefinitionDraft,
} from "./ChordDefinitionFields";
import {
  VoicingFields,
  type VoicingDraft,
  numbers,
  parseVoicingDraft,
} from "./VoicingFields";
import { toast } from "sonner";

export type EditorMode =
  | { kind: "add-chord" }
  | { kind: "add-voicing"; definition: ChordDefinition; root: number }
  | {
      kind: "edit-voicing";
      definition: ChordDefinition;
      template: VoicingTemplate;
    };
export function VoicingEditorDialog({
  mode,
  onClose,
}: {
  mode: EditorMode;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const template = mode.kind === "edit-voicing" ? mode.template : undefined;
  const [draft, setDraft] = useState<VoicingDraft>(() => ({
    root: String(
      template?.root ?? (mode.kind === "add-voicing" ? mode.root : 0),
    ),
    bass: template?.bass == null ? "none" : String(template.bass),
    frets: template?.frets.join(" ") ?? "-1 3 2 0 1 0",
    fingers: template?.fingers.join(" ") ?? "0 0 0 0 0 0",
    barres:
      template?.barres
        .map((b) => `${b.fret} ${b.fromString} ${b.toString} ${b.finger}`)
        .join("\n") ?? "",
    mode: template?.octaveVariants
      ? "octaves"
      : template?.movable
        ? "movable"
        : "fixed",
    omitted: template?.omittedIntervals.join(" ") ?? "",
  }));
  const [typeDraft, setTypeDraft] = useState<DefinitionDraft>({
    quality: "",
    name: "",
    category: "jazz",
    aliases: "",
    intervals: "0 4 7",
    optional: "7",
  });
  const [comment, setComment] = useState("");
  const catalog = useChordCatalog();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: ChordProposalInput) =>
      chordRequest<ChordProposal>("/api/chords/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: async (saved) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chordProposals"] }),
        ...(saved.status === "approved"
          ? [queryClient.invalidateQueries({ queryKey: chordCatalogKey })]
          : []),
      ]);
      toast.success(
        saved.status === "approved"
          ? "Зміни збережено в каталозі"
          : "Пропозицію надіслано на розгляд",
      );
      onClose();
    },
  });
  const newDefinition = definitionSchema.safeParse({
    quality: typeDraft.quality,
    name: typeDraft.name,
    category: typeDraft.category,
    aliases: typeDraft.aliases
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean),
    intervals: numbers(typeDraft.intervals),
    optionalIntervals: numbers(typeDraft.optional),
  });
  const definition =
    mode.kind === "add-chord"
      ? newDefinition.success
        ? newDefinition.data
        : undefined
      : mode.definition;
  const parsed = voicingSchema.safeParse(parseVoicingDraft(draft));
  const noteError =
    parsed.success && definition
      ? validateVoicingNotes(definition, parsed.data, catalog.data?.chords)
      : null;
  const duplicate =
    mode.kind === "add-chord" &&
    definition &&
    catalog.data?.chords.some(
      (entry) =>
        chordSymbols(entry).some((symbol) =>
          chordSymbols(definition).includes(symbol),
        ) ||
        intervalSignature(entry.intervals) ===
          intervalSignature(definition.intervals),
    );
  const formError =
    mode.kind === "add-chord" && !newDefinition.success
      ? newDefinition.error.issues[0].message
      : !parsed.success
        ? parsed.error.issues[0].message
        : noteError ||
          (duplicate
            ? "Такий тип або альтернативна назва вже існує. Додайте аплікатуру до наявного типу."
            : null);
  const name = `${NOTE_NAMES[Number(draft.root)]}${definition?.quality ?? typeDraft.quality}${draft.bass !== "none" ? `/${NOTE_NAMES[Number(draft.bass)]}` : ""}`;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>
            {isAdmin
              ? mode.kind === "add-chord"
                ? "Додати новий тип акорду"
                : mode.kind === "edit-voicing"
                  ? "Редагувати аплікатуру"
                  : "Додати аплікатуру"
              : mode.kind === "add-chord"
                ? "Запропонувати новий тип акорду"
                : mode.kind === "edit-voicing"
                  ? "Запропонувати зміну аплікатури"
                  : "Запропонувати аплікатуру"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Зміни одразу з’являться в каталозі."
              : "Зміни з’являться в каталозі після схвалення адміністратором."}{" "}
            Редагування переносного шаблону впливає на всі його тоніки.
          </DialogDescription>
        </DialogHeader>
        <div>
          <ChordFormatGuideDialog />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!parsed.success || !definition || formError) return;
            const input = proposalSchema.safeParse({
              kind: mode.kind,
              ...(mode.kind === "add-chord"
                ? { definition }
                : { chordId: mode.definition._id }),
              ...(template
                ? { targetId: template._id, baseVersion: template.version }
                : {}),
              voicing: parsed.data,
              comment,
            });
            if (input.success) mutation.mutate(input.data);
          }}
          className="flex flex-col gap-5"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <fieldset
              disabled={mutation.isPending}
              className="flex min-w-0 flex-col gap-5"
            >
              {mode.kind === "add-chord" ? (
                <ChordDefinitionFields
                  draft={typeDraft}
                  onChange={setTypeDraft}
                />
              ) : (
                <p className="font-medium">
                  Тип: {mode.definition.name} (
                  {mode.definition.quality || "мажор"})
                </p>
              )}
              <VoicingFields draft={draft} onChange={setDraft} />
              <Field>
                <FieldLabel htmlFor="voicing-comment">
                  {isAdmin ? "Що змінюєте й чому?" : "Що пропонуєте й чому?"}
                </FieldLabel>
                <Textarea
                  id="voicing-comment"
                  required
                  minLength={3}
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Field>
            </fieldset>
            <div className="flex flex-col gap-3 md:sticky md:top-0 md:self-start">
              <h3 className="font-semibold">Живий передпоказ: {name}</h3>
              {parsed.success ? (
                <>
                  <ChordDiagram voicing={parsed.data} name={name} />
                  <ChordAudioButton frets={parsed.data.frets} name={name} />
                  <p className="text-sm">
                    Ноти від товстої струни:{" "}
                    {soundingNotes(parsed.data.frets)
                      .map((note) => NOTE_NAMES[note % 12])
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Введіть коректні лади, пальці та баре, щоб побачити схему.
                </p>
              )}
              {definition && (
                <p className="text-sm text-muted-foreground">
                  Інтервали типу: {definition.intervals.join(" · ")}. Дозволені
                  пропуски:{" "}
                  {definition.optionalIntervals.join(" · ") || "немає"}.
                </p>
              )}
              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
              {mutation.error && (
                <p role="alert" className="text-sm text-destructive">
                  {mutation.error.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={onClose}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={
                !!formError ||
                !definition ||
                !parsed.success ||
                comment.trim().length < 3 ||
                mutation.isPending
              }
            >
              {mutation.isPending
                ? "Збереження…"
                : isAdmin
                  ? "Зберегти зміни"
                  : "Надіслати пропозицію"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
