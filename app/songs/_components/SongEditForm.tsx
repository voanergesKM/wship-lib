import { useAppForm } from "@/components/shared/Form";
import { getFormattedFormErrors } from "@/components/shared/Form/utils";
import { Button } from "@/components/ui/button";
import { songSchema, songSchemaStep1 } from "@/lib/schema/song.schema";
import { SongPayload, SongVisibility } from "@/services/songs.service";
import { parseYouTubeLinks } from "@/utils/youtubeLinks";
import { X } from "lucide-react";
import z from "zod";
import { SongPreview } from "./SongPreview";

type SongEditValues = {
  title: string;
  tags: string;
  authors: string;
  key: string;
  bpm: string;
  youtubeUrls: string;
  visibility: SongVisibility;
  document: string;
};
const songEditSchema = songSchema.extend({
  visibility: z.enum(["private", "team", "public"]),
});

export function SongEditForm({
  defaultValues,
  error,
  onCancel,
  onSubmit,
}: {
  defaultValues: SongEditValues;
  error: string | null;
  onCancel: () => void;
  onSubmit: (payload: SongPayload) => Promise<void>;
}) {
  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: songEditSchema,
    },
    onSubmit: async ({ value }) => {
      const validated = songEditSchema.parse(value);

      await onSubmit({
        title: validated.title,
        tags: toList(validated.tags),
        authors: toList(validated.authors),
        key: validated.key || undefined,
        bpm: validated.bpm ? Number(validated.bpm) : undefined,
        document: validated.document,
        youtube: parseYouTubeLinks(validated.youtubeUrls),
        visibility: validated.visibility,
      });
    },
  });

  return (
    <form.AppForm>
      <div className="space-y-6 rounded-lg border bg-card p-4">
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
              {(field) => <field.TextField label="BPM" inputMode="numeric" />}
            </form.AppField>
          </div>

          <form.AppField name="visibility">
            {(field) => (
              <label className="grid gap-2 text-sm font-medium">
                Видимість
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={field.state.value}
                  onChange={(event) =>
                    field.handleChange(event.target.value as SongVisibility)
                  }
                >
                  <option value="public">Публічна</option>
                  <option value="team">Для команди</option>
                  <option value="private">Приватна</option>
                </select>
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
              className="min-h-28"
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
                className="min-h-80 font-mono"
              />
            )}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.document}>
            {(document) => {
              return (
                document?.length > 0 && (
                  <div className="absolute top-10 right-3">
                    <SongPreview content={document} />
                  </div>
                )
              );
            }}
          </form.Subscribe>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X />
            Скасувати
          </Button>
          <form.SubmitButton label="Зберегти" />
        </div>
      </div>
    </form.AppForm>
  );
}

function toList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
