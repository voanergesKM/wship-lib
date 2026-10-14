import { SongsList } from "./components/HomePage/SongsList";
import { getQueryClient } from "./lib/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SearchSong } from "./components/HomePage/SearchSong";
import { songsListOptions } from "./lib/queries/songQueries";

const DEFAULT_PAGE_SIZE = 18;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; search?: string }>;
}) {
  const { page: pageStr, limit: limitStr, search = "" } = await searchParams;
  const page = Number(pageStr) || 1;
  const limit = Number(limitStr) || DEFAULT_PAGE_SIZE;

  const queryClient = getQueryClient();

  // Prefetch the songs list on the server so that SongsList renders
  // immediately on the client without a loading spinner (no SSR waterfall).
  await queryClient.prefetchQuery(songsListOptions({ page, limit, search }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col w-full items-center gap-6">
        <SearchSong />

        <SongsList />
      </div>
    </HydrationBoundary>
  );
}
