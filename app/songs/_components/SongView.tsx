import { ReactNode } from "react";
import { EyeIcon, Film, Music2 } from "lucide-react";

import { SongVisibility } from "@/services/songs.service";
import { YouTubeLink } from "@/utils/youtubeLinks";
import { SongMedia } from "./SongMedia";
import { SongPreview } from "./SongPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const visibilityLabels: Record<SongVisibility, string> = {
  public: "Публічна",
  team: "Для команди",
  private: "Приватна",
};

export function SongView({
  title,
  tags,
  authors,
  songKey,
  bpm,
  document,
  youtube,
  visibility,
}: {
  title: string;
  tags: string[];
  authors: string[];
  songKey?: string;
  bpm?: number;
  document: string;
  youtube: YouTubeLink[];
  visibility: SongVisibility;
}) {
  return (
    <Tabs defaultValue="song" className="w-full gap-5">
      <TabsList>
        <TabsTrigger value="song">
          <Music2 />
          Пісня
        </TabsTrigger>
        <TabsTrigger value="media">
          <Film />
          Медіа
        </TabsTrigger>
        <TabsTrigger value="preview" asChild>
          <SongPreview
            content={document}
            dialogTrigger={<Button variant="outline">Текст</Button>}
          />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="song">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),280px]">
          <aside className="space-y-4 rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold">Метадані</h2>
            <dl className="space-y-4 text-sm">
              <MetaItem label="Назва" value={title} />
              <MetaItem label="Автори" value={authors.join(", ")} />
              <MetaItem label="Теги" value={tags.join(", ")} />
              <MetaItem label="Тональність" value={songKey} />
              <MetaItem label="BPM" value={bpm ? String(bpm) : undefined} />
              <MetaItem
                label="Видимість"
                value={visibilityLabels[visibility]}
              />
              <MetaItem
                label="YouTube"
                value={youtube.length ? `${youtube.length} відео` : undefined}
              />
            </dl>
          </aside>
        </div>
      </TabsContent>

      <TabsContent value="media">
        <SongMedia youtube={youtube} />
      </TabsContent>
    </Tabs>
  );
}

function MetaItem({
  label,
  value,
}: {
  label: string;
  value?: string | ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value || "Не вказано"}</dd>
    </div>
  );
}
