"use client";

import { useState } from "react";
import { useAppForm } from "@/components/shared/Form";
import { getFormattedFormErrors } from "@/components/shared/Form/utils";
import { Button } from "@/components/ui/button";
import { songSchema, songSchemaStep1 } from "@/lib/schema/song.schema";
import { parseYouTubeLinks } from "@/utils/youtubeLinks";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { SongPreview } from "@/songs/_components/SongPreview";
import { SongFormatGuideDialog } from "@/songs/_components/SongFormatGuideDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { songsListOptions } from "@/lib/queries/songQueries";
import { SongPayload } from "@/services/songs.service";

export default function AddSongPage() {
  const queryClient = useQueryClient();

  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const { mutateAsync: createSong } = useMutation({
    mutationFn: async (payload: SongPayload) => {
      const response = await fetch("/api/songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueriesData<{
        data: any[];
        pagination: { total: number; [key: string]: any };
      }>({ queryKey: ["songsList"] }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: [data, ...old.data.filter((s) => s.slug !== data.slug)],
          pagination: {
            ...old.pagination,
            total: (old.pagination?.total || 0) + 1,
          },
        };
      });

      await queryClient.invalidateQueries({
        queryKey: ["songsList"],
      });

      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      console.log("🚀 ~ AddSongPage ~ err:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    },
  });

  const form = useAppForm({
    defaultValues: {
      title: "",
      tags: "",
      youtubeUrls: "",
      key: "",
      bpm: "",
      authors: "",
      document: "",
    },
    validators: {
      onSubmit: songSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);

      try {
        const validated = songSchema.parse(value);

        const payload: SongPayload = {
          title: validated.title,
          tags: validated.tags
            ? validated.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
          youtube: parseYouTubeLinks(validated.youtubeUrls),
          key: validated.key || undefined,
          bpm: validated.bpm ? Number(validated.bpm) : undefined,
          authors: validated.authors
            ? validated.authors
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean)
            : [],
          document: validated.document,
        };

        await createSong(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    },
  });

  const handleNext = async () => {
    // Trigger field-level validations so errors show up in the UI
    await form.validateAllFields("change");

    const values = form.state.values;
    const result = songSchemaStep1.safeParse({
      title: values.title,
      tags: values.tags,
      youtubeUrls: values.youtubeUrls,
      key: values.key,
      bpm: values.bpm,
      authors: values.authors,
    });

    if (!result.success) {
      return;
    }

    setStep(2);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Додати пісню</h1>
        <span className="text-sm text-muted-foreground">Крок {step} з 2</span>
      </div>

      <form.AppForm>
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
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
              {(field) => (
                <field.TextField
                  label="Назва пісні"
                  placeholder="Введіть назву"
                />
              )}
            </form.AppField>

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
                <field.TextField
                  label="Теги"
                  placeholder="прославлення, поклоніння (через кому)"
                  description="Введіть теги через кому"
                />
              )}
            </form.AppField>

            <form.AppField
              name="authors"
              validators={{
                onChange: ({ value }) => {
                  const res = songSchema.shape.authors.safeParse(value);
                  return res.success ? undefined : res.error.issues[0].message;
                },
              }}
            >
              {(field) => (
                <field.TextField
                  label="Автори"
                  placeholder="Олександр, Павло (через кому)"
                />
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
                {(field) => (
                  <field.TextField
                    label="Тональність"
                    placeholder="C, G, Am..."
                  />
                )}
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
                  <field.TextField label="BPM" placeholder="75, 120..." />
                )}
              </form.AppField>
            </div>

            <form.AppField
              name="youtubeUrls"
              validators={{
                onChange: ({ value }) => {
                  const res =
                    songSchemaStep1.shape.youtubeUrls.safeParse(value);
                  return res.success
                    ? undefined
                    : getFormattedFormErrors(res.error.issues);
                },
              }}
            >
              {(field) => (
                <field.TextAreaField
                  label="YouTube посилання"
                  placeholder="https://www.youtube.com/watch?v=..."
                  description="Кожне посилання з нового рядка"
                  rows={4}
                />
              )}
            </form.AppField>

            <div className="pt-4 flex justify-end">
              <Button type="button" onClick={handleNext} className="px-10">
                Далі
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="relative">
              <form.AppField
                name="document"
                validators={{
                  onChange: ({ value }) => {
                    const res = songSchema.shape.document.safeParse(value);
                    return res.success
                      ? undefined
                      : res.error.issues[0].message;
                  },
                }}
              >
                {(field) => (
                  <field.TextAreaField
                    label="Текст пісні з акордами"
                    placeholder="Введіть текст пісні та акорди..."
                    className=" font-mono"
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

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex justify-between gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="px-10"
              >
                Назад
              </Button>
              <form.SubmitButton label="Додати" />
            </div>
          </motion.div>
        )}
      </form.AppForm>
    </div>
  );
}
