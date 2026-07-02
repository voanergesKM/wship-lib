"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, ListPlus, Loader2, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { groupsService } from "@/services/groups.service";
import { useAuth } from "@/components/providers/AuthContext";

export interface AddToPlaylistDialogProps {
  songId: string;
  songTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToPlaylistDialog({
  songId,
  songTitle,
  open,
  onOpenChange,
}: AddToPlaylistDialogProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [newListName, setNewListName] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsService.getMyGroups,
    enabled: open && isAuthenticated,
  });

  // Set default group when groups load
  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0]._id);
    }
  }, [groups, selectedGroupId]);

  // Fetch lists for selected group
  const { data: lists, isLoading: isLoadingLists } = useQuery({
    queryKey: ["groupLists", selectedGroupId],
    queryFn: () => groupsService.getSongLists(selectedGroupId),
    enabled: open && isAuthenticated && !!selectedGroupId,
  });

  // Mutation to add song to existing list
  const { mutateAsync: addSong, isPending: isAdding } = useMutation({
    mutationFn: ({ listId }: { listId: string }) =>
      groupsService.addSongToList(selectedGroupId, listId, songId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groupLists", selectedGroupId] });
      setSuccessMessage("Пісню успішно додано!");
      setErrorMessage(null);
      setTimeout(() => {
        setSuccessMessage(null);
        onOpenChange(false);
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Не вдалося додати пісню");
      setSuccessMessage(null);
    },
  });

  // Mutation to create new list and add song
  const { mutateAsync: createAndAdd, isPending: isCreating } = useMutation({
    mutationFn: (name: string) =>
      groupsService.createSongList(selectedGroupId, name, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupLists", selectedGroupId] });
      setSuccessMessage("Список створено та пісню додано!");
      setNewListName("");
      setErrorMessage(null);
      setTimeout(() => {
        setSuccessMessage(null);
        onOpenChange(false);
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Не вдалося створити список");
      setSuccessMessage(null);
    },
  });

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || !selectedGroupId) return;
    await createAndAdd(newListName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Додати до списку
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Пісня: <span className="font-semibold text-foreground">{songTitle}</span>
          </p>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="py-6 text-center text-muted-foreground">
            Будь ласка, увійдіть в акаунт, щоб користуватися списками пісень.
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-sm text-center font-medium animate-in fade-in duration-200">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-sm text-center font-medium animate-in fade-in duration-200">
                {errorMessage}
              </div>
            )}

            {/* Select Group */}
            <div className="space-y-2">
              <Label htmlFor="group-select">Оберіть групу</Label>
              {isLoadingGroups ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Завантаження груп...
                </div>
              ) : groups && groups.length > 0 ? (
                <select
                  id="group-select"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setErrorMessage(null);
                  }}
                >
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-amber-600 dark:text-amber-400 py-1">
                  У вас немає груп. Створіть групу в меню &quot;Мої групи&quot;, щоб керувати списками.
                </div>
              )}
            </div>

            {selectedGroupId && (
              <>
                {/* Lists in Group */}
                <div className="space-y-2">
                  <Label>Існуючі списки</Label>
                  {isLoadingLists ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Завантаження списків...
                    </div>
                  ) : lists && lists.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto border rounded-md divide-y bg-muted/20">
                      {lists.map((list) => {
                        const hasSong = list.songs?.some(
                          (s: any) => (s._id || s) === songId
                        );

                        return (
                          <div
                            key={list._id}
                            className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors"
                          >
                            <span className="text-sm font-medium text-foreground pr-2 truncate">
                              {list.name}
                            </span>
                            <Button
                              size="sm"
                              variant={hasSong ? "secondary" : "default"}
                              disabled={hasSong || isAdding}
                              onClick={() => addSong({ listId: list._id })}
                              className="shrink-0"
                            >
                              {hasSong ? (
                                "Вже додано"
                              ) : (
                                <>
                                  <ListPlus className="h-4 w-4 mr-1" />
                                  Додати
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-2 italic">
                      У цій групі ще немає списків пісень.
                    </div>
                  )}
                </div>

                {/* Create New List */}
                <form onSubmit={handleCreateList} className="space-y-2 border-t pt-4">
                  <Label htmlFor="new-list-name">Створити новий список у групі</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-list-name"
                      placeholder="Назва списку (напр. Недільне служіння)"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      disabled={isCreating}
                      required
                    />
                    <Button type="submit" disabled={isCreating || !newListName.trim()}>
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Створити
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
