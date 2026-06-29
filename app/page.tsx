import { SongsList } from "./components/HomePage/SongsList";
import { getQueryClient } from "./lib/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SearchSong } from "./components/HomePage/SearchSong";

export default async function Home() {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col w-full items-center gap-6">
        <SearchSong />

        <SongsList />
      </div>
    </HydrationBoundary>
  );
}
