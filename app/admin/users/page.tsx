import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/access";
import { getAdminUsers } from "@/lib/admin/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { AdminPagination } from "../_components/AdminPagination";
import { adminDate } from "../_components/AdminDate";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    profile?: string;
    page?: string;
  }>;
}) {
  await requireAdminPage("users.read");
  const search = await searchParams;
  const { users, total, page, pages } = await getAdminUsers(search);
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        Користувачі <span className="text-muted-foreground">({total})</span>
      </h1>
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="flex-1">
          <FieldLabel htmlFor="user-search">Пошук</FieldLabel>
          <Input
            id="user-search"
            name="q"
            defaultValue={search.q}
            placeholder="Ім’я, username або email"
          />
        </Field>
        <Field className="sm:max-w-48">
          <FieldLabel htmlFor="user-status">Статус</FieldLabel>
          <select
            id="user-status"
            name="status"
            defaultValue={search.status || ""}
            className="h-9 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="">Усі</option>
            <option value="active">Активні</option>
            <option value="blocked">Заблоковані</option>
          </select>
        </Field>
        <Button type="submit">Знайти</Button>
      </form>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              {[
                "Користувач",
                "Статус",
                "Профіль",
                "Групи",
                "Останній вхід",
              ].map((v) => (
                <th key={v} className="p-3 font-medium">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t align-top">
                <td className="p-3">
                  <Link
                    className="font-medium underline underline-offset-4"
                    href={`/admin/users/${user._id}`}
                  >
                    {user.firstName || user.username || "Користувач"}{" "}
                    {user.lastName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {user.username ? `@${user.username}` : user.email}
                  </p>
                </td>
                <td className="p-3">
                  {user.isActive ? "Активний" : "Заблокований"}
                </td>
                <td className="p-3">
                  {user.permissionProfileName || user.permissionProfileId}
                </td>
                <td className="p-3">
                  {user.groups.map((g) => g.name).join(", ") || "—"}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {adminDate(user.lastLoginAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <p className="text-muted-foreground">Користувачів не знайдено.</p>
      )}
      <AdminPagination
        path="/admin/users"
        page={page}
        pages={pages}
        search={search}
      />
    </section>
  );
}
