"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, User, Loader2, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { groupsService } from "@/services/groups.service";
import { useAuth } from "@/components/providers/AuthContext";
import { PageLoader } from "@/components/shared/PageLoader";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [emailValue, setEmailValue] = useState("");
  const [emailStatus, setEmailStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Sync email input when user loads
  useEffect(() => {
    setEmailValue(user?.email || "");
  }, [user?.email]);

  const { mutateAsync: saveEmail, isPending: isSavingEmail } = useMutation({
    mutationFn: groupsService.updateEmail,
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setEmailStatus({ type: "success", message: "Пошту успішно оновлено!" });
      setTimeout(() => setEmailStatus(null), 3000);
    },
    onError: (err: any) => {
      setEmailStatus({
        type: "error",
        message: err.message || "Не вдалося оновити пошту",
      });
    },
  });

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    await saveEmail(emailValue.trim());
  };

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
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.firstName}
              className="w-14 h-14 rounded-full object-cover border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
              {user?.firstName?.[0] || "?"}
            </div>
          )}
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
              disabled={isSavingEmail || emailValue === (user?.email || "")}
            >
              {isSavingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Зберегти пошту
            </Button>

            {user?.email && emailValue !== user.email && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEmailValue(user.email || "")}
                disabled={isSavingEmail}
              >
                Скасувати
              </Button>
            )}
          </div>
        </form>

        {user?.email && (
          <p className="text-xs text-muted-foreground">
            Поточна пошта:{" "}
            <span className="font-semibold text-foreground">{user.email}</span>
          </p>
        )}
      </div>
    </div>
  );
}
