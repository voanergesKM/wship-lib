import type { Metadata, ResolvingMetadata } from "next";

export async function createShareMetadata(
  { title, description, url }: { title: string; description: string; url: string },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const images = (await parent).openGraph?.images || [];
  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
