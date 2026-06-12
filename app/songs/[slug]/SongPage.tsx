"use client";

import { ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/PageLoader";
import { songOptions } from "@/lib/queries/songQueries";
import {
  SongPayload,
  SongVisibility,
  songsService,
} from "@/services/songs.service";
import {
  normalizeYouTubeLinks,
  stringifyYouTubeLinks,
} from "@/utils/youtubeLinks";
import { SongEditForm } from "../_components/SongEditForm";
import { SongView } from "../_components/SongView";

export function SongPage({ slug }: { slug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useQuery(songOptions({ slug }));

  const { mutateAsync: updateSong } = useMutation({
    mutationFn: (payload: SongPayload) => songsService.update(slug, payload),
    onSuccess: async (updatedSong) => {
      queryClient.setQueryData(songOptions({ slug }).queryKey, updatedSong);

      if (updatedSong.slug !== slug) {
        queryClient.setQueryData(
          songOptions({ slug: updatedSong.slug }).queryKey,
          updatedSong,
        );
        router.replace(`/songs/${updatedSong.slug}`);
      }

      await queryClient.invalidateQueries({
        queryKey: songOptions({ slug: updatedSong.slug }).queryKey,
      });

      setMode("view");
      setError(null);
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Не вдалося зберегти пісню",
      );
    },
  });

  if (isLoading) return <PageLoader />;

  if (!data) return <div>Song not found</div>;

  const youtube = normalizeYouTubeLinks(data.youtube);
  const visibility = (data.visibility ?? "public") as SongVisibility;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {mode === "view" ? (
              <Eye className="size-4" />
            ) : (
              <Edit3 className="size-4" />
            )}
            <span>
              {mode === "view" ? "Перегляд пісні" : "Редагування пісні"}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-normal">{data.title}</h1>
        </div>

        {mode === "view" ? (
          <Button type="button" onClick={() => setMode("edit")}>
            <Edit3 />
            Редагувати
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode("view")}
          >
            <X />
            Скасувати
          </Button>
        )}
      </div>

      {mode === "view" ? (
        <SongView
          title={data.title}
          tags={data.tags ?? []}
          authors={data.authors ?? []}
          songKey={data.key ?? undefined}
          bpm={data.bpm ?? undefined}
          document={data.document}
          youtube={youtube}
          visibility={visibility}
        />
      ) : (
        <SongEditForm
          defaultValues={{
            title: data.title,
            tags: data.tags?.join(", ") ?? "",
            authors: data.authors?.join(", ") ?? "",
            key: data.key ?? "",
            bpm: data.bpm ? String(data.bpm) : "",
            youtubeUrls: stringifyYouTubeLinks(data.youtube),
            visibility,
            document: data.document,
          }}
          error={error}
          onCancel={() => setMode("view")}
          onSubmit={async (payload) => {
            setError(null);
            await updateSong(payload);
          }}
        />
      )}
    </div>
  );
}
