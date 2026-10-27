"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PERMISSION_KEYS,
  SYSTEM_PERMISSIONS,
  type SystemPermission,
} from "@/lib/permissions/catalog";
import type { AdminProfile } from "@/lib/admin/data";
export function PermissionProfileForm({ profile }: { profile?: AdminProfile }) {
  const router = useRouter();
  const client = useQueryClient();
  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [permissions, setPermissions] = useState<SystemPermission[]>(
    profile?.permissions ?? [],
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  return (
    <form
      className="rounded-xl border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        setMessage("");
        try {
          const response = await fetch(
            `/api/admin/profiles${profile ? `/${profile._id}` : ""}`,
            {
              method: profile ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, description, permissions }),
            },
          );
          if (!response.ok)
            throw new Error(
              (await response.json()).error || "Не вдалося зберегти профіль",
            );
          if (!profile) {
            setName("");
            setDescription("");
            setPermissions([]);
          }
          await client.invalidateQueries({ queryKey: ["authMe"] });
          setMessage("Профіль збережено");
          router.refresh();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Не вдалося зберегти профіль",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`profile-name-${profile?._id ?? "new"}`}>
            Назва профілю
          </FieldLabel>
          <Input
            id={`profile-name-${profile?._id ?? "new"}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={80}
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`profile-description-${profile?._id ?? "new"}`}>
            Опис
          </FieldLabel>
          <Textarea
            id={`profile-description-${profile?._id ?? "new"}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            disabled={pending}
          />
        </Field>
        <FieldSet>
          <FieldLegend>Дозволи</FieldLegend>
          <p className="text-sm text-muted-foreground">
            Для доступу до розділів адмінки також увімкніть «Відкривати
            адмінку».
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PERMISSION_KEYS.map((key) => (
              <label className="flex items-start gap-2 text-sm" key={key}>
                <input
                  type="checkbox"
                  className="mt-1 accent-primary"
                  disabled={pending}
                  checked={permissions.includes(key)}
                  onChange={(event) =>
                    setPermissions((current) =>
                      event.target.checked
                        ? [...current, key]
                        : current.filter((p) => p !== key),
                    )
                  }
                />
                <span>{SYSTEM_PERMISSIONS[key]}</span>
              </label>
            ))}
          </div>
        </FieldSet>
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
        <Button type="submit" isLoading={pending}>
          {profile ? "Зберегти профіль" : "Створити профіль"}
        </Button>
      </FieldGroup>
    </form>
  );
}
