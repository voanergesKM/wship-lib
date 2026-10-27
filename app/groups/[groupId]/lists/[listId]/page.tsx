"use client";

import { useState, useMemo, useEffect } from "react";
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
  X,
  ListMusic,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/shared/ButtonSpinner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  groupsService,
  PopulatedSongListItem,
} from "@/services/groups.service";
import { PageLoader } from "@/components/shared/PageLoader";
import { useSongArrangements } from "@/hooks/useSongArrangements";
import { useAuth } from "@/components/providers/AuthContext";
import { useConductorSession } from "@/hooks/useConductorSession";
import type { ConductorSessionState } from "@/types/conductor.types";
import { cn } from "@/lib/utils";

export default function SongListPage({
  params: _params,
}: {
  params?: Promise<{ groupId: string; listId: string }>;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams<{ groupId: string; listId: string }>();
  const groupId = routeParams?.groupId ?? "";
  const listId = routeParams?.listId ?? "";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editingArrangementSong, setEditingArrangementSong] =
    useState<PopulatedSongListItem | null>(null);

  // Fetch Group details (for permissions)
  const { data: group } = useQuery({
    queryKey: ["groupDetails", groupId],
    queryFn: () => groupsService.getGroupDetails(groupId),
    enabled: !!groupId,
  });

  const userGroupRole = useMemo(() => {
    if (!group?.members || !user?.id) return null;
    const m = group.members.find(
      (member) =>
        member.userId?._id === user.id ||
        (member.userId as unknown as string) === user.id,
    );
    return m?.role || null;
  }, [group, user]);

  const canConduct = userGroupRole === "owner" || userGroupRole === "admin";

  // Fetch List details
  const {
    data: list,
    isLoading: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ["songList", groupId, listId],
    queryFn: () => groupsService.getSongListDetails(groupId, listId),
    enabled: Boolean(groupId && listId),
  });

  // Active conductor session for this group
  const { data: activeSession } = useQuery<ConductorSessionState | null>({
    queryKey: ["conductorSession", "group", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/conductor/sessions?groupId=${groupId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(groupId),
    refetchInterval: 4000,
  });

  const { start: startSession, isLoading: isStartingSession } =
    useConductorSession({
      groupId,
    });

  const songsWithoutArrangement = useMemo(() => {
    if (!list?.songs) return [];
    return list.songs.filter((song) => {
      return !list.songArrangements?.some(
        (sa) =>
          Boolean(sa.arrangement) &&
          (typeof sa.song === "object" ? sa.song._id : sa.song) === song._id,
      );
    });
  }, [list]);

  const canStartLive =
    canConduct &&
    songsWithoutArrangement.length === 0 &&
    (list?.songs?.length || 0) > 0;

  const handleStartLiveSession = async () => {
    try {
      const result = await startSession(listId);
      if (result) {
        router.push(
          `/songs/${result.currentSongSlug}?list=${listId}&group=${groupId}&asConductor=${result.sessionId}`,
        );
      }
    } catch (err: any) {
      toast.error("Помилка запуску живого списку", {
        description: err.message,
      });
    }
  };

  useEffect(() => {
    if (
      searchParams?.get("start_conductor") === "1" &&
      canStartLive &&
      !activeSession &&
      !isStartingSession
    ) {
      handleStartLiveSession();
    }
  }, [searchParams, canStartLive, activeSession, isStartingSession]);

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

  const {
    mutateAsync: removeSong,
    isPending: isRemovingSong,
    variables: removingSongId,
  } = useMutation({
    mutationFn: (songId: string) =>
      groupsService.removeSongFromList(groupId, listId, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["songList", groupId, listId],
      });
    },
  });

  const { mutateAsync: setArrangement, isPending: isSettingArrangement } =
    useMutation({
      mutationFn: ({
        songId,
        arrangementId,
      }: {
        songId: string;
        arrangementId: string | null;
      }) =>
        groupsService.setSongArrangement(
          groupId,
          listId,
          songId,
          arrangementId,
        ),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["songList", groupId, listId],
        });
        setEditingArrangementSong(null);
      },
    });

  const handleRename = async () => {
    if (!editedName.trim() || editedName.trim() === list?.name) {
      setIsEditingName(false);
      return;
    }
    await updateList({ name: editedName.trim() });
  };

  const [movingSong, setMovingSong] = useState<{
    index: number;
    direction: "up" | "down";
  } | null>(null);

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
    const songIds = newSongs.map((song) => song._id);
    setMovingSong({ index, direction });
    try {
      await updateList({ songs: songIds });
    } finally {
      setMovingSong(null);
    }
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
        <h1 className="text-2xl font-bold text-destructive">
          Помилка завантаження
        </h1>
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
                onClick={() => {
                  setEditedName(list.name);
                  setIsEditingName(true);
                }}
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {activeSession &&
          !activeSession.endedAt &&
          !activeSession.isDisconnected ? (
            activeSession.conductorUserId === user?.id ? (
              <Button
                asChild
                className="w-full sm:w-auto bg-primary text-primary-foreground gap-1.5 shadow-md"
              >
                <Link
                  href={`/songs/${activeSession.currentSongSlug}?list=${listId}&group=${groupId}&asConductor=${activeSession._id}`}
                >
                  <span>🎼</span>
                  Продовжити диригування
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto gap-1.5 border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10 shadow-xs"
              >
                <Link
                  href={`/songs/${activeSession.currentSongSlug}?list=${listId}&group=${groupId}&conductor=${activeSession._id}`}
                >
                  <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                  👥 Приєднатись до репетиції
                </Link>
              </Button>
            )
          ) : (
            canConduct && (
              <Button
                onClick={handleStartLiveSession}
                disabled={!canStartLive || isStartingSession}
                variant="outline"
                className="w-full sm:w-auto gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-xs"
              >
                {isStartingSession ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <span>🎼</span>
                )}
                Живий список
              </Button>
            )
          )}

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
      </div>

      {/* Live Session Active Banner */}
      {activeSession &&
        !activeSession.endedAt &&
        !activeSession.isDisconnected && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <Radio className="size-5 text-green-600 dark:text-green-400 shrink-0 animate-pulse" />
              <div>
                <p className="font-semibold text-green-950 dark:text-green-200">
                  Триває жива репетиція
                </p>
                <p className="text-xs text-green-800/80 dark:text-green-300/80">
                  {activeSession.conductorUserId === user?.id
                    ? "Ви запустили диригування цим списком пісень."
                    : "Диригент проводить синхронізовану репетицію списку."}
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white shrink-0"
            >
              <Link
                href={
                  activeSession.conductorUserId === user?.id
                    ? `/songs/${activeSession.currentSongSlug}?list=${listId}&group=${groupId}&asConductor=${activeSession._id}`
                    : `/songs/${activeSession.currentSongSlug}?list=${listId}&group=${groupId}&conductor=${activeSession._id}`
                }
              >
                {activeSession.conductorUserId === user?.id
                  ? "Перейти до диригування"
                  : "Приєднатися"}
              </Link>
            </Button>
          </div>
        )}

      {/* Validation banner: songs without arrangement */}
      {canConduct && songsWithoutArrangement.length > 0 && (
        <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            ⚠️ Не всі пісні мають структуру для живого списку:
          </p>
          <ul className="list-disc list-inside text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
            {songsWithoutArrangement.map((s) => (
              <li key={s._id}>{s.title}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Призначте структуру кожній пісні списку, щоб мати змогу запустити
            «Живий список».
          </p>
        </div>
      )}

      {/* Song List Content */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Пісні у списку ({songs.length})
        </h3>

        {songs.length > 0 ? (
          <div className="border rounded-xl divide-y bg-card overflow-hidden">
            {songs.map((song: PopulatedSongListItem, index: number) => {
              const songArrangement = list.songArrangements?.find(
                (sa) =>
                  (typeof sa.song === "object" ? sa.song._id : sa.song) ===
                  song._id,
              )?.arrangement;

              return (
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
                      isLoading={
                        isUpdating &&
                        movingSong?.index === index &&
                        movingSong.direction === "up"
                      }
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={index === 0 || isUpdating}
                      onClick={() => handleMoveSong(index, "up")}
                      title="Перемістити вгору"
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      isLoading={
                        isUpdating &&
                        movingSong?.index === index &&
                        movingSong.direction === "down"
                      }
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={index === songs.length - 1 || isUpdating}
                      onClick={() => handleMoveSong(index, "down")}
                      title="Перемістити вниз"
                    >
                      <ArrowDown />
                    </Button>
                  </div>

                  {/* Song info link */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      href={`/songs/${song.slug}?list=${listId}&group=${groupId}`}
                      className="block font-bold text-base text-foreground hover:text-primary transition-colors truncate"
                    >
                      {song.title}
                    </Link>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground items-center">
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

                      {/* Arrangement Badge / Trigger */}
                      <span className="hidden sm:inline">•</span>
                      {songArrangement ? (
                        <button
                          type="button"
                          onClick={() => setEditingArrangementSong(song)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          <ListMusic className="size-3" />
                          <span>Структура: {songArrangement.name}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingArrangementSong(song)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
                        >
                          <ListMusic className="size-3" />
                          <span>Обрати структуру</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0"
                    onClick={() => handleRemoveSong(song._id)}
                    disabled={isRemovingSong}
                    isLoading={isRemovingSong && removingSongId === song._id}
                    title="Вилучити зі списку"
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground space-y-4">
            <Music className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Цей список порожній</p>
              <p className="text-sm max-w-sm mx-auto">
                Знайдіть потрібні пісні через пошук на головній сторінці та
                додайте їх до цього списку.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Перейти до пошуку пісень</Link>
            </Button>
          </div>
        )}
      </div>

      {editingArrangementSong && (
        <SongListArrangementDialog
          song={editingArrangementSong}
          currentArrangementId={
            list.songArrangements?.find(
              (sa) =>
                (typeof sa.song === "object" ? sa.song._id : sa.song) ===
                editingArrangementSong._id,
            )?.arrangement?._id
          }
          open={Boolean(editingArrangementSong)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingArrangementSong(null);
          }}
          onSelect={async (arrangementId) => {
            await setArrangement({
              songId: editingArrangementSong._id,
              arrangementId,
            });
          }}
          isSaving={isSettingArrangement}
        />
      )}
    </div>
  );
}

function SongListArrangementDialog({
  song,
  currentArrangementId,
  open,
  onOpenChange,
  onSelect,
  isSaving,
}: {
  song: PopulatedSongListItem;
  currentArrangementId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (arrangementId: string | null) => Promise<void>;
  isSaving: boolean;
}) {
  const { arrangements, isLoading } = useSongArrangements(song.slug, open);
  const [pendingSelection, setPendingSelection] = useState<
    string | null | undefined
  >(undefined);

  const handleSelect = async (arrangementId: string | null) => {
    if (isSaving) return;
    setPendingSelection(arrangementId);
    try {
      await onSelect(arrangementId);
    } finally {
      setPendingSelection(undefined);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        if (!isSaving) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="size-5 text-primary" />
            Структура пісні в списку
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Пісня:{" "}
            <span className="font-semibold text-foreground">{song.title}</span>
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Завантаження структур...
          </div>
        ) : (
          <div className="space-y-2.5 py-2 max-h-72 overflow-y-auto">
            <button
              type="button"
              disabled={isSaving}
              aria-busy={isSaving && pendingSelection === null}
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full text-left p-3 rounded-lg border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                !currentArrangementId &&
                  "border-primary bg-primary/5 font-semibold",
              )}
            >
              <div>
                <p className="font-medium text-sm">Без структури</p>
                <p className="text-xs text-muted-foreground">
                  Повний текст пісні без виділення порядку
                </p>
              </div>
              {isSaving && pendingSelection === null ? (
                <ButtonSpinner />
              ) : !currentArrangementId ? (
                <Check className="size-4 text-primary" />
              ) : null}
            </button>

            {arrangements.map((arr) => {
              const isSelected = currentArrangementId === arr._id;
              const summary = arr.items
                .map((i) =>
                  i.repeat > 1 ? `${i.section} - ${i.repeat}р` : i.section,
                )
                .join(", ");

              return (
                <button
                  type="button"
                  key={arr._id}
                  disabled={isSaving}
                  aria-busy={isSaving && pendingSelection === arr._id}
                  onClick={() => handleSelect(arr._id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    isSelected && "border-primary bg-primary/5 font-semibold",
                  )}
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{arr.name}</p>
                    <p className="text-xs text-muted-foreground">{summary}</p>
                  </div>
                  {isSaving && pendingSelection === arr._id ? (
                    <ButtonSpinner />
                  ) : isSelected ? (
                    <Check className="size-4 text-primary" />
                  ) : null}
                </button>
              );
            })}

            {arrangements.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2 italic">
                Для цієї пісні ще немає збережених структур. Ви можете створити
                структуру на сторінці пісні.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
