import { Suspense } from "react";
import { SongsList } from "./components/HomePage/SongsList";
import { songsListOptions } from "./lib/queries/songQueries";
import { getQueryClient } from "./lib/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SearchSong } from "./components/HomePage/SearchSong";
import { PageLoader } from "./components/shared/PageLoader";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search: string; page: string; limit: string }>;
}) {
  const queryClient = getQueryClient();

  const { search, page, limit } = await searchParams;

  await queryClient.prefetchQuery(
    songsListOptions({
      page: +page || 1,
      limit: +limit || 10,
      search: search || "",
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col w-full items-center gap-6">
        <SearchSong />

        <Suspense fallback={<PageLoader />}>
          <SongsList />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}
