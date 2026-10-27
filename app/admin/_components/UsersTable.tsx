"use client";
import type { AdminUser } from "@/lib/admin/data";
import type { AdminSorting } from "@/lib/admin/tableSorting";
import { AdminDataTable } from "./table/AdminDataTable";
import { userColumns } from "./table/userColumns";
export function UsersTable({
  users,
  sorting,
}: {
  users: AdminUser[];
  sorting: AdminSorting;
}) {
  return (
    <AdminDataTable
      data={users}
      columns={userColumns}
      sorting={sorting}
      emptyMessage="Користувачів не знайдено."
    />
  );
}
