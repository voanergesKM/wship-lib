"use client";

import { useState } from "react";
import { PageLoader } from "@/components/shared/PageLoader";

import { useSongsList } from "@/hooks/useSongsList";
import { SongDocument } from "@/models/Song";
import { SongItem } from "./SongItem";
import { SongsPagination } from "./SongsPagination";
import { AddToPlaylistDialog } from "../shared/AddToPlaylistDialog";
import { SongsSearchEmptyState } from "./SongsSearchEmptyState";

export const SongsList = () => {
  const { data, page, search, isLoadingSongs } = useSongsList();

  // Single shared dialog instance — avoids mounting one dialog per song card.
  const [activeSong, setActiveSong] = useState<SongDocument | null>(null);

  if (isLoadingSongs) return <PageLoader />;

  if (!data?.data || data.data.length === 0) {
    return <SongsSearchEmptyState searchQuery={search} />;
  }

  const totalPages = data?.pagination?.pages || 1;

  return (
    <>
      <div className="space-y-6 w-full">
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.data.map((song) => (
            <li key={song._id.toString()}>
              <SongItem song={song} onAddToPlaylist={setActiveSong} />
            </li>
          ))}
        </ul>

        <SongsPagination currentPage={page} totalPages={totalPages} />
      </div>

      {/* Shared dialog — mounted once, opened for the active song */}
      {activeSong && (
        <AddToPlaylistDialog
          songId={activeSong._id.toString()}
          songTitle={activeSong.title}
          open={!!activeSong}
          onOpenChange={(open) => !open && setActiveSong(null)}
        />
      )}
    </>
  );
};
