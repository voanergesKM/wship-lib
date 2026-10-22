"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit3,
  Eye,
  X,
  ListMusic,
  ListPlus,
  GitPullRequest,
  History,
  Sparkles,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

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
  SongVisibility,
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
import { useSongMutations } from "@/hooks/useSongMutations";
import { SongProposalDialog } from "../_components/SongProposalDialog";
import { SongProposalReviewDialog } from "../_components/SongProposalReviewDialog";
import { SongArrangementDialog } from "../_components/SongArrangementDialog";
import { SongStructurePlayer } from "../_components/SongStructurePlayer";
import { useConductorFollow } from "@/hooks/useConductorFollow";
import { useConductorSession } from "@/hooks/useConductorSession";
import { LoginDialog } from "@/components/shared/LoginDialog";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { SongPendingProposalBanner } from "../_components/SongPendingProposalBanner";
import { SongLiveRehearsalBanners } from "../_components/SongLiveRehearsalBanners";
import { SongPlaylistNavigation } from "../_components/SongPlaylistNavigation";

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
  const conductorSessionId = searchParams?.get("conductor") || null;
  const asConductorSessionId = searchParams?.get("asConductor") || null;

  // Follower mode
  const {
    conductorState,
    isSessionActive: isFollowerActive,
    isEnded: isFollowerEnded,
  } = useConductorFollow(conductorSessionId);

  // Conductor mode
  const {
    update: updateConductorSession,
    end: endConductorSession,
  } = useConductorSession({
    groupId: groupId || undefined,
    initialSessionId: asConductorSessionId,
  });

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

  const isLiveFollower = Boolean(conductorSessionId && !isFollowerEnded);
  const isLiveConductor = Boolean(asConductorSessionId);

  const effectiveActiveStepIndex =
    isLiveFollower &&
    isFollowerActive &&
    typeof conductorState?.stepIndex === "number"
      ? conductorState.stepIndex
      : activeStepIndex;

  const effectiveIsPlayingStructure =
    (isLiveFollower && isFollowerActive) ||
    (isLiveConductor && Boolean(currentArrangement)) ||
    isPlayingStructure;

  const activeSectionId =
    effectiveIsPlayingStructure && playbackSteps[effectiveActiveStepIndex]
      ? playbackSteps[effectiveActiveStepIndex].sectionId
      : null;

  // Follower: sync song redirect from conductor
  useEffect(() => {
    if (
      conductorSessionId &&
      isFollowerActive &&
      conductorState?.currentSongSlug &&
      conductorState.currentSongSlug !== slug
    ) {
      router.push(
        `/songs/${conductorState.currentSongSlug}?list=${listId}&group=${groupId}&conductor=${conductorSessionId}`,
      );
    }
  }, [
    conductorSessionId,
    conductorState?.currentSongSlug,
    slug,
    listId,
    groupId,
    isFollowerActive,
    router,
  ]);

  const handleStepChange = (newStep: number) => {
    setActiveStepIndex(newStep);
    if (asConductorSessionId) {
      updateConductorSession(slug, newStep);
    }
  };

  const handleEndConductorSession = async () => {
    if (confirm("Завершити живу репетицію для всієї групи?")) {
      await endConductorSession();
      await queryClient.invalidateQueries({ queryKey: ["conductorSession"] });
      toast.info("🎼 Репетицію завершено");
      router.push(`/groups/${groupId}/lists/${listId}`);
    }
  };

  const isReviewDialogOpen =
    isReviewOpenOverride !== null
      ? isReviewOpenOverride
      : Boolean(proposalParam && (canEdit || isOwnerOrAdmin));
  const setIsReviewDialogOpen = (open: boolean) =>
    setIsReviewOpenOverride(open);

  const { updateSong, deleteSong, isDeletingSong } = useSongMutations({
    slug,
    onUpdateSuccess: (updatedSlug) => {
      if (updatedSlug !== slug) {
        router.replace(`/songs/${updatedSlug}`);
      }
      setMode("view");
      setError(null);
    },
    onDeleteSuccess: () => {
      router.replace("/");
      router.refresh();
    },
    onError: setError,
  });

  const handleDeleteSong = async () => {
    try {
      await deleteSong();
    } catch {
      // Error is displayed by the mutation hook.
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
      <SongLiveRehearsalBanners
        asConductorSessionId={asConductorSessionId}
        conductorSessionId={conductorSessionId}
        conductorDisconnected={conductorState?.isDisconnected}
        groupId={groupId}
        isFollowerEnded={isFollowerEnded}
        isLiveFollower={isLiveFollower}
        listId={listId}
        slug={slug}
        onEndConductorSession={handleEndConductorSession}
      />

      {hasPlaylistNav && playlist ? (
        <SongPlaylistNavigation
          asConductorSessionId={asConductorSessionId}
          conductorSessionId={conductorSessionId}
          currentSongIndex={currentSongIndex}
          groupId={groupId}
          isLiveFollower={isLiveFollower}
          listId={listId}
          playlist={playlist}
          onConductorSongChange={(songSlug) => updateConductorSession(songSlug, 0)}
        />
      ) : null}

      <SongPageHeader
        title={data.title}
        mode={mode}
        creatorDisplayName={creatorDisplayName}
      >
        {mode === "view" ? (
          <>
            {isAuthenticated && (
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(true)}>
                <ListPlus className="size-4" />
                Додати до списку
              </Button>
            )}

            {hasSections && (
              <SongArrangementControls
                arrangements={arrangements}
                currentArrangement={currentArrangement}
                isPlayingStructure={isPlayingStructure}
                canManageCurrentArrangement={canManageArrangement(currentArrangement)}
                onTogglePlayback={() => {
                  setIsPlayingStructure((prev) => !prev);
                  setActiveStepIndex(0);
                }}
                onSelectArrangement={(id) => {
                  setSelectedArrangementId(id);
                  setActiveStepIndex(0);
                }}
                onEditArrangement={(arrangement) => {
                  setArrangementToEdit(arrangement);
                  setIsArrangementDialogOpen(true);
                }}
                onDeleteArrangement={(arrangement) => {
                  setArrangementToDelete(arrangement);
                  setIsDeleteArrangementDialogOpen(true);
                }}
              />
            )}

            {canEdit && (
              <>
                <SongProposalReviewButton
                  pendingProposalCount={pendingProposals.length}
                  proposalCount={proposals.length}
                  onReviewProposals={() => setIsReviewDialogOpen(true)}
                />
                <Button type="button" onClick={() => setMode("edit")}>
                  <Edit3 className="size-4 mr-1" />
                  Редагувати
                </Button>
              </>
            )}

            {isAdmin && (
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

            {!canEdit && !myPendingProposal && (
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
          </>
        ) : canEdit ? (
          <Button type="button" variant="outline" onClick={() => setMode("view")}>
            <X className="size-4 mr-1" />
            Скасувати
          </Button>
        ) : null}
      </SongPageHeader>

      {/* Banner if user has an active pending proposal */}
      {mode === "view" && !canEdit && myPendingProposal && (
        <SongPendingProposalBanner
          onEdit={() => setIsProposalDialogOpen(true)}
          onCancel={handleCancelProposal}
        />
      )}

      {/* Interactive Structure Playback bar */}
      {effectiveIsPlayingStructure && currentArrangement && (
        <SongStructurePlayer
          arrangement={currentArrangement}
          activeStepIndex={effectiveActiveStepIndex}
          onStepChange={handleStepChange}
          onClose={() => setIsPlayingStructure(false)}
          canManage={!isLiveFollower && canManageArrangement(currentArrangement)}
          readOnly={isLiveFollower}
          isLive={isLiveFollower || isLiveConductor}
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
        <DeleteConfirmationDialog
          open={isDeleteArrangementDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteArrangementDialogOpen(open);
            if (!open) setArrangementToDelete(null);
          }}
          title="Видалити структуру"
          isDeleting={isDeletingArrangement}
          onConfirm={handleConfirmDeleteArrangement}
        >
          <span>
            Ви впевнені, що хочете видалити структуру &laquo;
            {arrangementToDelete.name}&raquo;?
          </span>
          <span className="block text-xs text-muted-foreground">
            Цю дію неможливо буде скасувати. Структуру також буде вилучено з усіх списків пісень, де її було призначено.
          </span>
        </DeleteConfirmationDialog>
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
        <LoginDialog
          open={isLoginDialogOpen}
          onOpenChange={setIsLoginDialogOpen}
          description="Увійдіть через Telegram, щоб запропонувати зміни до цієї пісні."
          onAuth={async () => {
            setIsLoginDialogOpen(false);
            await refreshUser();
            setIsProposalDialogOpen(true);
          }}
        />
      )}

      {isDeleteDialogOpen && (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Видалити пісню"
          isDeleting={isDeletingSong}
          onConfirm={handleDeleteSong}
        >
          <span>
            Ви впевнені, що хочете видалити пісню <strong>«{data.title}»</strong>?
          </span>
          <span className="block text-xs text-muted-foreground">
            Ця дія є незворотною. Пісню буде видалено з бібліотеки, а також автоматично вилучено з усіх списків відтворень разом із пов&apos;язаними структурами та історією пропозицій.
          </span>
        </DeleteConfirmationDialog>
      )}
    </div>
  );
}

interface SongPageHeaderProps {
  title: string;
  mode: "view" | "edit";
  creatorDisplayName?: string;
  children: ReactNode;
}

function SongPageHeader({
  title,
  mode,
  creatorDisplayName,
  children,
}: SongPageHeaderProps) {
  return (
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
        <h1 className="text-3xl font-bold tracking-normal">{title}</h1>
        {creatorDisplayName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <span>Додав(ла):</span>
            <span className="font-medium text-foreground">
              {creatorDisplayName}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center flex-wrap">{children}</div>
    </div>
  );
}

interface SongArrangementControlsProps {
  arrangements: SongArrangement[];
  currentArrangement: SongArrangement | null;
  isPlayingStructure: boolean;
  canManageCurrentArrangement: boolean;
  onTogglePlayback: () => void;
  onSelectArrangement: (id: string) => void;
  onEditArrangement: (arrangement: SongArrangement | null) => void;
  onDeleteArrangement: (arrangement: SongArrangement) => void;
}

function SongArrangementControls({
  arrangements,
  currentArrangement,
  isPlayingStructure,
  canManageCurrentArrangement,
  onTogglePlayback,
  onSelectArrangement,
  onEditArrangement,
  onDeleteArrangement,
}: SongArrangementControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentArrangement ? (
        <>
          <Button
            type="button"
            variant={isPlayingStructure ? "default" : "outline"}
            onClick={onTogglePlayback}
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
              onValueChange={onSelectArrangement}
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

          {canManageCurrentArrangement && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onEditArrangement(currentArrangement)}
                title={`Редагувати структуру "${currentArrangement.name}"`}
                aria-label="Редагувати структуру"
              >
                <Edit3 className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onDeleteArrangement(currentArrangement)}
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
        onClick={() => onEditArrangement(null)}
        title="Створити нову структуру пісні"
      >
        <ListMusic className="size-4 mr-1 text-primary" />
        {arrangements.length > 0 ? "+ Структура" : "Створити структуру"}
      </Button>
    </div>
  );
}

interface SongProposalReviewButtonProps {
  pendingProposalCount: number;
  proposalCount: number;
  onReviewProposals: () => void;
}

function SongProposalReviewButton({
  pendingProposalCount,
  proposalCount,
  onReviewProposals,
}: SongProposalReviewButtonProps) {
  return (
    <>
      {pendingProposalCount > 0 && (
        <Button
          type="button"
          variant="outline"
          className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 font-semibold"
          onClick={onReviewProposals}
        >
          <Sparkles className="size-4 mr-1 text-amber-500" />
          Запропоновані зміни ({pendingProposalCount})
        </Button>
      )}

      {proposalCount > 0 && pendingProposalCount === 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReviewProposals}
        >
          <History className="size-4 mr-1" />
          Історія змін ({proposalCount})
        </Button>
      )}

    </>
  );
}
