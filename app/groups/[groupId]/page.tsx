"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Loader2,
  ListMusic,
  UserCheck,
  Send,
  LogOut,
  X,
  ArrowLeft,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function GroupDetailsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { groupId } = use(params);

  // States
  const [activeTab, setActiveTab] = useState("lists");
  const [newListName, setNewListName] = useState("");
  const [inviteType, setInviteType] = useState<"telegram" | "email">("telegram");
  const [inviteValue, setInviteValue] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [errorInvite, setErrorInvite] = useState<string | null>(null);
  const [successInvite, setSuccessInvite] = useState<string | null>(null);

  // Fetch Group and Lists
  const { data: group, isLoading: groupLoading, error: groupError } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsService.getGroupDetails(groupId),
  });

  const { data: lists, isLoading: listsLoading } = useQuery({
    queryKey: ["groupLists", groupId],
    queryFn: () => groupsService.getSongLists(groupId),
  });

  // Permissions check
  const currentUserMember = group?.members?.find(
    (m: any) => m.userId?._id === user?.id
  );
  const isAdminOrOwner =
    currentUserMember && ["owner", "admin"].includes(currentUserMember.role);
  const isOwner = currentUserMember?.role === "owner";

  // Mutations
  const { mutateAsync: createList, isPending: isCreatingList } = useMutation({
    mutationFn: (name: string) => groupsService.createSongList(groupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupLists", groupId] });
      setNewListName("");
    },
  });

  const { mutateAsync: deleteList } = useMutation({
    mutationFn: (listId: string) => groupsService.deleteSongList(groupId, listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupLists", groupId] });
    },
  });

  const { mutateAsync: inviteUser, isPending: isInviting } = useMutation({
    mutationFn: () =>
      groupsService.inviteUser(groupId, inviteType, inviteValue, inviteRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      setInviteValue("");
      setSuccessInvite("Запрошення успішно надіслано!");
      setErrorInvite(null);
      setTimeout(() => setSuccessInvite(null), 3000);
    },
    onError: (err: any) => {
      setErrorInvite(err.message || "Не вдалося надіслати запрошення");
      setSuccessInvite(null);
    },
  });

  const { mutateAsync: removeMember } = useMutation({
    mutationFn: (memberUserId: string) =>
      groupsService.removeMember(groupId, memberUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });

  const { mutateAsync: cancelInvite } = useMutation({
    mutationFn: ({ type, value }: { type: "telegram" | "email"; value: string }) =>
      groupsService.cancelInvitation(groupId, type, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });

  const { mutateAsync: deleteGroup, isPending: isDeletingGroup } = useMutation({
    mutationFn: () => groupsService.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      router.replace("/groups");
    },
  });

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList(newListName.trim());
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteValue.trim()) return;
    await inviteUser();
  };

  const handleLeaveGroup = async () => {
    if (confirm("Ви впевнені, що хочете вийти з цієї групи?")) {
      await removeMember(user!.id);
      router.replace("/groups");
    }
  };

  const handleDeleteGroup = async () => {
    if (
      confirm(
        "Увага! Ви видалите групу та всі її списки пісень назавжди. Продовжити?"
      )
    ) {
      await deleteGroup();
    }
  };

  if (groupLoading) return <PageLoader />;

  if (groupError || !group) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Помилка завантаження</h1>
        <p className="text-muted-foreground">
          Групу не знайдено або у вас немає доступу.
        </p>
        <Button asChild>
          <Link href="/groups">Повернутися до груп</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6 py-6">
      {/* Back button */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" /> Повернутися до списку груп
      </Link>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            Власник:{" "}
            <span className="font-semibold text-foreground">
              {group.createdBy?.firstName || "Невідомо"}
            </span>{" "}
            • Створено: {new Date(group.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {isOwner ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeletingGroup}
              onClick={handleDeleteGroup}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Видалити групу
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/20 hover:bg-destructive/10 w-full sm:w-auto"
              onClick={handleLeaveGroup}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Вийти з групи
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lists" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="lists" className="flex items-center gap-2">
            <ListMusic className="h-4 w-4" /> Списки пісень
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Учасники ({group.members.length})
          </TabsTrigger>
        </TabsList>

        {/* List Content */}
        <TabsContent value="lists" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border bg-muted/20 p-4 rounded-xl">
            <div className="space-y-1">
              <h3 className="font-bold text-base">Створити список пісень</h3>
              <p className="text-xs text-muted-foreground">
                Створіть новий список для планування служіння чи репетицій
              </p>
            </div>
            <form
              onSubmit={handleCreateList}
              className="flex gap-2 w-full sm:w-auto sm:max-w-md"
            >
              <Input
                placeholder="Назва списку..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                disabled={isCreatingList}
                required
              />
              <Button type="submit" disabled={isCreatingList}>
                {isCreatingList ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Створити
              </Button>
            </form>
          </div>

          {listsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : lists && lists.length > 0 ? (
            <div className="grid gap-4">
              {lists.map((list) => (
                <div
                  key={list._id}
                  className="border rounded-xl p-4 flex items-center justify-between hover:border-foreground/20 hover:bg-accent/5 transition-all"
                >
                  <Link
                    href={`/groups/${groupId}/lists/${list._id}`}
                    className="flex-1 min-w-0 pr-4"
                  >
                    <h4 className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate">
                      {list.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Пісень:{" "}
                      <span className="font-semibold text-foreground">
                        {list.songs?.length || 0}
                      </span>{" "}
                      • Оновлено:{" "}
                      {new Date(list.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Ви впевнені, що хочете видалити цей список?")) {
                        deleteList(list._id);
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0"
                    title="Видалити список"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground">
              <ListMusic className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium text-foreground">Немає списків пісень</p>
              <p className="text-sm mt-1">Створіть свій перший список вище</p>
            </div>
          )}
        </TabsContent>

        {/* Members Content */}
        <TabsContent value="members" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Members List */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Поточні учасники
              </h3>
              <div className="border rounded-xl divide-y overflow-hidden">
                {group.members.map((member: any) => {
                  const mUser = member.userId;
                  const isCurrent = mUser?._id === user?.id;

                  return (
                    <div
                      key={mUser?._id}
                      className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground overflow-hidden shrink-0">
                          {mUser?.photoUrl ? (
                            <img
                              src={mUser.photoUrl}
                              alt={mUser.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            mUser?.firstName?.[0] || "?"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {mUser?.firstName || "Гість"}{" "}
                            {isCurrent && (
                              <span className="text-xs font-normal text-muted-foreground pl-1">
                                (Ви)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {mUser?.username ? `@${mUser.username}` : "Немає нікнейму"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium px-2 py-0.5 bg-secondary text-foreground rounded-full">
                          {member.role === "owner"
                            ? "Власник"
                            : member.role === "admin"
                            ? "Адмін"
                            : "Учасник"}
                        </span>

                        {isAdminOrOwner && !isCurrent && member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  `Ви дійсно хочете видалити ${mUser?.firstName} з групи?`
                                )
                              ) {
                                removeMember(mUser._id);
                              }
                            }}
                            className="text-destructive hover:bg-destructive/10 h-8 w-8"
                            title="Видалити з групи"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pending Invites */}
              {isAdminOrOwner && group.invitations && group.invitations.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h4 className="font-bold text-base text-muted-foreground">
                    Надіслані запрошення
                  </h4>
                  <div className="border border-dashed rounded-xl divide-y bg-muted/5">
                    {group.invitations.map((invite: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1.5">
                            {invite.type === "telegram" ? (
                              <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs px-1.5 py-0.5 rounded">
                                TG
                              </span>
                            ) : (
                              <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs px-1.5 py-0.5 rounded">
                                Email
                              </span>
                            )}
                            {invite.value}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Запросив: {invite.invitedBy?.firstName} • Роль:{" "}
                            {invite.role === "admin" ? "Адмін" : "Учасник"}
                          </p>
                        </div>
                        {/* Remove pending invitation */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (confirm("Скасувати це запрошення?")) {
                              await cancelInvite({
                                type: invite.type,
                                value: invite.value,
                              });
                            }
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Скасувати запрошення"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Invite Form (only for Admin/Owner) */}
            {isAdminOrOwner && (
              <div className="border rounded-xl p-5 bg-card/50 h-fit space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Запросити учасника
                </h3>
                <p className="text-xs text-muted-foreground">
                  Запросіть користувача за його нікнеймом у Telegram або за поштовою адресою.
                </p>

                {errorInvite && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive p-2.5 rounded-lg text-xs font-medium text-center">
                    {errorInvite}
                  </div>
                )}

                {successInvite && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg text-xs font-medium text-center">
                    {successInvite}
                  </div>
                )}

                <form onSubmit={handleInvite} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Спосіб запрошення</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={inviteType === "telegram" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setInviteType("telegram");
                          setInviteValue("");
                        }}
                      >
                        Telegram
                      </Button>
                      <Button
                        type="button"
                        variant={inviteType === "email" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setInviteType("email");
                          setInviteValue("");
                        }}
                      >
                        Пошта
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="invite-value" className="text-xs">
                      {inviteType === "telegram" ? "Telegram нікнейм" : "Email адреса"}
                    </Label>
                    <Input
                      id="invite-value"
                      placeholder={inviteType === "telegram" ? "@username" : "user@example.com"}
                      value={inviteValue}
                      onChange={(e) => setInviteValue(e.target.value)}
                      disabled={isInviting}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="invite-role" className="text-xs">
                      Роль у групі
                    </Label>
                    <select
                      id="invite-role"
                      className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      disabled={isInviting}
                    >
                      <option value="member">Учасник</option>
                      <option value="admin">Адміністратор</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    disabled={isInviting || !inviteValue.trim()}
                  >
                    {isInviting ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Надіслати
                  </Button>
                </form>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple Helper component to avoid missing import
function UserPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
