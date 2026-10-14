"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  User,
  Loader2,
  Check,
  AlertCircle,
  GitPullRequest,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { groupsService } from "@/services/groups.service";
import { useAuth } from "@/components/providers/AuthContext";
import { PageLoader } from "@/components/shared/PageLoader";
import { useUserProposals } from "@/hooks/useSongProposals";
import { SongProposalItem } from "@/services/songs.service";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  if (authLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] text-center p-4">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Профіль</h1>
        <p className="text-muted-foreground max-w-md">
          Будь ласка, увійдіть в акаунт через Telegram, щоб переглянути налаштування профілю.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl space-y-8 py-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          Профіль
        </h1>
        <p className="text-muted-foreground">Керуйте своїми особистими налаштуваннями</p>
      </div>

      {/* Telegram Info (read-only) */}
      <div className="border rounded-xl p-5 bg-card/50 space-y-4">
        <h2 className="font-bold text-lg">Telegram акаунт</h2>
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border">
            <AvatarImage
              src={user?.photoUrl || undefined}
              alt={user?.firstName || ""}
              className="object-cover"
            />
            <AvatarFallback className="text-xl font-bold">
              {user?.firstName?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-bold text-lg">{user?.firstName}</p>
            {user?.username && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full font-medium">
              <Check className="h-3 w-3" />
              Підключено через Telegram
            </span>
          </div>
        </div>
      </div>

      {/* Email Section */}
      <ProfileEmailSection
        key={user?.email || "no-email"}
        initialEmail={user?.email || ""}
        onEmailSaved={refreshUser}
      />

      {/* Proposals Section */}
      <ProfileProposalsSection />
    </div>
  );
}

function ProfileEmailSection({
  initialEmail,
  onEmailSaved,
}: {
  initialEmail: string;
  onEmailSaved: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [emailValue, setEmailValue] = useState(initialEmail);
  const [emailStatus, setEmailStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const { mutateAsync: saveEmail, isPending: isSavingEmail } = useMutation({
    mutationFn: groupsService.updateEmail,
    onSuccess: async () => {
      await onEmailSaved();
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setEmailStatus({ type: "success", message: "Пошту успішно оновлено!" });
      timeoutRef.current = setTimeout(() => setEmailStatus(null), 3000);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Не вдалося оновити пошту";
      setEmailStatus({
        type: "error",
        message,
      });
    },
  });

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    await saveEmail(emailValue.trim());
  };

  return (
    <div className="border rounded-xl p-5 bg-card/50 space-y-4">
      <div className="space-y-1">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Електронна пошта
        </h2>
        <p className="text-sm text-muted-foreground">
          Прив&apos;яжіть пошту, щоб отримувати запрошення у групи. Після збереження всі
          наявні запрошення на цю адресу будуть автоматично відображені у вашому акаунті.
        </p>
      </div>

      {emailStatus && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
            emailStatus.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}
        >
          {emailStatus.type === "success" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {emailStatus.message}
        </div>
      )}

      <form onSubmit={handleSaveEmail} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email адреса</Label>
          <Input
            id="profile-email"
            type="email"
            placeholder="name@example.com"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            disabled={isSavingEmail}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isSavingEmail || emailValue === initialEmail}
          >
            {isSavingEmail ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Зберегти пошту
          </Button>

          {initialEmail && emailValue !== initialEmail && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEmailValue(initialEmail)}
              disabled={isSavingEmail}
            >
              Скасувати
            </Button>
          )}
        </div>
      </form>

      {initialEmail && (
        <p className="text-xs text-muted-foreground">
          Поточна пошта:{" "}
          <span className="font-semibold text-foreground">{initialEmail}</span>
        </p>
      )}
    </div>
  );
}

function ProfileProposalsSection() {
  const { data, isLoading } = useUserProposals();
  const proposals = data?.proposals || [];

  return (
    <div className="border rounded-xl p-5 bg-card/50 space-y-4">
      <div className="space-y-1">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-primary" />
          Мої пропозиції змін до пісень
        </h2>
        <p className="text-sm text-muted-foreground">
          Історія ваших запропонованих змін до пісень та їхній поточний статус розгляду.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Завантаження пропозицій...
        </div>
      ) : proposals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Ви ще не надсилали жодної пропозиції змін до пісень.
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => {
            const song =
              typeof proposal.song === "object" && proposal.song !== null
                ? proposal.song
                : null;
            const songTitle =
              song?.title || proposal.proposedData?.title || "Пісня";
            const songSlug = song?.slug;

            return (
              <div
                key={proposal._id}
                className="border rounded-lg p-4 bg-background/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    {songSlug ? (
                      <Link
                        href={`/songs/${songSlug}`}
                        className="font-semibold text-base hover:underline flex items-center gap-1.5"
                      >
                        {songTitle}
                        <ExternalLink className="size-3.5 text-muted-foreground" />
                      </Link>
                    ) : (
                      <span className="font-semibold text-base">
                        {songTitle}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" />
                      Подано{" "}
                      {new Date(proposal.createdAt).toLocaleDateString(
                        "uk-UA",
                      )}
                    </p>
                  </div>

                  <ProposalStatusBadge status={proposal.status} />
                </div>

                {proposal.comment && (
                  <div className="text-xs bg-muted/40 p-2.5 rounded-md border text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Ваш коментар:{" "}
                    </span>
                    {proposal.comment}
                  </div>
                )}

                {proposal.status === "rejected" && (
                  <div className="text-xs bg-destructive/10 text-destructive dark:text-red-400 p-2.5 rounded-md border border-destructive/20">
                    <span className="font-semibold">Причина відхилення: </span>
                    {proposal.reviewComment || "Причину не вказано"}
                  </div>
                )}

                {proposal.status === "approved" && proposal.reviewComment && (
                  <div className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-md border border-emerald-500/20">
                    <span className="font-semibold">Коментар автора: </span>
                    {proposal.reviewComment}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProposalStatusBadge({
  status,
}: {
  status: SongProposalItem["status"];
}) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          <Clock className="size-3" />
          Очікує розгляду
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="size-3" />
          Прийнято
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
          <XCircle className="size-3" />
          Відхилено
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
          <Ban className="size-3" />
          Скасовано
        </span>
      );
  }
}
