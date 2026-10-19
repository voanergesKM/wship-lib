"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit3,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  ListPlus,
  GitPullRequest,
  History,
  Clock,
  Sparkles,
  Play,
  Pause,
  Trash2,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/shared/PageLoader";
import { songOptions } from "@/lib/queries/songQueries";
import {
  CreateArrangementPayload,
  ProposalPayload,
  SongArrangement,
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
import { useSongProposals } from "@/hooks/useSongProposals";
import { useSongArrangements } from "@/hooks/useSongArrangements";
import { SongProposalDialog } from "../_components/SongProposalDialog";
import { SongProposalReviewDialog } from "../_components/SongProposalReviewDialog";
import { SongArrangementDialog } from "../_components/SongArrangementDialog";
import { SongStructurePlayer } from "../_components/SongStructurePlayer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TelegramDesktopLogin } from "@/components/ui/telegram-desktop-login";

export function SongPage({ slug }: { slug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useQuery(songOptions({ slug }));

  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isReviewOpenOverride, setIsReviewOpenOverride] = useState<
    boolean | null
  >(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isArrangementDialogOpen, setIsArrangementDialogOpen] = useState(false);
  const [arrangementToEdit, setArrangementToEdit] =
    useState<SongArrangement | null>(null);
  const [arrangementToDelete, setArrangementToDelete] =
    useState<SongArrangement | null>(null);
  const [isDeleteArrangementDialogOpen, setIsDeleteArrangementDialogOpen] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // Playback structure states
  const [selectedArrangementId, setSelectedArrangementId] = useState<
    string | null
  >(null);
  const [isPlayingStructure, setIsPlayingStructure] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const searchParams = useSearchParams();
  const listId = searchParams?.get("list") || null;
  const groupId = searchParams?.get("group") || null;
  const proposalParam = searchParams?.get("proposal") || null;

  const {
    proposals,
    isOwnerOrAdmin,
    createProposal,
    updateProposal,
    cancelProposal,
    reviewProposal,
    isReviewing,
  } = useSongProposals(slug, Boolean(slug));

  const {
    arrangements,
    createArrangement,
    isCreating: isCreatingArrangement,
    updateArrangement,
    isUpdating: isUpdatingArrangement,
    deleteArrangement,
    isDeleting: isDeletingArrangement,
  } = useSongArrangements(slug, Boolean(slug));

  const { data: playlist } = useQuery({
    queryKey: ["songList", groupId, listId],
    queryFn: () => groupsService.getSongListDetails(groupId!, listId!),
    enabled: !!listId && !!groupId,
  });

  const currentSongIndex = playlist?.songs
    ? playlist.songs.findIndex((s: { slug: string }) => s.slug === slug)
    : -1;

  const hasPlaylistNav =
    playlist && currentSongIndex !== undefined && currentSongIndex !== -1;

  const creatorId = useMemo(() => {
    if (!data?.createdBy) return null;
    if (typeof data.createdBy === "object" && data.createdBy !== null) {
      const c = data.createdBy as unknown as {
        _id?: { toString(): string } | string;
        id?: { toString(): string } | string;
      };
      return (c._id || c.id)?.toString() || null;
    }
    return (data.createdBy as { toString(): string }).toString();
  }, [data]);

  const canEdit = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return Boolean(creatorId && user.id && creatorId === user.id);
  }, [user, creatorId]);

  const creatorDisplayName = useMemo(() => {
    if (!data?.createdBy) return undefined;
    if (typeof data.createdBy === "object" && data.createdBy !== null) {
      const u = data.createdBy as unknown as {
        firstName?: string;
        lastName?: string;
        username?: string;
      };
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
      if (fullName) return fullName;
      if (u.username) return `@${u.username}`;
    }
    return "Користувач";
  }, [data]);

  // Find user's active pending proposal
  const myPendingProposal = useMemo(() => {
    if (!user?.id) return null;
    return (
      proposals.find((p) => {
        const pUserId =
          typeof p.user === "object" && p.user !== null
            ? p.user._id
            : (p.user as unknown as string);
        return p.status === "pending" && pUserId === user.id;
      }) || null
    );
  }, [proposals, user]);

  const pendingProposals = useMemo(
    () => proposals.filter((p) => p.status === "pending"),
    [proposals],
  );

  const hasSections = useMemo(
    () => Boolean(data?.document && /<section\s+(?:id|name)=/i.test(data.document)),
    [data],
  );

  // Arrangement assigned to this song in current playlist (if opened from playlist)
  const playlistArrangement = useMemo(() => {
    if (!playlist?.songArrangements || !data?._id) return null;
    const item = playlist.songArrangements.find(
      (sa) =>
        (typeof sa.song === "object" ? sa.song._id : sa.song) ===
        data._id.toString(),
    );
    return item?.arrangement || null;
  }, [playlist, data]);

  // Current active arrangement
  const currentArrangement = useMemo(() => {
    if (selectedArrangementId) {
      return (
        arrangements.find((a) => a._id === selectedArrangementId) || null
      );
    }
    if (playlistArrangement) return playlistArrangement;
    return arrangements[0] || null;
  }, [selectedArrangementId, arrangements, playlistArrangement]);

  // Expand steps for current arrangement
  const playbackSteps = useMemo(() => {
    if (!currentArrangement) return [];
    const list: Array<{ sectionId: string; label: string }> = [];
    for (const item of currentArrangement.items) {
      const repeat = item.repeat || 1;
      for (let r = 1; r <= repeat; r++) {
        list.push({
          sectionId: item.section,
          label:
            repeat > 1 ? `${item.section} (${r}/${repeat})` : item.section,
        });
      }
    }
    return list;
  }, [currentArrangement]);

  const activeSectionId =
    isPlayingStructure && playbackSteps[activeStepIndex]
      ? playbackSteps[activeStepIndex].sectionId
      : null;

  const isReviewDialogOpen =
    isReviewOpenOverride !== null
      ? isReviewOpenOverride
      : Boolean(proposalParam && (canEdit || isOwnerOrAdmin));
  const setIsReviewDialogOpen = (open: boolean) =>
    setIsReviewOpenOverride(open);

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

  const { mutateAsync: deleteSongMutation, isPending: isDeletingSong } =
    useMutation({
      mutationFn: () => songsService.deleteSong(slug),
      onSuccess: async () => {
        // Immediately remove deleted song from any cached songsList queries
        queryClient.setQueriesData<{
          data: { slug: string }[];
          pagination: { total: number; [key: string]: any };
        }>({ queryKey: ["songsList"] }, (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((s) => s.slug !== slug),
            pagination: {
              ...old.pagination,
              total: Math.max(0, (old.pagination?.total || 1) - 1),
            },
          };
        });

        await queryClient.invalidateQueries({ queryKey: ["songsList"] });
        queryClient.removeQueries({ queryKey: ["song", slug] });
        await queryClient.invalidateQueries({ queryKey: ["songList"] });
        await queryClient.invalidateQueries({ queryKey: ["groupLists"] });

        router.replace("/");
        router.refresh();
      },
      onError: (err) => {
        setError(
          err instanceof Error ? err.message : "Не вдалося видалити пісню",
        );
      },
    });

  const handleDeleteSong = async () => {
    try {
      await deleteSongMutation();
    } catch {
      // Error handled in onError
    }
  };

  const handleProposalSubmit = async (payload: ProposalPayload) => {
    if (myPendingProposal) {
      await updateProposal({
        proposalId: myPendingProposal._id,
        data: payload,
      });
    } else {
      await createProposal(payload);
    }
  };

  const handleCancelProposal = async () => {
    if (!myPendingProposal) return;
    if (window.confirm("Ви дійсно бажаєте скасувати свою пропозицію змін?")) {
      await cancelProposal(myPendingProposal._id);
    }
  };

  const canManageArrangement = (arr: SongArrangement | null) => {
    if (!user || !arr) return false;
    if (user.role === "admin") return true;
    const createdById =
      typeof arr.createdBy === "object" && arr.createdBy !== null
        ? (arr.createdBy as { _id?: string })._id
        : (arr.createdBy as unknown as string);
    return Boolean(createdById && createdById.toString() === user.id);
  };

  const handleSaveArrangement = async (payload: CreateArrangementPayload) => {
    if (arrangementToEdit) {
      const updated = await updateArrangement({
        arrangementId: arrangementToEdit._id,
        payload,
      });
      setSelectedArrangementId(updated._id);
      setActiveStepIndex(0);
      setArrangementToEdit(null);
    } else {
      const created = await createArrangement(payload);
      setSelectedArrangementId(created._id);
      setIsPlayingStructure(true);
      setActiveStepIndex(0);
    }
  };

  const handleConfirmDeleteArrangement = async () => {
    if (!arrangementToDelete) return;
    try {
      await deleteArrangement(arrangementToDelete._id);
      if (selectedArrangementId === arrangementToDelete._id) {
        setSelectedArrangementId(null);
      }
      if (currentArrangement?._id === arrangementToDelete._id) {
        setIsPlayingStructure(false);
        setActiveStepIndex(0);
      }
      setIsDeleteArrangementDialogOpen(false);
      setArrangementToDelete(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не вдалося видалити структуру",
      );
    }
  };

  if (isLoading) return <PageLoader />;

  if (!data) return <div>Song not found</div>;

  const youtube = normalizeYouTubeLinks(data.youtube);
  const visibility = (data.visibility ?? "public") as SongVisibility;

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
              className={
                currentSongIndex === 0 ? "pointer-events-none opacity-50" : ""
              }
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

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
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
          {creatorDisplayName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <span>Додав(ла):</span>
              <span className="font-medium text-foreground">
                {creatorDisplayName}
              </span>
            </div>
          )}
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

          {/* Structure buttons (Arrangements) */}
          {mode === "view" && hasSections && (
            <div className="flex flex-wrap items-center gap-2">
              {currentArrangement ? (
                <>
                  <Button
                    type="button"
                    variant={isPlayingStructure ? "default" : "outline"}
                    onClick={() => {
                      setIsPlayingStructure((prev) => !prev);
                      setActiveStepIndex(0);
                    }}
                    title={
                      isPlayingStructure
                        ? "Зупинити програвання структури"
                        : "Запустити програвання по структурі зі скролом"
                    }
                    className="gap-1.5"
                  >
                    {isPlayingStructure ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4 fill-current" />
                    )}
                    <span>Структура: {currentArrangement.name}</span>
                  </Button>

                  {arrangements.length > 1 && (
                    <Select
                      value={currentArrangement._id}
                      onValueChange={(val) => {
                        setSelectedArrangementId(val);
                        setActiveStepIndex(0);
                      }}
                    >
                      <SelectTrigger
                        className="h-9 min-w-[130px] max-w-[200px] text-xs"
                        title="Змінити вибрану структуру"
                      >
                        <SelectValue placeholder="Виберіть структуру" />
                      </SelectTrigger>
                      <SelectContent>
                        {arrangements.map((arr) => (
                          <SelectItem key={arr._id} value={arr._id}>
                            {arr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {canManageArrangement(currentArrangement) && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setArrangementToEdit(currentArrangement);
                          setIsArrangementDialogOpen(true);
                        }}
                        title={`Редагувати структуру "${currentArrangement.name}"`}
                        aria-label="Редагувати структуру"
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setArrangementToDelete(currentArrangement);
                          setIsDeleteArrangementDialogOpen(true);
                        }}
                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                        title={`Видалити структуру "${currentArrangement.name}"`}
                        aria-label="Видалити структуру"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setArrangementToEdit(null);
                  setIsArrangementDialogOpen(true);
                }}
                title="Створити нову структуру пісні"
              >
                <ListMusic className="size-4 mr-1 text-primary" />
                {arrangements.length > 0 ? "+ Структура" : "Створити структуру"}
              </Button>
            </div>
          )}

          {/* Author/Admin controls */}
          {mode === "view" && canEdit && (
            <>
              {pendingProposals.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 font-semibold"
                  onClick={() => setIsReviewDialogOpen(true)}
                >
                  <Sparkles className="size-4 mr-1 text-amber-500" />
                  Запропоновані зміни ({pendingProposals.length})
                </Button>
              )}

              {proposals.length > 0 && pendingProposals.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewDialogOpen(true)}
                >
                  <History className="size-4 mr-1" />
                  Історія змін ({proposals.length})
                </Button>
              )}

              <Button type="button" onClick={() => setMode("edit")}>
                <Edit3 className="size-4 mr-1" />
                Редагувати
              </Button>
            </>
          )}

          {/* Admin delete button */}
          {mode === "view" && isAdmin && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              title="Видалити пісню"
            >
              <Trash2 className="size-4 mr-1" />
              Видалити
            </Button>
          )}

          {/* Regular user or Guest controls */}
          {mode === "view" && !canEdit && !myPendingProposal && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isAuthenticated) {
                  setIsProposalDialogOpen(true);
                } else {
                  setIsLoginDialogOpen(true);
                }
              }}
            >
              <GitPullRequest className="size-4 mr-1 text-primary" />
              Запропонувати зміни
            </Button>
          )}

          {mode === "edit" && canEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("view")}
            >
              <X className="size-4 mr-1" />
              Скасувати
            </Button>
          )}
        </div>
      </div>

      {/* Banner if user has an active pending proposal */}
      {mode === "view" && !canEdit && myPendingProposal && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-start gap-3">
            <Clock className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Ваша пропозиція змін очікує на розгляд автора
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Ви можете переглянути або оновити запропоновані правки, або
                скасувати пропозицію.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="bg-background"
              onClick={() => setIsProposalDialogOpen(true)}
            >
              <Edit3 className="size-3.5 mr-1" />
              Редагувати
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleCancelProposal}
            >
              <X className="size-3.5 mr-1" />
              Скасувати
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Structure Playback bar */}
      {isPlayingStructure && currentArrangement && (
        <SongStructurePlayer
          arrangement={currentArrangement}
          activeStepIndex={activeStepIndex}
          onStepChange={setActiveStepIndex}
          onClose={() => setIsPlayingStructure(false)}
          canManage={canManageArrangement(currentArrangement)}
          onEdit={() => {
            setArrangementToEdit(currentArrangement);
            setIsArrangementDialogOpen(true);
          }}
          onDelete={() => {
            setArrangementToDelete(currentArrangement);
            setIsDeleteArrangementDialogOpen(true);
          }}
        />
      )}

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
          creatorDisplayName={creatorDisplayName}
          activeSectionId={activeSectionId}
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

      {/* Dialogs */}
      {isAddOpen && (
        <AddToPlaylistDialog
          songId={data._id.toString()}
          songTitle={data.title}
          songSlug={slug}
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
      )}

      {isArrangementDialogOpen && (
        <SongArrangementDialog
          open={isArrangementDialogOpen}
          onOpenChange={(open) => {
            setIsArrangementDialogOpen(open);
            if (!open) setArrangementToEdit(null);
          }}
          document={data.document}
          arrangement={arrangementToEdit}
          onSave={handleSaveArrangement}
          isSaving={isCreatingArrangement || isUpdatingArrangement}
        />
      )}

      {isDeleteArrangementDialogOpen && arrangementToDelete && (
        <Dialog
          open={isDeleteArrangementDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteArrangementDialogOpen(open);
            if (!open) setArrangementToDelete(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="size-5" />
                Видалити структуру
              </DialogTitle>
              <DialogDescription className="space-y-2 pt-2 text-left">
                <span>
                  Ви впевнені, що хочете видалити структуру &laquo;
                  {arrangementToDelete.name}&raquo;?
                </span>
                <span className="block text-xs text-muted-foreground">
                  Цю дію неможливо буде скасувати. Структуру також буде вилучено з усіх списків пісень, де її було призначено.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteArrangementDialogOpen(false);
                  setArrangementToDelete(null);
                }}
                disabled={isDeletingArrangement}
              >
                Скасувати
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDeleteArrangement}
                disabled={isDeletingArrangement}
              >
                {isDeletingArrangement ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Видалення...
                  </>
                ) : (
                  "Видалити"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isProposalDialogOpen && (
        <SongProposalDialog
          open={isProposalDialogOpen}
          onOpenChange={setIsProposalDialogOpen}
          song={{
            title: data.title,
            tags: data.tags ?? undefined,
            authors: data.authors ?? undefined,
            key: data.key ?? undefined,
            bpm: data.bpm ?? undefined,
            document: data.document,
            youtube,
            visibility,
          }}
          proposal={myPendingProposal}
          onSubmit={handleProposalSubmit}
        />
      )}

      {isReviewDialogOpen && (canEdit || isOwnerOrAdmin) && (
        <SongProposalReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          song={{
            _id: data._id.toString(),
            title: data.title,
            tags: data.tags ?? undefined,
            authors: data.authors ?? undefined,
            key: data.key ?? undefined,
            bpm: data.bpm ?? undefined,
            document: data.document,
            youtube,
            visibility,
          }}
          proposals={proposals}
          initialSelectedId={proposalParam}
          onReview={async (proposalId, action, comment) => {
            await reviewProposal({ proposalId, action, comment });
          }}
          isReviewing={isReviewing}
        />
      )}

      {isLoginDialogOpen && (
        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Авторизація</DialogTitle>
              <DialogDescription className="text-center">
                Увійдіть через Telegram, щоб запропонувати зміни до цієї пісні.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-4">
              <TelegramDesktopLogin
                botName={
                  process.env.NEXT_PUBLIC_BOT_USERNAME || "voanergesKM_bot"
                }
                onAuth={async () => {
                  setIsLoginDialogOpen(false);
                  await refreshUser();
                  setIsProposalDialogOpen(true);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isDeleteDialogOpen && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="size-5" />
                Видалити пісню
              </DialogTitle>
              <DialogDescription className="space-y-2 pt-2 text-left">
                <span>
                  Ви впевнені, що хочете видалити пісню <strong>«{data.title}»</strong>?
                </span>
                <span className="block text-xs text-muted-foreground">
                  Ця дія є незворотною. Пісню буде видалено з бібліотеки, а також автоматично вилучено з усіх списків відтворень разом із пов&apos;язаними структурами та історією пропозицій.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeletingSong}
              >
                Скасувати
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteSong}
                disabled={isDeletingSong}
              >
                {isDeletingSong ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Видалення...
                  </>
                ) : (
                  "Видалити"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
