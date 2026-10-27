"use client";
import { useMemo } from "react";
import type { ActivityRow } from "@/lib/activity/data";
import type { AdminSorting } from "@/lib/admin/tableSorting";
import { AdminDataTable } from "./table/AdminDataTable";
import { activityColumns } from "./table/activityColumns";
export function ActivityTable({
  events,
  sorting,
  readUsers,
  readGroups,
}: {
  events: ActivityRow[];
  sorting: AdminSorting;
  readUsers: boolean;
  readGroups: boolean;
}) {
  const columns = useMemo(
    () => activityColumns(readUsers, readGroups),
    [readUsers, readGroups],
  );
  return (
    <AdminDataTable
      data={events}
      columns={columns}
      sorting={sorting}
      emptyMessage="Подій за цими фільтрами немає."
    />
  );
}
