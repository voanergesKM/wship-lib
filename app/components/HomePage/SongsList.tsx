"use client";

import { useSongsList } from "@/hooks/useSongsList";
import { useAuth } from "../providers/AuthContext";
import { SongItem } from "./SongItem";

export const SongsList = () => {
  const { data, isLoadingSongs } = useSongsList();

  if (isLoadingSongs) {
    return <div>Loading...</div>;
  }

  // if (error) {
  //   return <div>Error: {error.message}</div>;
  // }

  if (!data?.data || data.data.length === 0) {
    return <div>No songs found</div>;
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {data?.data.map((song) => (
        <li key={song._id.toString()}>
          <SongItem song={song} />
        </li>
      ))}
    </ul>
  );
};
