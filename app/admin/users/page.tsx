import { requireAdminPage } from "@/lib/admin/access";
import { getAdminUsers } from "@/lib/admin/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { AdminPagination } from "../_components/AdminPagination";
import { UsersTable } from "../_components/UsersTable";
import { userTableSorting } from "@/lib/admin/tableSorting";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    profile?: string;
    page?: string;
    sort?: string;
    direction?: string;
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
        {search.sort && <input type="hidden" name="sort" value={search.sort} />}
        {search.direction && (
          <input type="hidden" name="direction" value={search.direction} />
        )}
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
      <UsersTable users={users} sorting={userTableSorting(search).sorting} />
      <AdminPagination
        path="/admin/users"
        page={page}
        pages={pages}
        search={search}
      />
    </section>
  );
}
