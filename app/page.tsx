import { Suspense } from "react";
import { SongsList } from "./components/HomePage/SongsList";
import { songsListOptions } from "./lib/queries/songQueries";
import { getQueryClient } from "./lib/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SearchSong } from "./components/HomePage/SearchSong";

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
      <div className="flex justify-between gap-2 items-center mb-4">
        <SearchSong />
      </div>

      <h1 className="text-3xl font-bold mb-4">Каталог ресурсів</h1>

      <Suspense fallback={<div>Завантаження...</div>}>
        <SongsList />
      </Suspense>
    </HydrationBoundary>
  );
}
