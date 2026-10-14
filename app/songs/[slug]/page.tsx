import { getQueryClient } from "@/lib/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SongPage } from "./SongPage";
import { getCachedSongBySlug } from "@/lib/data/songs";
import type { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const song = await getCachedSongBySlug(slug);

  if (!song) {
    return {
      title: "Пісня не знайдена",
    };
  }

  const authors = song.authors?.join(", ") || "";
  const tags = song.tags?.join(", ") || "";
  const description = `${song.title}${authors ? ` • ${authors}` : ""}${tags ? ` • ${tags}` : ""}`;

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: song.title,
    description,
    openGraph: {
      title: song.title,
      description,
      type: "website",
      images: previousImages,
    },
    twitter: {
      card: "summary_large_image",
      title: song.title,
      description,
      images: previousImages,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const queryClient = getQueryClient();

  // getCachedSongBySlug is memoized via React.cache() — this call is
  // deduplicated with the one in generateMetadata, so only one DB round-trip
  // happens per request.
  await queryClient.prefetchQuery({
    queryKey: ["song", slug],
    queryFn: async () => {
      const song = await getCachedSongBySlug(slug);
      return JSON.parse(JSON.stringify(song));
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SongPage slug={slug} />
    </HydrationBoundary>
  );
}
