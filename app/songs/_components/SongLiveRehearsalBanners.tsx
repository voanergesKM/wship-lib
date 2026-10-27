import Link from "next/link";
import { LogOut, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SongLiveRehearsalBannersProps {
  isEndingSession?: boolean;
  asConductorSessionId: string | null;
  conductorSessionId: string | null;
  conductorDisconnected?: boolean;
  groupId: string | null;
  isFollowerEnded: boolean;
  isLiveFollower: boolean;
  listId: string | null;
  slug: string;
  onEndConductorSession: () => void;
}

export function SongLiveRehearsalBanners({
  isEndingSession = false,
  asConductorSessionId,
  conductorSessionId,
  conductorDisconnected,
  groupId,
  isFollowerEnded,
  isLiveFollower,
  listId,
  slug,
  onEndConductorSession,
}: SongLiveRehearsalBannersProps) {
  const playlistHref = `/groups/${groupId}/lists/${listId}`;

  return (
    <>
      {asConductorSessionId ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3.5 text-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Radio className="size-5 shrink-0 animate-pulse text-primary" />
            <div>
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <span>🎼 Ви диригуєте живою репетицією</span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                  Live
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Зміна секцій та пісень автоматично транслюється учасникам групи.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={onEndConductorSession}
            isLoading={isEndingSession}
            className="shrink-0"
          >
            Завершити репетицію
          </Button>
        </div>
      ) : null}

      {isLiveFollower ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-green-500/40 bg-green-500/10 p-3.5 text-sm animate-in fade-in duration-200 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Radio className="size-5 shrink-0 animate-pulse text-green-600 dark:text-green-400" />
            <div>
              <p className="flex items-center gap-2 font-semibold text-green-950 dark:text-green-200">
                <span>👥 Режим репетиції (слідування за диригентом)</span>
                <span className="rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-medium text-white">
                  Live
                </span>
              </p>
              <p className="mt-0.5 text-xs text-green-800/80 dark:text-green-300/80">
                {conductorDisconnected
                  ? "⚠️ Диригент тимчасово від'єднався. Очікуємо відновлення..."
                  : "Секції та пісні перемикаються диригентом автоматично."}
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 border-green-600/30 text-green-700 hover:bg-green-500/20 dark:text-green-300"
          >
            <Link href={playlistHref}>
              <LogOut className="mr-1 size-3.5" />
              Вийти
            </Link>
          </Button>
        </div>
      ) : null}

      {conductorSessionId && isFollowerEnded ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-muted-foreground/20 bg-muted/40 p-3.5 text-sm animate-in fade-in duration-200 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Radio className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <span>🎼 Репетицію завершено</span>
                <span className="rounded-full border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Завершено
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Диригент закрив сесію. Ви можете продовжити роботу в звичайному
                режимі.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/songs/${slug}?list=${listId}&group=${groupId}`}>
                Звичайний режим
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href={playlistHref}>
                <LogOut className="mr-1 size-3.5" />
                До списку
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
