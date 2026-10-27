import Link from "next/link";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/access";
import { can } from "@/lib/permissions/catalog";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Адмінка • Worship Library",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdminPage("admin.access");
  return (
    <div className="flex w-full max-w-6xl flex-col gap-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin" className="text-2xl font-bold">
          Адмінка
        </Link>
        <nav aria-label="Розділи адмінки" className="flex flex-wrap gap-2">
          {can(user, "users.read") && (
            <Button asChild variant="outline">
              <Link href="/admin/users">Користувачі</Link>
            </Button>
          )}
          {can(user, "groups.read") && (
            <Button asChild variant="outline">
              <Link href="/admin/groups">Групи</Link>
            </Button>
          )}
          {can(user, "permissionProfiles.read") && (
            <Button asChild variant="outline">
              <Link href="/admin/profiles">Профілі доступу</Link>
            </Button>
          )}
        </nav>
      </div>
      {children}
    </div>
  );
}
