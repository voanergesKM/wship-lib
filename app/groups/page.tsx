"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Check,
  X,
  Loader2,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { groupsService } from "@/services/groups.service";
import { useAuth } from "@/components/providers/AuthContext";
import { PageLoader } from "@/components/shared/PageLoader";

export default function GroupsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Queries
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsService.getMyGroups,
    enabled: isAuthenticated,
  });

  const { data: invitations, isLoading: invitesLoading } = useQuery({
    queryKey: ["invitations"],
    queryFn: groupsService.getPendingInvitations,
    enabled: isAuthenticated,
  });

  // Mutations
  const { mutateAsync: createGroup, isPending: isCreating } = useMutation({
    mutationFn: groupsService.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setNewGroupName("");
      setIsCreateOpen(false);
    },
  });

  const { mutateAsync: acceptInvite, isPending: isAccepting } = useMutation({
    mutationFn: groupsService.acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });

  const { mutateAsync: rejectInvite, isPending: isRejecting } = useMutation({
    mutationFn: groupsService.rejectInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await createGroup(newGroupName.trim());
  };

  if (authLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] text-center p-4">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Груповий доступ</h1>
        <p className="text-muted-foreground max-w-md">
          Будь ласка, увійдіть в акаунт за допомогою Telegram у верхній панелі,
          щоб керувати своїми групами та переглядати спільні списки пісень.
        </p>
      </div>
    );
  }

  const isLoadingData = groupsLoading || invitesLoading;

  return (
    <div className="w-full max-w-4xl space-y-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Мої групи
          </h1>
          <p className="text-muted-foreground mt-1">
            Керуйте своїми командами та спільними списками пісень
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Створити групу
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Створити нову групу</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="group-name">Назва групи</Label>
                <Input
                  id="group-name"
                  placeholder="Наприклад, Хор або Worship Team"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  disabled={isCreating}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Скасувати
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Створити
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
          {isLoadingData ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="grid gap-4">
              {groups.map((group) => {
                const owner = group.members.find((m) => m.role === "owner");
                const currentUserRole = group.members.find(
                  (m) => m.userId?._id === user?.id
                )?.role;

                return (
                  <Link
                    key={group._id}
                    href={`/groups/${group._id}`}
                    className="block group"
                  >
                    <div className="border rounded-xl p-5 hover:border-foreground/30 hover:bg-accent/10 transition-all flex items-center justify-between">
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                          {group.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            Учасників:{" "}
                            <span className="font-semibold text-foreground">
                              {group.members.length}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            Роль:{" "}
                            <span className="font-semibold text-foreground capitalize">
                              {currentUserRole === "owner"
                                ? "Власник"
                                : currentUserRole === "admin"
                                ? "Адмін"
                                : "Учасник"}
                            </span>
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium text-foreground">Ви не є членом жодної групи</p>
              <p className="text-sm mt-1">
                Створіть групу або попросіть адміністратора вашої команди надіслати вам запрошення
              </p>
            </div>
          )}

          {/* Invitations Section */}
          {!isLoadingData && invitations && invitations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-500" />
                Запрошення ({invitations.length})
              </h2>
              <div className="grid gap-3">
                {invitations.map((invite) => (
                  <div
                    key={invite.groupId}
                    className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-base text-foreground">
                        {invite.groupName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Запросив:{" "}
                        <span className="text-foreground">
                          {invite.invitedBy?.firstName || "Адміністратор"}
                        </span>{" "}
                        ({invite.role === "admin" ? "Адміністратор" : "Учасник"})
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
                        disabled={isAccepting || isRejecting}
                        onClick={() => acceptInvite(invite.groupId)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Прийняти
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 border-destructive/20 flex-1 sm:flex-none"
                        disabled={isAccepting || isRejecting}
                        onClick={() => rejectInvite(invite.groupId)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Відхилити
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
