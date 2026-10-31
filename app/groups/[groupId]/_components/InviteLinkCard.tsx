"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { baseFetcher } from "@/utils/baseFetcher";

export function InviteLinkCard({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient();
  const key = ["groupInviteLink", groupId];
  const [link, setLink] = useState("");
  const [linkExpiresAt, setLinkExpiresAt] = useState("");
  const [message, setMessage] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () =>
      baseFetcher<{ expiresAt: string | null }>(
        `/groups/${groupId}/invite-link`,
      ),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
  const create = useMutation({
    mutationFn: () =>
      baseFetcher<{ token: string; expiresAt: string }>(
        `/groups/${groupId}/invite-link`,
        { method: "POST" },
      ),
    onSuccess: (result) => {
      setLink(`${window.location.origin}/invite/${result.token}`);
      setLinkExpiresAt(result.expiresAt);
      setMessage("");
      queryClient.setQueryData(key, { expiresAt: result.expiresAt });
    },
    onError: () => setMessage("Не вдалося створити посилання"),
  });
  const revoke = useMutation({
    mutationFn: () =>
      baseFetcher(`/groups/${groupId}/invite-link`, { method: "DELETE" }),
    onSuccess: () => {
      setLink("");
      setMessage("Посилання відкликано");
      queryClient.setQueryData(key, { expiresAt: null });
    },
    onError: () => setMessage("Не вдалося відкликати посилання"),
  });
  const active = Boolean(data?.expiresAt);
  const currentLink = active && data?.expiresAt === linkExpiresAt ? link : "";
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card/50 p-5">
      <h3 className="text-lg font-bold">Запросити за посиланням</h3>
      <p className="text-xs text-muted-foreground">
        Посилання діє одну добу. Кожен, хто його має, може приєднатися як
        учасник і переслати його іншим.
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Завантаження...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Не вдалося перевірити посилання
        </p>
      ) : active ? (
        <p className="text-xs text-muted-foreground">
          Діє до {new Date(data!.expiresAt!).toLocaleString("uk-UA")}.{" "}
          {currentLink ? "" : "Щоб скопіювати посилання, створіть нове."}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Активного посилання немає.
        </p>
      )}
      {currentLink && (
        <div className="flex flex-col gap-2">
          <Input
            aria-label="Посилання для запрошення"
            value={currentLink}
            readOnly
          />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(currentLink);
                setMessage("Посилання скопійовано");
              } catch {
                setMessage("Скопіюйте посилання з поля вручну");
              }
            }}
          >
            Копіювати
          </Button>
        </div>
      )}
      <Button
        size="sm"
        disabled={isLoading || create.isPending || revoke.isPending}
        onClick={() => {
          if (
            !active ||
            confirm("Нове посилання відкличе попереднє. Продовжити?")
          )
            create.mutate();
        }}
      >
        {active ? "Створити нове посилання" : "Створити посилання"}
      </Button>
      {active && (
        <Button
          variant="outline"
          size="sm"
          disabled={create.isPending || revoke.isPending}
          onClick={() => {
            if (confirm("Відкликати посилання?")) revoke.mutate();
          }}
        >
          Відкликати
        </Button>
      )}
      {message && (
        <p role="status" className="text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </section>
  );
}
