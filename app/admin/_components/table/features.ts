import { rowSortingFeature, tableFeatures } from "@tanstack/react-table";

// Rows have already been filtered, sorted and paginated by the server.
// Do not register client-side row processing for these tables.
export const adminTableFeatures = tableFeatures({ rowSortingFeature });
export type AdminTableFeatures = typeof adminTableFeatures;
