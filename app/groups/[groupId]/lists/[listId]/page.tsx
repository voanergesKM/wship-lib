"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Trash2,
  ArrowUp,
  ArrowDown,
  Play,
  Loader2,
  Edit2,
  Check,
  Music,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { groupsService } from "@/services/groups.service";
import { PageLoader } from "@/components/shared/PageLoader";

export default function SongListPage({
  params,
}: {
  params: Promise<{ groupId: string; listId: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { groupId, listId } = use(params);

  // States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Fetch List details
  const { data: list, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ["songList", groupId, listId],
    queryFn: () => groupsService.getSongListDetails(groupId, listId),
  });

  useEffect(() => {
    if (list?.name) {
      setEditedName(list.name);
    }
  }, [list]);

  // Mutations
  const { mutateAsync: updateList, isPending: isUpdating } = useMutation({
    mutationFn: (payload: { name?: string; songs?: string[] }) =>
      groupsService.updateSongList(groupId, listId, payload),
    onSuccess: (updatedList) => {
      queryClient.setQueryData(["songList", groupId, listId], updatedList);
      queryClient.invalidateQueries({ queryKey: ["groupLists", groupId] });
      setIsEditingName(false);
    },
  });

  const { mutateAsync: removeSong, isPending: isRemovingSong } = useMutation({
    mutationFn: (songId: string) =>
      groupsService.removeSongFromList(groupId, listId, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songList", groupId, listId] });
    },
  });

  const handleRename = async () => {
    if (!editedName.trim() || editedName.trim() === list?.name) {
      setIsEditingName(false);
      return;
    }
    await updateList({ name: editedName.trim() });
  };

  const handleMoveSong = async (index: number, direction: "up" | "down") => {
    if (!list?.songs) return;

    const newSongs = [...list.songs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSongs.length) return;

    // Swap songs
    const temp = newSongs[index];
    newSongs[index] = newSongs[targetIndex];
    newSongs[targetIndex] = temp;

    // Extract just the string IDs for the update payload
    const songIds = newSongs.map((song) => song._id || song);
    await updateList({ songs: songIds });
  };

  const handleRemoveSong = async (songId: string) => {
    if (confirm("Ви дійсно хочете видалити цю пісню зі списку?")) {
      await removeSong(songId);
    }
  };

  if (listLoading) return <PageLoader />;

  if (listError || !list) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Помилка завантаження</h1>
        <p className="text-muted-foreground">
          Список пісень не знайдено або у вас немає доступу.
        </p>
        <Button asChild>
          <Link href={`/groups/${groupId}`}>Повернутися до групи</Link>
        </Button>
      </div>
    );
  }

  const songs = list.songs || [];

  return (
    <div className="w-full max-w-4xl space-y-6 py-6">
      {/* Back button */}
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" /> Повернутися до групи
      </Link>

      {/* Playlist Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6">
        <div className="flex-1 w-full space-y-1">
          {isEditingName ? (
            <div className="flex items-center gap-2 max-w-lg mt-1">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={isUpdating}
                className="text-2xl font-bold h-11"
                autoFocus
              />
              <Button size="icon" onClick={handleRename} disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setEditedName(list.name);
                  setIsEditingName(false);
                }}
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title">
              <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
              <Button
                size="icon"
                variant="ghost"
                className="opacity-0 group-hover/title:opacity-100 transition-opacity h-8 w-8 text-muted-foreground"
                onClick={() => setIsEditingName(true)}
                title="Перейменувати"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Оновлено: {new Date(list.updatedAt).toLocaleDateString()} • Створив:{" "}
            {list.createdBy?.firstName || "Невідомо"}
          </p>
        </div>

        {songs.length > 0 && (
          <Button
            asChild
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/95 shadow-md transition-all duration-200"
          >
            <Link
              href={`/songs/${songs[0].slug}?list=${listId}&group=${groupId}`}
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              Запустити список
            </Link>
          </Button>
        )}
      </div>

      {/* Song List Content */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Пісні у списку ({songs.length})
        </h3>

        {songs.length > 0 ? (
          <div className="border rounded-xl divide-y bg-card overflow-hidden">
            {songs.map((song: any, index: number) => (
              <div
                key={song._id}
                className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors"
              >
                {/* Index badge */}
                <div className="text-sm font-semibold text-muted-foreground w-6 text-center">
                  {index + 1}
                </div>

                {/* Move buttons */}
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={index === 0 || isUpdating}
                    onClick={() => handleMoveSong(index, "up")}
                    title="Перемістити вгору"
                  >
                    <ArrowUp className="h-4.5 w-4.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={index === songs.length - 1 || isUpdating}
                    onClick={() => handleMoveSong(index, "down")}
                    title="Перемістити вниз"
                  >
                    <ArrowDown className="h-4.5 w-4.5" />
                  </Button>
                </div>

                {/* Song info link */}
                <Link
                  href={`/songs/${song.slug}?list=${listId}&group=${groupId}`}
                  className="flex-1 min-w-0"
                >
                  <div className="font-bold text-base text-foreground hover:text-primary transition-colors truncate">
                    {song.title}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                    {song.authors && song.authors.length > 0 && (
                      <span>{song.authors.join(", ")}</span>
                    )}
                    {song.key && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>Тональність: {song.key}</span>
                      </>
                    )}
                    {song.bpm && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>Темп: {song.bpm} BPM</span>
                      </>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0"
                  onClick={() => handleRemoveSong(song._id)}
                  disabled={isRemovingSong}
                  title="Вилучити зі списку"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground space-y-4">
            <Music className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Цей список порожній</p>
              <p className="text-sm max-w-sm mx-auto">
                Знайдіть потрібні пісні через пошук на головній сторінці та додайте їх до цього списку.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Перейти до пошуку пісень</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
