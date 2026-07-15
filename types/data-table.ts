import type {
  ColumnDef,
  ColumnPinningState,
  OnChangeFn,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

export interface DataTableProps<TData> {
  // === Data ===
  /** Flat array of all fetched rows. Consumer owns fetching & pagination. */
  data: TData[];
  /** TanStack column definitions — consumer defines all columns including select & actions. */
  columns: ColumnDef<TData, any>[];
  /** Stable row identity — must return a unique string per row. */
  getRowId: (row: TData) => string;

  // === Infinite scroll ===
  /** Total number of rows matching the current filters (server-side count). */
  totalRowCount: number;
  /** True while a page fetch is in-flight. */
  isFetching: boolean;
  /** True only during the very first load (no data yet). */
  isLoading: boolean;
  /** Called when the scroll position nears the bottom — consumer should trigger `fetchNextPage`. */
  onFetchMore: () => void;

  // === Row selection (controlled, optional) ===
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  // === Sorting (controlled, manual — optional) ===
  enableSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  // === Column pinning ===
  /** Initial column pinning state (e.g. `{ left: ["select"], right: ["actions"] }`). */
  defaultColumnPinning?: ColumnPinningState;
  /**
   * Column id that must always stay as the rightmost pinned-right column.
   * The DataTable normalizes pinning changes to enforce this.
   */
  pinnedRightGuard?: string;

  // === Layout ===
  /** Height of each row in pixels. Defaults to 40. */
  rowHeight?: number;

  // === Empty / loading slots ===
  /** Rendered when `isLoading` is false and there are zero rows. */
  emptyState?: ReactNode;
  /** Rendered while `isLoading` is true. */
  loadingState?: ReactNode;
}
