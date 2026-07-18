"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { DraggableColumnHeader } from "./DraggableColumnHeader";
import { getPinningStyles } from "@/lib/table-styles";
import { cn } from "@/lib/utils";
import type { DataTableProps } from "@/types/data-table";

const DEFAULT_ROW_HEIGHT = 40;

// Fix #6: hoisted to module level — avoids allocating a new array on every render
// which caused DndContext to reconcile unnecessarily.
const DND_MODIFIERS = [restrictToHorizontalAxis];

// Fix #9: stable object reference so useSensors doesn't recreate descriptors each render.
const POINTER_SENSOR_OPTIONS = { activationConstraint: { distance: 6 } };

// Fix #7: module-level constants — these are static JSX, no need to recreate per render.
const DEFAULT_LOADING_STATE = (
  <div className="flex h-64 items-center justify-center text-sm text-ink-faint">Loading…</div>
);
const DEFAULT_EMPTY_STATE = (
  <div className="flex h-64 flex-col items-center justify-center gap-1 text-center">
    <p className="text-sm font-medium text-ink">No results found</p>
    <p className="text-xs text-ink-faint">Try adjusting your filters.</p>
  </div>
);

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  totalRowCount,
  isFetching,
  isLoading,
  onFetchMore,
  enableRowSelection = true,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  enableSorting = true,
  sorting: controlledSorting,
  onSortingChange,
  enableExpanding = false,
  getSubRows,
  expanded: controlledExpanded,
  onExpandedChange,
  defaultColumnPinning,
  pinnedRightGuard,
  rowHeight = DEFAULT_ROW_HEIGHT,
  emptyState,
  loadingState,
}: DataTableProps<TData>) {
  // ----- Internal state (not exposed to consumer) -----
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    defaultColumnPinning ?? {}
  );
  const [openColumnMenuId, setOpenColumnMenuId] = useState<string | null>(null);

  // ----- Fallback uncontrolled state for selection & sorting -----
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalExpanded, setInternalExpanded] = useState<ExpandedState>({});

  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const setRowSelection = onRowSelectionChange ?? setInternalRowSelection;
  const sorting = controlledSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;
  const expanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

  // ----- Pinning normalization -----
  const normalizeColumnPinning = useCallback(
    (pinning: ColumnPinningState) => {
      if (!pinnedRightGuard) return pinning;
      const right = pinning.right ?? [];
      const normalizedRight = [...right.filter((id) => id !== pinnedRightGuard)];
      if (right.includes(pinnedRightGuard)) {
        normalizedRight.push(pinnedRightGuard);
      }
      return {
        left: pinning.left,
        right: normalizedRight,
      };
    },
    [pinnedRightGuard]
  );

  useEffect(() => {
    setColumnPinning((prev) => normalizeColumnPinning(prev));
  }, [normalizeColumnPinning]);

  // ----- Default column order -----
  const defaultColumnOrder = useMemo(
    () => columns.map((c) => c.id ?? (c as { accessorKey?: string }).accessorKey ?? ""),
    [columns]
  );

  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(defaultColumnOrder);
    }
  }, [columnOrder.length, defaultColumnOrder]);

  // ----- Close column menu on sort change -----
  const sortKey = sorting[0] ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}` : "none";
  useEffect(() => {
    setOpenColumnMenuId(null);
  }, [sortKey]);

  // ----- Scroll container -----
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ----- Infinite scroll -----
  const totalFetched = data.length;

  const fetchMoreOnBottomReached = useCallback(
    (containerEl?: HTMLDivElement | null) => {
      if (!containerEl) return;
      const { scrollHeight, scrollTop, clientHeight } = containerEl;
      if (
        scrollHeight - scrollTop - clientHeight < 300 &&
        !isFetching &&
        totalFetched < totalRowCount
      ) {
        onFetchMore();
      }
    },
    [onFetchMore, isFetching, totalFetched, totalRowCount]
  );

  // Covers large-monitor case where initial content doesn't fill the viewport.
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  // ----- TanStack Table instance -----
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      columnOrder,
      columnSizing,
      columnPinning,
      columnVisibility,
      sorting,
      ...(enableExpanding ? { expanded } : {}),
    },
    getRowId,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: (updater) => {
      setColumnPinning((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return normalizeColumnPinning(next);
      });
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    enableRowSelection,
    enableSubRowSelection: enableExpanding,
    enableColumnResizing: true,
    enableSorting,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    // Expanding
    ...(enableExpanding
      ? {
          enableExpanding: true,
          getSubRows,
          onExpandedChange: setExpanded,
          getExpandedRowModel: getExpandedRowModel(),
        }
      : {}),
  });

  const { rows } = table.getRowModel();

  // ----- Virtualizer -----
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    getScrollElement: () => tableContainerRef.current,
    overscan: 12,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  // Depends on columnSizing and columnPinning which are the only things that
  // change the output of getPinningStyles.
  const cellPinningStyles = useMemo(() => {
    const map = new Map<string, CSSProperties>();
    for (const col of table.getAllLeafColumns()) {
      map.set(col.id, getPinningStyles(col));
    }
    return map;
  }, [table, columnSizing, columnPinning]);

  // ----- DnD -----
  const draggableColumnIds = useMemo(
    () => table.getCenterLeafColumns().map((c) => c.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnOrder, columnPinning, table]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setColumnOrder((prev) => {
        const order = prev.length ? prev : defaultColumnOrder;
        const oldIndex = order.indexOf(String(active.id));
        const newIndex = order.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(order, oldIndex, newIndex);
      });
    },
    [defaultColumnOrder]
  );

  const headers = table.getHeaderGroups()[0]?.headers ?? [];

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      modifiers={DND_MODIFIERS}
    >
      <div
        ref={tableContainerRef}
        onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}
        className="grid-scroll relative flex-1 overflow-auto"
      >
        <div style={{ width: table.getTotalSize(), minWidth: "100%" }}>
          {/* Header */}
          <div className="sticky top-0 z-10 flex w-fit min-w-full bg-canvas">
            <SortableContext items={draggableColumnIds} strategy={horizontalListSortingStrategy}>
              {headers.map((header) => (
                <DraggableColumnHeader
                  key={header.id}
                  header={header}
                  table={table}
                  menuOpen={openColumnMenuId === header.column.id}
                  onMenuOpenChange={(open) =>
                    setOpenColumnMenuId(open ? header.column.id : null)
                  }
                />
              ))}
            </SortableContext>
          </div>

          {/* Body */}
          {isLoading ? (
            loadingState ?? DEFAULT_LOADING_STATE
          ) : rows.length === 0 ? (
            emptyState ?? DEFAULT_EMPTY_STATE
          ) : (
            <div style={{ position: "relative" }}>
              {paddingTop > 0 && <div style={{ height: paddingTop }} />}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                const isSelected = row.getIsSelected();
                return (
                  <div
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className={cn(
                      "flex w-fit min-w-full border-b border-border transition-colors",
                      isSelected ? "bg-accent-soft" : "bg-surface hover:bg-canvas",
                      enableExpanding && row.depth > 0 && "bg-canvas/50"
                    )}
                    style={{ height: `${rowHeight}px` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        className={cn(
                          "flex shrink-0 items-center overflow-hidden border-r border-border px-3 text-[13px] text-ink",
                          cell.column.getIsPinned() && (isSelected ? "bg-accent-soft" : "bg-surface")
                        )}
                        style={cellPinningStyles.get(cell.column.id)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                );
              })}
              {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
