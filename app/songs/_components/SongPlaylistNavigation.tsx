import Link from "next/link";
import { ChevronLeft, ChevronRight, ListMusic } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SongListDetails } from "@/services/groups.service";

interface SongPlaylistNavigationProps {
  asConductorSessionId: string | null;
  conductorSessionId: string | null;
  currentSongIndex: number;
  groupId: string | null;
  isLiveFollower: boolean;
  listId: string | null;
  playlist: SongListDetails;
  onConductorSongChange: (slug: string) => void;
}

export function SongPlaylistNavigation({
  asConductorSessionId,
  conductorSessionId,
  currentSongIndex,
  groupId,
  isLiveFollower,
  listId,
  playlist,
  onConductorSongChange,
}: SongPlaylistNavigationProps) {
  const previousSong = playlist.songs[currentSongIndex - 1];
  const nextSong = playlist.songs[currentSongIndex + 1];
  const playlistHref = `/groups/${groupId}/lists/${listId}`;
  const getSongHref = (songSlug: string) => {
    const sessionParam = asConductorSessionId
      ? `&asConductor=${asConductorSessionId}`
      : conductorSessionId
        ? `&conductor=${conductorSessionId}`
        : "";
    return `/songs/${songSlug}?list=${listId}&group=${groupId}${sessionParam}`;
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3 text-sm sm:flex-row">
      <div className="flex items-center gap-2">
        <ListMusic className="size-4 shrink-0 text-primary" />
        <span className="text-muted-foreground">Список:</span>
        <Link href={playlistHref} className="max-w-[200px] truncate font-bold hover:underline sm:max-w-md">{playlist.name}</Link>
        <span className="hidden text-muted-foreground sm:inline">|</span>
        <span className="shrink-0 font-medium">Пісня {currentSongIndex + 1} з {playlist.songs.length}</span>
        {isLiveFollower ? <span className="hidden items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400 sm:inline-flex">• Синхронізовано</span> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="outline" size="sm" className={previousSong ? "" : "pointer-events-none opacity-50"}>
          <Link href={previousSong ? getSongHref(previousSong.slug) : "#"} onClick={() => previousSong && asConductorSessionId && onConductorSongChange(previousSong.slug)}>
            <ChevronLeft className="mr-1 size-4" />Назад
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className={nextSong ? "" : "pointer-events-none opacity-50"}>
          <Link href={nextSong ? getSongHref(nextSong.slug) : "#"} onClick={() => nextSong && asConductorSessionId && onConductorSongChange(nextSong.slug)}>
            Вперед<ChevronRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
