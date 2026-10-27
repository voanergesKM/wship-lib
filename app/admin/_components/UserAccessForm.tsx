"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import type { AdminProfile, AdminUser } from "@/lib/admin/data";

export function UserAccessForm({
  user,
  profiles,
  canUpdateStatus,
  canAssignProfile,
}: {
  user: AdminUser;
  profiles: AdminProfile[];
  canUpdateStatus: boolean;
  canAssignProfile: boolean;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const [active, setActive] = useState(user.isActive);
  const [profile, setProfile] = useState(user.permissionProfileId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  if (!canUpdateStatus && !canAssignProfile) return null;
  return (
    <form
      className="max-w-xl rounded-xl border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setPending(true);
        try {
          const changes = {
            ...(canUpdateStatus && active !== user.isActive
              ? { isActive: active }
              : {}),
            ...(canAssignProfile && profile !== user.permissionProfileId
              ? { permissionProfileId: profile }
              : {}),
          };
          if (!Object.keys(changes).length) return;
          const response = await fetch(`/api/admin/users/${user._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(changes),
          });
          if (!response.ok)
            throw new Error(
              (await response.json()).error || "Не вдалося зберегти зміни",
            );
          await client.invalidateQueries({ queryKey: ["authMe"] });
          setMessage("Зміни збережено");
          router.refresh();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Не вдалося зберегти зміни",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <FieldGroup>
        {canUpdateStatus && (
          <Field>
            <FieldLabel htmlFor="account-status">Статус акаунта</FieldLabel>
            <select
              id="account-status"
              disabled={pending}
              value={active ? "active" : "blocked"}
              onChange={(e) => setActive(e.target.value === "active")}
              className="h-9 rounded-xl border bg-background px-3"
            >
              <option value="active">Активний</option>
              <option value="blocked">Заблокований</option>
            </select>
          </Field>
        )}
        {canAssignProfile && (
          <Field>
            <FieldLabel htmlFor="account-profile">Профіль доступу</FieldLabel>
            <select
              id="account-profile"
              disabled={pending}
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="h-9 rounded-xl border bg-background px-3"
            >
              {!profiles.some((p) => p._id === profile) && (
                <option value={profile}>Профіль відсутній</option>
              )}
              {profiles.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <Button
          type="submit"
          isLoading={pending}
          disabled={
            active === user.isActive && profile === user.permissionProfileId
          }
        >
          Зберегти
        </Button>
      </FieldGroup>
    </form>
  );
}
