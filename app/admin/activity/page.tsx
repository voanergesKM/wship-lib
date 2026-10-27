import Link from "next/link";
import { can } from "@/lib/permissions/catalog";
import { activityTableSorting } from "@/lib/admin/tableSorting";
import { requireAdminPage } from "@/lib/admin/access";
import { getActivityEvents, type ActivitySearch } from "@/lib/activity/data";
import { ACTIVITY_ACTIONS, ACTIVITY_KEYS } from "@/lib/activity/catalog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActivityTable } from "../_components/ActivityTable";
import { AdminPagination } from "../_components/AdminPagination";
const selectClass = "h-9 rounded-xl border bg-background px-3 text-sm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ActivitySearch>;
}) {
  const viewer = await requireAdminPage("activity.read");
  const search = await searchParams;
  const { events, page, pages, total, error } = await getActivityEvents(search);
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Журнал активності ({total})</h1>
      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {search.sort && <input type="hidden" name="sort" value={search.sort} />}
        {search.direction && (
          <input type="hidden" name="direction" value={search.direction} />
        )}
        <Field>
          <FieldLabel htmlFor="activity-actor">Користувач</FieldLabel>
          <Input
            id="activity-actor"
            name="actor"
            defaultValue={search.actor}
            placeholder="@username або ID"
            maxLength={100}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="activity-group">Група</FieldLabel>
          <Input
            id="activity-group"
            name="group"
            defaultValue={search.group}
            placeholder="Назва або ID"
            maxLength={100}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="activity-action">Дія</FieldLabel>
          <select
            id="activity-action"
            name="action"
            defaultValue={search.action || ""}
            className={selectClass}
          >
            <option value="">Усі дії</option>
            {ACTIVITY_KEYS.map((key) => (
              <option key={key} value={key}>
                {ACTIVITY_ACTIONS[key].label}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="activity-from">Від (час Києва)</FieldLabel>
          <Input
            id="activity-from"
            name="from"
            type="date"
            defaultValue={search.from}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="activity-to">До включно (час Києва)</FieldLabel>
          <Input
            id="activity-to"
            name="to"
            type="date"
            defaultValue={search.to}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="activity-source">Джерело</FieldLabel>
          <select
            id="activity-source"
            name="source"
            defaultValue={search.source || ""}
            className={selectClass}
          >
            <option value="">Усі</option>
            <option value="server">Сервер</option>
            <option value="client">Інтерфейс</option>
          </select>
        </Field>
        <div className="flex gap-2">
          <Button type="submit">Застосувати</Button>
          <Button asChild variant="outline">
            <Link href="/admin/activity">Скинути</Link>
          </Button>
        </div>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Події інтерфейсу повідомляє браузер. Вони можуть бути пропущені й не
        підтверджують фактичне виконання серверної операції.
      </p>
      <ActivityTable
        events={events}
        sorting={activityTableSorting(search).sorting}
        readUsers={can(viewer, "users.read")}
        readGroups={can(viewer, "groups.read")}
      />
      <AdminPagination
        path="/admin/activity"
        page={page}
        pages={pages}
        search={search}
      />
    </section>
  );
}
