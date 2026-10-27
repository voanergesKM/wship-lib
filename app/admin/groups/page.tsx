import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/access";
import { getAdminGroups } from "@/lib/admin/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { AdminPagination } from "../_components/AdminPagination";
import { adminDate } from "../_components/AdminDate";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminPage("groups.read");
  const search = await searchParams;
  const { groups, total, page, pages } = await getAdminGroups(search);
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Групи ({total})</h1>
      <form className="flex items-end gap-3">
        <Field>
          <FieldLabel htmlFor="group-search">Назва групи</FieldLabel>
          <Input id="group-search" name="q" defaultValue={search.q} />
        </Field>
        <Button type="submit">Знайти</Button>
      </form>
      <ul className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <li className="rounded-xl border p-4" key={group._id}>
            <Link
              className="font-semibold underline underline-offset-4"
              href={`/admin/groups/${group._id}`}
            >
              {group.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              Учасників: {group.members.length} · Власник:{" "}
              {group.members.find((m) => m.role === "owner")?.userId
                ?.firstName || "Немає даних"}
            </p>
            <p className="text-xs text-muted-foreground">
              Створено: {adminDate(group.createdAt)}
            </p>
          </li>
        ))}
      </ul>
      {groups.length === 0 && (
        <p className="text-muted-foreground">Груп не знайдено.</p>
      )}
      <AdminPagination
        path="/admin/groups"
        page={page}
        pages={pages}
        search={search}
      />
    </section>
  );
}
