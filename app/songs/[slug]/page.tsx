import { getQueryClient } from "@/lib/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SongPage } from "./SongPage";
import { getSongBySlug } from "@/lib/data/songs";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const song = await getSongBySlug(slug);

  if (!song) {
    return {
      title: "Пісня не знайдена",
    };
  }

  const authors = song.authors?.join(", ") || "";
  const tags = song.tags?.join(", ") || "";
  const description = `${song.title}${authors ? ` • ${authors}` : ""}${tags ? ` • ${tags}` : ""}`;

  return {
    title: song.title,
    description,
    openGraph: {
      title: song.title,
      description,
      type: "website",
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
