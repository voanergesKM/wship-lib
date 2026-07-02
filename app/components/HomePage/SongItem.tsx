import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { SongDocument } from "@/models/Song";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import { ListPlus } from "lucide-react";
import { AddToPlaylistDialog } from "../shared/AddToPlaylistDialog";
import { useAuth } from "../providers/AuthContext";

export const SongItem = ({ song }: { song: SongDocument }) => {
  const { isAuthenticated } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddOpen(true);
  };

  return (
    <>
      <div className="relative group/card h-full">
        <Link href={`/songs/${song.slug}`}>
          <Item
            variant="outline"
            className="h-full flex flex-col hover:bg-accent/50 transition-colors items-start"
          >
            <ItemContent className="flex-1 pr-8">
              <ItemTitle className="text-lg mb-auto">{song.title}</ItemTitle>
              <div className="mt-3 space-y-2">
                {song.authors && song.authors.length > 0 && (
                  <div className="text-sm font-medium text-foreground">
                    {song.authors.join(", ")}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {song.key && (
                    <span className="px-2 py-0.5 bg-secondary rounded-full">
                      Тональність: {song.key}
                    </span>
                  )}
                  {song.bpm && (
                    <span className="px-2 py-0.5 bg-secondary rounded-full">
                      Темп: {song.bpm} BPM
                    </span>
                  )}
                </div>
                {song.tags && song.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {song.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {song.tags.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                        +{song.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </ItemContent>
          </Item>
        </Link>
        {isAuthenticated && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleAddClick}
            className="absolute top-3 right-3 opacity-60 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity z-10 hover:bg-muted h-8 w-8"
            title="Додати до списку"
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isAddOpen && (
        <AddToPlaylistDialog
          songId={song._id.toString()}
          songTitle={song.title}
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        />
      )}
    </>
  );
};
