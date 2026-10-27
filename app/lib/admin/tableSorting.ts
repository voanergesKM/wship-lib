export interface AdminSortSearch {
  sort?: string;
  direction?: string;
}
export type AdminSorting = { id: string; desc: boolean }[];
const USER_SORT_FIELDS = [
  "firstName",
  "isActive",
  "lastLoginAt",
  "lastSeenAt",
] as const;

function resolveSorting(
  search: AdminSortSearch,
  allowed: readonly string[],
  fallback: string,
) {
  const selected = allowed.find((field) => field === search.sort);
  const field = selected ?? fallback;
  const desc = !selected || search.direction !== "asc";
  const mongo: Record<string, 1 | -1> = { [field]: desc ? -1 : 1, _id: -1 };
  const sorting: AdminSorting =
    selected || allowed.includes(fallback) ? [{ id: field, desc }] : [];
  return { mongo, sorting };
}
export const userTableSorting = (search: AdminSortSearch) =>
  resolveSorting(search, USER_SORT_FIELDS, "createdAt");
export const activityTableSorting = (search: AdminSortSearch) =>
  resolveSorting(search, ["occurredAt"], "occurredAt");

export function tableSortHref(
  path: string,
  current: string,
  sorting: AdminSorting,
) {
  const params = new URLSearchParams(current);
  params.delete("page");
  if (sorting[0]) {
    params.set("sort", sorting[0].id);
    params.set("direction", sorting[0].desc ? "desc" : "asc");
  } else {
    params.delete("sort");
    params.delete("direction");
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
