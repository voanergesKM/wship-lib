import { getQueryClient } from "@/lib/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SongPage } from "./SongPage";
import { getSongBySlug } from "@/lib/data/songs";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["song", slug],
    queryFn: async () => {
      const song = await getSongBySlug(slug);

      return JSON.parse(JSON.stringify(song));
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SongPage slug={slug} />
    </HydrationBoundary>
  );
}
