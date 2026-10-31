"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthContext";
import { LoginDialog } from "@/components/shared/LoginDialog";
import { Button } from "@/components/ui/button";

type GroupInfo = {
  id: string;
  name: string;
  sessionUserId: string | null;
  alreadyMember: boolean;
} | null;
export function InvitePage({
  token,
  group,
}: {
  token: string;
  group: GroupInfo;
}) {
  const { user, isLoading, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [loginOpen, setLoginOpen] = useState(false);
  const join = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/group-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Не вдалося приєднатися");
      return data as { groupId: string; alreadyMember: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
  const groupId = join.data?.groupId || group?.id;
  const joined = Boolean(
    join.data ||
    (user && group?.sessionUserId === user.id && group.alreadyMember),
  );
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border bg-card p-6 text-center">
      <h1 className="text-2xl font-bold">Запрошення до групи</h1>
      {!group ? (
        <p className="text-muted-foreground">
          Посилання прострочене, відкликане або недійсне. Попросіть
          адміністратора створити нове.
        </p>
      ) : (
        <>
          <p>
            Вас запрошують до групи <strong>{group.name}</strong>.
          </p>
          {joined ? (
            <>
              <p className="text-sm text-muted-foreground">
                Ви вже є учасником групи.
              </p>
              <Button asChild>
                <Link href={`/groups/${groupId}`}>Перейти до групи</Link>
              </Button>
            </>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">
              Перевірка авторизації...
            </p>
          ) : user ? (
            <Button disabled={join.isPending} onClick={() => join.mutate()}>
              {join.isPending ? "Приєднання..." : "Приєднатися"}
            </Button>
          ) : (
            <Button onClick={() => setLoginOpen(true)}>
              Увійти, щоб приєднатися
            </Button>
          )}
          {join.error && (
            <p role="alert" className="text-sm text-destructive">
              {join.error.message}
            </p>
          )}
          <LoginDialog
            open={loginOpen}
            onOpenChange={setLoginOpen}
            description="Увійдіть через Telegram, щоб приєднатися до групи."
            onAuth={async () => {
              await refreshUser();
              setLoginOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}
