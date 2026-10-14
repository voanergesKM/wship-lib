"use client";

import { useState } from "react";
import z from "zod";
import { X, GitPullRequest } from "lucide-react";

import { useAppForm } from "@/components/shared/Form";
import { getFormattedFormErrors } from "@/components/shared/Form/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { songSchema, songSchemaStep1 } from "@/lib/schema/song.schema";
import {
  ProposalPayload,
  SongProposalItem,
  SongVisibility,
} from "@/services/songs.service";
import {
  parseYouTubeLinks,
  stringifyYouTubeLinks,
  YouTubeLink,
} from "@/utils/youtubeLinks";
import { SongFormatGuideDialog } from "./SongFormatGuideDialog";
import { SongPreview } from "./SongPreview";

const proposalFormSchema = songSchema.extend({
  visibility: z.enum(["private", "team", "public"]),
  comment: z.string(),
});

type SongProposalFormValues = {
  title: string;
  tags: string;
  authors: string;
  key: string;
  bpm: string;
  youtubeUrls: string;
  visibility: SongVisibility;
  document: string;
  comment: string;
};

interface SongProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: {
    title: string;
    tags?: string[];
    authors?: string[];
    key?: string;
    bpm?: number;
    document: string;
    youtube?: YouTubeLink[];
    visibility?: SongVisibility;
  };
  proposal?: SongProposalItem | null;
  onSubmit: (data: ProposalPayload) => Promise<void>;
}

export function SongProposalDialog({
  open,
  onOpenChange,
  song,
  proposal,
  onSubmit,
}: SongProposalDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If editing an existing proposal, take values from proposal.proposedData
  const source = proposal?.proposedData ?? song;

  const defaultValues: SongProposalFormValues = {
    title: source.title ?? "",
    tags: source.tags?.join(", ") ?? "",
    authors: source.authors?.join(", ") ?? "",
    key: source.key ?? "",
    bpm: source.bpm ? String(source.bpm) : "",
    youtubeUrls: stringifyYouTubeLinks(source.youtube),
    visibility: (source.visibility ?? "public") as SongVisibility,
    document: source.document ?? "",
    comment: proposal?.comment ?? "",
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: proposalFormSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const validated = proposalFormSchema.parse(value);
        await onSubmit({
          title: validated.title,
          tags: toList(validated.tags),
          authors: toList(validated.authors),
          key: validated.key || undefined,
          bpm: validated.bpm ? Number(validated.bpm) : undefined,
          document: validated.document,
          youtube: parseYouTubeLinks(validated.youtubeUrls),
          visibility: validated.visibility,
          comment: validated.comment?.trim() || undefined,
        });
        onOpenChange(false);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося зберегти пропозицію змін",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const isEditing = Boolean(proposal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <GitPullRequest className="size-5 text-primary" />
            {isEditing
              ? "Редагувати пропозицію змін"
              : "Запропонувати зміни до пісні"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Оновіть запропоновані зміни та пояснення для автора."
              : "Внесіть необхідні правки до слів, акордів чи метаданих. Ваша пропозиція буде надіслана автору або адміністраторам на розгляд."}
          </DialogDescription>
        </DialogHeader>

        <form.AppForm>
          <div className="space-y-5 pt-2">
            <div className="grid gap-4 md:grid-cols-2">
              <form.AppField
                name="title"
                validators={{
                  onChange: ({ value }) => {
                    const res = songSchemaStep1.shape.title.safeParse(value);
                    return res.success
                      ? undefined
                      : getFormattedFormErrors(res.error.issues);
                  },
                }}
              >
                {(field) => <field.TextField label="Назва пісні" />}
              </form.AppField>

              <form.AppField
                name="authors"
                validators={{
                  onChange: ({ value }) => {
                    const res = songSchemaStep1.shape.authors.safeParse(value);
                    return res.success
                      ? undefined
                      : getFormattedFormErrors(res.error.issues);
                  },
                }}
              >
                {(field) => (
                  <field.TextField label="Автори" placeholder="Через кому" />
                )}
              </form.AppField>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr,120px,120px,160px]">
              <form.AppField
                name="tags"
                validators={{
                  onChange: ({ value }) => {
                    const res = songSchemaStep1.shape.tags.safeParse(value);
                    return res.success
                      ? undefined
                      : getFormattedFormErrors(res.error.issues);
                  },
                }}
              >
                {(field) => (
                  <field.TextField label="Теги" placeholder="Через кому" />
                )}
              </form.AppField>

              <div className="grid grid-cols-2 gap-4">
                <form.AppField
                  name="key"
                  validators={{
                    onChange: ({ value }) => {
                      const res = songSchemaStep1.shape.key.safeParse(value);
                      return res.success
                        ? undefined
                        : getFormattedFormErrors(res.error.issues);
                    },
                  }}
                >
                  {(field) => <field.TextField label="Тональність" />}
                </form.AppField>

                <form.AppField
                  name="bpm"
                  validators={{
                    onChange: ({ value }) => {
                      const res = songSchemaStep1.shape.bpm.safeParse(value);
                      return res.success
                        ? undefined
                        : getFormattedFormErrors(res.error.issues);
                    },
                  }}
                >
                  {(field) => (
                    <field.TextField label="BPM" inputMode="numeric" />
                  )}
                </form.AppField>
              </div>

              <form.AppField name="visibility">
                {(field) => (
                  <label className="grid gap-2 text-sm font-medium">
                    Видимість
                    <Select
                      value={field.state.value}
                      onValueChange={(val) =>
                        field.handleChange(val as SongVisibility)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Публічна</SelectItem>
                        <SelectItem value="team">Для команди</SelectItem>
                        <SelectItem value="private">Приватна</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                )}
              </form.AppField>
            </div>

            <form.AppField
              name="youtubeUrls"
              validators={{
                onChange: ({ value }) => {
                  const res = songSchemaStep1.shape.youtubeUrls.safeParse(value);
                  return res.success
                    ? undefined
                    : getFormattedFormErrors(res.error.issues);
                },
              }}
            >
              {(field) => (
                <field.TextAreaField
                  label="YouTube посилання"
                  description="Кожне посилання з нового рядка"
                  className="min-h-24"
                />
              )}
            </form.AppField>

            <div className="relative">
              <form.AppField
                name="document"
                validators={{
                  onChange: ({ value }) => {
                    const res = songSchema.shape.document.safeParse(value);
                    return res.success ? undefined : res.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <field.TextAreaField
                    label="Текст пісні з акордами"
                    className="min-h-72 font-mono"
                  />
                )}
              </form.AppField>

              <div className="absolute top-10 right-3 flex items-center gap-1.5">
                <SongFormatGuideDialog />
                <form.Subscribe selector={(state) => state.values.document}>
                  {(document) =>
                    document?.length > 0 ? (
                      <SongPreview content={document} />
                    ) : null
                  }
                </form.Subscribe>
              </div>
            </div>

            <form.AppField name="comment">
              {(field) => (
                <field.TextAreaField
                  label="Коментар до змін (необов'язково)"
                  placeholder="Опишіть, що саме ви виправили (наприклад: виправлено акорди у приспіві, додано 2-й куплет...)"
                  className="min-h-20"
                />
              )}
            </form.AppField>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                <X className="size-4 mr-1" />
                Скасувати
              </Button>
              <form.SubmitButton
                label={
                  isEditing ? "Оновити пропозицію" : "Надіслати пропозицію"
                }
              />
            </div>
          </div>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

function toList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
