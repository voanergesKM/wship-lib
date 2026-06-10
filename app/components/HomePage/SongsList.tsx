"use client";

import { useSongsList } from "@/hooks/useSongsList";
import { useAuth } from "../providers/AuthContext";

export const SongsList = () => {
  const { user } = useAuth();

  const { data, isLoadingSongs, songsError } = useSongsList();

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
    <div>
      <h2>LibrarySearch</h2>
      {data?.data.map((song) => (
        <div key={song._id.toString()}>{song.title}</div>
      ))}
      {user?.username}
    </div>
  );
};
