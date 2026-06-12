import { getQueryClient } from "@/lib/queryClient";
import { songOptions } from "@/lib/queries/songQueries";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { PageLoader } from "@/components/shared/PageLoader";
import { SongPage } from "./SongPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const queryClient = getQueryClient();

  // await queryClient.prefetchQuery(songOptions({ slug: slug }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<PageLoader />}>
        <SongPage slug={slug} />
      </Suspense>
    </HydrationBoundary>
  );
}
