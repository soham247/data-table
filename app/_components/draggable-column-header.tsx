"use client";

import { useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EyeOff,
  GripVertical,
  Pin,
  PinOff,
  RotateCcw,
} from "lucide-react";
import type { Header, Table } from "@tanstack/react-table";
import type { Employee } from "@/types/employee";
import { getPinningStyles } from "@/lib/table-styles";
import { cn } from "@/lib/utils";

interface DraggableColumnHeaderProps {
  header: Header<Employee, unknown>;
  table: Table<Employee>;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}

export function DraggableColumnHeader({ header, table, menuOpen, onMenuOpenChange }: DraggableColumnHeaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const column = header.column;
  const isPinned = column.getIsPinned();
  const canPin = column.getCanPin() && column.id !== "select";
  const canSort = column.getCanSort() && column.id !== "select";
  const canHide = column.getCanHide() && column.id !== "select";
  const canDrag = column.id !== "select" && !isPinned;
  const canResize = column.getCanResize();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: !canDrag,
  });

  const pinStyles = getPinningStyles(column);

  const style = {
    ...pinStyles,
    transform: canDrag ? CSS.Translate.toString(transform) : undefined,
    transition: canDrag ? transition : undefined,
    zIndex: isDragging ? 20 : pinStyles.zIndex,
    opacity: isDragging ? 0.7 : 1,
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onMenuOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMenuOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, onMenuOpenChange]);

  const closeMenu = () => onMenuOpenChange(false);

  const openSortAscending = () => {
    table.setSorting([{ id: column.id, desc: false }]);
    closeMenu();
  };

  const openSortDescending = () => {
    table.setSorting([{ id: column.id, desc: true }]);
    closeMenu();
  };

  const clearSort = () => {
    table.resetSorting();
    closeMenu();
  };

  const pinLeft = () => {
    column.pin("left");
    closeMenu();
  };

  const pinRight = () => {
    column.pin("right");
    closeMenu();
  };

  const unpin = () => {
    column.pin(false);
    closeMenu();
  };

  const hideColumn = () => {
    column.toggleVisibility(false);
    closeMenu();
  };

  const resetTableLayout = () => {
    table.resetSorting();
    table.resetColumnVisibility();
    table.resetColumnOrder();
    table.resetColumnPinning();
    table.resetColumnSizing();
    closeMenu();
  };

  return (
    <div
      onClick={() => column.id !== "select" && onMenuOpenChange(!menuOpen)}
      ref={(node) => {
        setNodeRef(node);
        rootRef.current = node;
      }}
      style={style}
      className={cn(
        "group relative flex h-11 shrink-0 select-none items-center gap-1 border-b border-r border-border bg-canvas px-3 text-xs font-semibold uppercase tracking-wide text-ink-muted",
        isPinned && "bg-surface"
      )}
    >
      {canDrag && (
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
          className="-ml-1 flex size-4 cursor-grab items-center justify-center text-ink-faint opacity-0 outline-none transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Reorder column"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}

      {header.isPlaceholder ? null : (
        <div
          className="flex min-w-0 flex-1 items-center truncate text-left normal-case tracking-normal text-ink outline-none transition-colors hover:text-accent"
          aria-label={`Open ${column.id} column menu`}
        >
          <span className="truncate">
            {typeof header.column.columnDef.header === "function"
              ? header.column.columnDef.header(header.getContext())
              : header.column.columnDef.header}
          </span>
        </div>
      )}

      {menuOpen && column.id !== "select" && (
        <div
          className="absolute left-2 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          {canSort && (
            <>
              <button
                type="button"
                onClick={openSortAscending}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
              >
                <ArrowUp className="size-3.5 text-ink-faint" />
                Sort ascending
              </button>
              <button
                type="button"
                onClick={openSortDescending}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
              >
                <ArrowDown className="size-3.5 text-ink-faint" />
                Sort descending
              </button>
              <button
                type="button"
                onClick={clearSort}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
              >
                <ArrowUpDown className="size-3.5 text-ink-faint" />
                Clear sorting
              </button>
            </>
          )}

          {canSort && (canPin || canHide) && <div className="my-1 h-px bg-border" />}

          {canPin && (
            <>
              <button
                type="button"
                onClick={pinLeft}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
              >
                <Pin className="size-3.5 text-ink-faint" />
                Pin left
              </button>
              <button
                type="button"
                onClick={pinRight}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
              >
                <Pin className="size-3.5 rotate-180 text-ink-faint" />
                Pin right
              </button>
              {isPinned && (
                <button
                  type="button"
                  onClick={unpin}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
                >
                  <PinOff className="size-3.5 text-ink-faint" />
                  Unpin column
                </button>
              )}
            </>
          )}

          {canPin && canHide && <div className="my-1 h-px bg-border" />}

          {canHide && (
            <button
              type="button"
              onClick={hideColumn}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
            >
              <EyeOff className="size-3.5 text-ink-faint" />
              Hide column
            </button>
          )}

          <button
            type="button"
            onClick={resetTableLayout}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
          >
            <RotateCcw className="size-3.5 text-ink-faint" />
            Reset table layout
          </button>
        </div>
      )}

      {canResize && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            "absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none",
            header.column.getIsResizing() ? "bg-accent" : "hover:bg-accent/60"
          )}
        />
      )}
    </div>
  );
}
