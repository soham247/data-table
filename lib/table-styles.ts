import type { Column } from "@tanstack/react-table";
import type { CSSProperties } from "react";

/**
 * Computes sticky positioning + boundary shadow for a pinned column so
 * header cells and body cells stay perfectly aligned while scrolling
 * horizontally through a wide, high-column-count table.
 */
export function getPinningStyles<T>(column: Column<T, unknown>): CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinned = isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinned = isPinned === "right" && column.getIsFirstColumn("right");

  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
    boxShadow: isLastLeftPinned
      ? "2px 0 8px -2px rgba(16, 19, 26, 0.12)"
      : isFirstRightPinned
        ? "-2px 0 8px -2px rgba(16, 19, 26, 0.12)"
        : undefined,
  };
}
