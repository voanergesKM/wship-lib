import { ReactNode } from "react";
import { FileText, Film, Info } from "lucide-react";

import { SongVisibility } from "@/services/songs.service";
import { YouTubeLink } from "@/utils/youtubeLinks";
import { SongMedia } from "./SongMedia";
import { SongText } from "./SongText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  creatorDisplayName,
  activeSectionId,
}: {
  title: string;
  tags: string[];
  authors: string[];
  songKey?: string;
  bpm?: number;
  document: string;
  youtube: YouTubeLink[];
  visibility: SongVisibility;
  creatorDisplayName?: string;
  activeSectionId?: string | null;
}) {
  return (
    <Tabs defaultValue="text" className="w-full gap-5">
      <TabsList>
        <TabsTrigger value="text">
          <FileText />
          Текст
        </TabsTrigger>
        <TabsTrigger value="media">
          <Film />
          Медіа
        </TabsTrigger>
        <TabsTrigger value="metadata">
          <Info />
          Метадані
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text">
        <SongText content={document} activeSectionId={activeSectionId} />
      </TabsContent>

      <TabsContent value="media">
        <SongMedia youtube={youtube} />
      </TabsContent>

      <TabsContent value="metadata">
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
              {creatorDisplayName && (
                <MetaItem label="Додав до збірки" value={creatorDisplayName} />
              )}
            </dl>
          </aside>
        </div>
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
