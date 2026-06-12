import { YouTubeLink } from "@/utils/youtubeLinks";

export function SongMedia({ youtube }: { youtube: YouTubeLink[] }) {
  if (!youtube.length) {
    return (
      <section className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Медіа для цієї пісні ще не додано.
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {youtube.map((link, index) => (
        <article
          key={`${link.videoId}-${index}`}
          className="space-y-3 rounded-lg border bg-card p-3"
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <h2 className="font-semibold">YouTube відео {index + 1}</h2>
            <span className="text-muted-foreground">{link.videoId}</span>
          </div>
          <div className="aspect-video overflow-hidden rounded-md bg-muted">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${link.videoId}`}
              title={`YouTube відео ${index + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </article>
      ))}
    </section>
  );
}
