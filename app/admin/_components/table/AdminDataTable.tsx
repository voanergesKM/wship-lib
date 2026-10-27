"use client";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tableSortHref, type AdminSorting } from "@/lib/admin/tableSorting";
import { adminTableFeatures, type AdminTableFeatures } from "./features";

export function AdminDataTable<TData extends { _id: string }>({
  data,
  columns,
  sorting,
  emptyMessage,
}: {
  data: TData[];
  columns: ColumnDef<AdminTableFeatures, TData>[];
  sorting: AdminSorting;
  emptyMessage: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [pendingColumn, setPendingColumn] = useState<string | null>(null);
  const table = useTable({
    features: adminTableFeatures,
    data,
    columns,
    getRowId: (row) => row._id,
    defaultColumn: { enableSorting: false },
    manualSorting: true,
    enableMultiSort: false,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setPendingColumn(next[0]?.id ?? sorting[0]?.id ?? null);
      startTransition(() =>
        router.replace(tableSortHref(path, search.toString(), next), {
          scroll: false,
        }),
      );
    },
  });
  return (
    <div className="overflow-hidden rounded-xl border" aria-busy={pending}>
      <Table>
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    scope="col"
                    aria-sort={
                      sorted
                        ? sorted === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2"
                        disabled={pending}
                        isLoading={
                          pending && pendingColumn === header.column.id
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        {sorted === "asc" ? (
                          <ArrowUp aria-hidden="true" />
                        ) : sorted === "desc" ? (
                          <ArrowDown aria-hidden="true" />
                        ) : (
                          <ArrowUpDown aria-hidden="true" />
                        )}
                      </Button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="align-top whitespace-normal"
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
