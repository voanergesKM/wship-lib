"use client";

import { ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eye, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ListMusic, ListPlus } from "lucide-react";
import Link from "next/link";

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
import { useAuth } from "@/components/providers/AuthContext";
import { AddToPlaylistDialog } from "@/components/shared/AddToPlaylistDialog";
import { groupsService } from "@/services/groups.service";

export function SongPage({ slug }: { slug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useQuery(songOptions({ slug }));

  const { user, isAuthenticated } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const searchParams = useSearchParams();
  const listId = searchParams?.get("list") || null;
  const groupId = searchParams?.get("group") || null;

  const { data: playlist } = useQuery({
    queryKey: ["songList", groupId, listId],
    queryFn: () => groupsService.getSongListDetails(groupId!, listId!),
    enabled: !!listId && !!groupId,
  });

  const currentSongIndex = playlist?.songs
    ? playlist.songs.findIndex((s: any) => s.slug === slug)
    : -1;

  const hasPlaylistNav =
    playlist && currentSongIndex !== undefined && currentSongIndex !== -1;

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

  const canEdit = data.createdBy === user?.id || user?.role === "admin";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      {hasPlaylistNav && playlist && (
        <div className="bg-muted/30 border rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <ListMusic className="h-4 w-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Список:</span>
            <Link
              href={`/groups/${groupId}/lists/${listId}`}
              className="font-bold hover:underline truncate max-w-[200px] sm:max-w-md"
            >
              {playlist.name}
            </Link>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span className="font-medium shrink-0">
              Пісня {currentSongIndex + 1} з {playlist.songs.length}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={currentSongIndex === 0 ? "pointer-events-none opacity-50" : ""}
            >
              <Link
                href={
                  currentSongIndex > 0
                    ? `/songs/${playlist.songs[currentSongIndex - 1].slug}?list=${listId}&group=${groupId}`
                    : "#"
                }
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Назад
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className={
                currentSongIndex === playlist.songs.length - 1
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            >
              <Link
                href={
                  currentSongIndex < playlist.songs.length - 1
                    ? `/songs/${playlist.songs[currentSongIndex + 1].slug}?list=${listId}&group=${groupId}`
                    : "#"
                }
              >
                Вперед
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}

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

        <div className="flex gap-2 items-center flex-wrap">
          {mode === "view" && isAuthenticated && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(true)}
            >
              <ListPlus className="size-4" />
              Додати до списку
            </Button>
          )}

          {mode === "view" && canEdit && (
            <Button type="button" onClick={() => setMode("edit")}>
              <Edit3 />
              Редагувати
            </Button>
          )}

          {mode === "edit" && canEdit && (
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

      {isAddOpen && (
        <AddToPlaylistDialog
          songId={data._id.toString()}
          songTitle={data.title}
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
      )}
    </div>
  );
}
