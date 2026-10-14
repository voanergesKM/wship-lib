import { SongsList } from "./components/HomePage/SongsList";
import { getQueryClient } from "./lib/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SearchSong } from "./components/HomePage/SearchSong";
import { getCachedSongsList } from "./lib/data/songs";

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

  // Prefetch directly from MongoDB on the server.
  // This completely eliminates the internal HTTP roundtrip (self-fetch to localhost:3000)
  // that was causing 14+ seconds timeouts and cascading loading spinners on Vercel.
  // The queryKey matches useSongsList() exactly, so TanStack Query hydrates synchronously.
  await queryClient.prefetchQuery({
    queryKey: ["songsList", page, limit, search],
    queryFn: async () => {
      const data = await getCachedSongsList({ page, limit, search });
      return JSON.parse(JSON.stringify(data));
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col w-full items-center gap-6">
        <SearchSong />

        <SongsList />
      </div>
    </HydrationBoundary>
  );
}
