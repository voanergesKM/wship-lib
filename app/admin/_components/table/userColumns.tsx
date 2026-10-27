"use client";
import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import type { AdminUser } from "@/lib/admin/data";
import { adminDate } from "../AdminDate";
import type { AdminTableFeatures } from "./features";

const helper = createColumnHelper<AdminTableFeatures, AdminUser>();
export const userColumns = helper.columns([
  helper.accessor("firstName", {
    header: "Користувач",
    enableSorting: true,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <>
          <Link
            className="font-medium underline underline-offset-4"
            href={`/admin/users/${user._id}`}
          >
            {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
              user.username ||
              "Користувач"}
          </Link>
          <p className="text-xs text-muted-foreground">
            {user.username ? `@${user.username}` : user.email}
          </p>
        </>
      );
    },
  }),
  helper.accessor("isActive", {
    header: "Статус",
    enableSorting: true,
    cell: (context) => (context.getValue() ? "Активний" : "Заблокований"),
  }),
  helper.display({
    id: "profile",
    header: "Профіль",
    cell: ({ row }) =>
      row.original.permissionProfileName || row.original.permissionProfileId,
  }),
  helper.display({
    id: "groups",
    header: "Групи",
    cell: ({ row }) =>
      row.original.groups.map((group) => group.name).join(", ") || "—",
  }),
  helper.accessor("lastLoginAt", {
    header: "Останній вхід",
    enableSorting: true,
    sortDescFirst: true,
    cell: (context) => (
      <span className="whitespace-nowrap">{adminDate(context.getValue())}</span>
    ),
  }),
  helper.accessor("lastSeenAt", {
    header: "Остання активність",
    enableSorting: true,
    sortDescFirst: true,
    cell: (context) => (
      <span className="whitespace-nowrap">{adminDate(context.getValue())}</span>
    ),
  }),
]);
